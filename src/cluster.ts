import cluster from "node:cluster";
import type { Worker } from "node:cluster";
import os from "node:os";
import http from "node:http";
import process from "node:process";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import type { User, NewUserInput } from "./types.js";
import {
  type WorkerRequestMessage,
  type PrimaryResponseMessage,
  isNewUserInput,
  isUpdateUserPayload,
} from "./ipcTypes.js";
import router from "./router.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000", 10);
const numCPUs = os.cpus().length;
const numWorkers = numCPUs > 1 ? numCPUs - 1 : 1;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  let usersDB: User[] = [
    {
      id: uuidv4(),
      username: "Andrew",
      age: 30,
      hobbies: ["coding", "reading"],
    },
  ];
  const getAllUsers = (): User[] => {
    console.log(`Primary DB: Requested all users (${usersDB.length})`);
    return [...usersDB];
  };

  const getUserById = (id: string): User | undefined => {
    console.log(`Primary DB: Requested user by ID: ${id}`);
    return usersDB.find((u) => u.id === id);
  };

  const createUser = (userData: NewUserInput): User => {
    const newUser: User = { id: uuidv4(), ...userData };
    usersDB.push(newUser);
    console.log(
      `Primary DB: User created - ID: ${newUser.id}, Username: ${newUser.username}`
    );
    return { ...newUser };
  };

  const updateUser = (id: string, userData: NewUserInput): User | null => {
    const userIndex = usersDB.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      console.log(`Primary DB: Update failed - User not found: ${id}`);
      return null;
    }
    usersDB[userIndex] = { ...usersDB[userIndex], ...userData };
    console.log(`Primary DB: User updated - ID: ${id}`);
    return { ...usersDB[userIndex] };
  };

  const deleteUser = (id: string): boolean => {
    const initialLength = usersDB.length;
    usersDB = usersDB.filter((u) => u.id !== id);
    const success = usersDB.length < initialLength;
    if (success) {
      console.log(`Primary DB: User deleted - ID: ${id}`);
    } else {
      console.log(`Primary DB: Delete failed - User not found: ${id}`);
    }
    return success;
  };

  const workersData: { port: number; worker: Worker }[] = [];
  let nextWorkerIndex = 0;

  const handleWorkerMessage = (worker: Worker, msg: unknown) => {
    if (
      typeof msg !== "object" ||
      msg === null ||
      !("requestId" in msg) ||
      typeof msg.requestId !== "string"
    ) {
      console.error(
        `Primary received structurally invalid message from worker ${worker.id}:`,
        msg
      );
      try {
        worker.send({
          type: "error",
          requestId: (msg as { requestId?: unknown })?.requestId ?? "unknown",
          error: "Invalid message structure (missing requestId)",
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }
    const { requestId } = msg as { requestId: string };

    if (!("type" in msg) || typeof msg.type !== "string") {
      console.error(
        `Primary received invalid message (missing/invalid type) from worker ${worker.id}, reqId: ${requestId}`
      );
      try {
        worker.send({
          type: "error",
          requestId,
          error: "Invalid message structure (missing/invalid type)",
        });
      } catch (e) {
        console.log(e);
      }
      return;
    }

    const requestMsg = msg as WorkerRequestMessage;
    const { type, payload } = requestMsg;

    let responsePayload: unknown = undefined;
    let responseError: string | null = null;

    console.log(
      `Primary received: ${type} (reqId: ${requestId}) from worker ${worker.id}`
    );

    try {
      switch (type) {
        case "getAllUsers":
          responsePayload = getAllUsers();
          break;
        case "getUserById":
          if (
            payload &&
            typeof payload === "object" &&
            "id" in payload &&
            typeof payload.id === "string"
          ) {
            responsePayload = getUserById(payload.id);
          } else {
            throw new Error(
              `Invalid payload for getUserById: Expected { id: string }`
            );
          }
          break;
        case "createUser":
          if (isNewUserInput(payload)) {
            responsePayload = createUser(payload);
          } else {
            throw new Error(
              `Invalid payload for createUser: Expected NewUserInput`
            );
          }
          break;
        case "updateUser":
          if (isUpdateUserPayload(payload)) {
            responsePayload = updateUser(payload.id, payload.data);
          } else {
            throw new Error(
              `Invalid payload for updateUser: Expected { id: string, data: NewUserInput }`
            );
          }
          break;
        case "deleteUser":
          if (
            payload &&
            typeof payload === "object" &&
            "id" in payload &&
            typeof payload.id === "string"
          ) {
            responsePayload = deleteUser(payload.id);
          } else {
            throw new Error(
              `Invalid payload for deleteUser: Expected { id: string }`
            );
          }
          break;
        default: {
          const unknownType: string = requestMsg.type;
          console.warn(`Primary received unknown message type: ${unknownType}`);
          responseError = `Unknown message type received: ${unknownType}`;
          break;
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          `Error processing message type ${type} for reqId ${requestId}: ${error.message}`
        );
        responseError = error.message;
      } else {
        console.error(
          `Error processing message type ${type} for reqId ${requestId}: Unknown error object thrown`
        );
        responseError =
          "An unknown internal error occurred in primary process while processing request";
      }
    }

    const responseMsg: PrimaryResponseMessage = {
      type: type + "Response",
      requestId: requestId,
      payload: responsePayload,
      error: responseError,
    };
    try {
      worker.send(responseMsg);
    } catch (sendError: unknown) {
      if (sendError instanceof Error) {
        console.error(
          `Primary failed to send response for reqId ${requestId} to worker ${worker.id}: ${sendError.message}`
        );
      } else {
        console.error(
          `Primary failed to send response for reqId ${requestId} to worker ${worker.id}: Unknown send error`
        );
      }
    }
  };

  console.log(`Forking ${numWorkers} workers...`);
  for (let i = 0; i < numWorkers; i++) {
    const workerPort = PORT + 1 + i;
    const workerEnv = { WORKER_PORT: workerPort.toString() };
    const worker = cluster.fork(workerEnv);

    workersData.push({ port: workerPort, worker: worker });
    console.log(
      `Worker started with PID ${worker.process.pid} on port ${workerPort}`
    );

    worker.on("message", (msg) => handleWorkerMessage(worker, msg));
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died with code ${code} and signal ${signal}. Restarting...`
    );
    const deadWorkerIndex = workersData.findIndex(
      (w) => w.worker.id === worker.id
    );

    if (deadWorkerIndex !== -1) {
      const workerPort = workersData[deadWorkerIndex].port;
      const workerEnv = { WORKER_PORT: workerPort.toString() };
      const newWorker = cluster.fork(workerEnv);

      newWorker.on("message", (msg) => handleWorkerMessage(newWorker, msg));

      workersData[deadWorkerIndex] = { port: workerPort, worker: newWorker };
      console.log(
        `New worker started with PID ${newWorker.process.pid} on port ${workerPort}`
      );
    } else {
      console.error(
        "CRITICAL: Could not find worker data to restart. Worker list might be inconsistent."
      );
    }
  });

  const balancerServer = http.createServer((req, res) => {
    if (workersData.length === 0) {
      console.error("No workers available!");
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Service Unavailable: No workers running" })
      );
      return;
    }

    let attempts = 0;
    let workerInfo: { port: number; worker: Worker } | undefined;
    do {
      workerInfo = workersData[nextWorkerIndex];
      nextWorkerIndex = (nextWorkerIndex + 1) % workersData.length;
      attempts++;
      if (workerInfo?.worker?.isDead?.()) {
        console.warn(
          `Worker ${workerInfo.worker.id} on port ${workerInfo.port} is dead, trying next.`
        );
        workerInfo = undefined;
      }
    } while (!workerInfo && attempts < workersData.length);

    if (!workerInfo) {
      console.error("No live workers available after checking all!");
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Service Unavailable: No live workers available",
        })
      );
      return;
    }

    const targetPort = workerInfo.port;
    console.log(
      `Balancing request to worker ${workerInfo.worker.id} on port ${targetPort}`
    );
    const options = {
      hostname: "localhost",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      console.error(`Proxy error to worker ${targetPort}: ${err.message}`);
      try {
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "Bad Gateway: Error connecting to worker",
            })
          );
        } else if (!res.writableEnded) {
          res.end();
        }
      } catch (e) {
        console.error("Error sending proxy error response:", e);
      }
    });
    req.pipe(proxyReq, { end: true });
  });

  balancerServer.listen(PORT, () => {
    console.log(`Load Balancer is running on port ${PORT}`);
  });
} else {
  const workerPort = parseInt(process.env.WORKER_PORT || "0", 10);

  if (!workerPort) {
    console.error(
      `Worker ${process.pid} could not determine its port from WORKER_PORT env var. Exiting.`
    );
    process.exit(1);
  }

  const workerServer = http.createServer((req, res) => {
    void router(req, res);
  });

  workerServer.on("error", (error: unknown) => {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === "EADDRINUSE"
    ) {
      console.error(
        `CRITICAL Worker ${process.pid}: Port ${workerPort} is already in use! Exiting.`
      );
      process.exit(1);
    } else if (error instanceof Error) {
      console.error(
        `Worker ${process.pid}: Server error on port ${workerPort} - ${error.message}`
      );
    } else {
      console.error(
        `Worker ${process.pid}: Unknown server error occurred on port ${workerPort}.`
      );
    }
  });

  console.log(
    `Worker ${process.pid} attempting to listen on actual port: ${workerPort}`
  );
  workerServer.listen(workerPort, () => {
    console.log(
      `Worker ${process.pid} started and listening on port ${workerPort}`
    );
  });
}
