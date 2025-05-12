import type { User, NewUserInput } from "../types.js";
import type { PrimaryResponseMessage } from "../ipcTypes.js";
import { v4 as uuidv4 } from "uuid";
import process from "node:process";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId?: NodeJS.Timeout;
};

const pendingRequests = new Map<string, PendingRequest>();

process.on("message", (msg: unknown) => {
  if (
    typeof msg !== "object" ||
    msg === null ||
    !("requestId" in msg) ||
    typeof msg.requestId !== "string"
  ) {
    console.error(
      `Worker ${process.pid} received invalid message structure from primary:`,
      msg
    );
    return;
  }

  const responseMsg = msg as PrimaryResponseMessage;
  const { requestId, payload, error } = responseMsg;

  const promiseFuncs = pendingRequests.get(requestId);

  if (promiseFuncs) {
    if (promiseFuncs.timeoutId) {
      clearTimeout(promiseFuncs.timeoutId);
    }

    if (error) {
      console.error(
        `Worker ${process.pid} received error for reqId ${requestId}: ${error}`
      );
      promiseFuncs.reject(new Error(error));
    } else {
      promiseFuncs.resolve(payload);
    }
    pendingRequests.delete(requestId);
  } else {
    console.warn(
      `Worker ${process.pid} received message for unknown/timed-out reqId: ${requestId}`
    );
  }
});

function sendRequestToPrimary<T>(
  type: string,
  payload?: unknown,
  timeoutMs = 5000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!process.send) {
      return reject(
        new Error(
          "IPC channel (process.send) is not available in this context."
        )
      );
    }

    const requestId = uuidv4();

    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        console.error(
          `IPC request ${requestId} (${type}) timed out after ${timeoutMs}ms`
        );
        reject(new Error(`IPC Request timed out (${type})`));
      }
    }, timeoutMs);

    pendingRequests.set(requestId, {
      resolve: resolve as (value: unknown) => void,
      reject: reject as (reason?: unknown) => void,
      timeoutId,
    });

    try {
      process.send({ type, payload, requestId });
    } catch (sendError: unknown) {
      if (pendingRequests.has(requestId)) {
        clearTimeout(timeoutId);
        pendingRequests.delete(requestId);
      }
      console.error(
        `Worker ${process.pid} failed to send IPC message ${type} (reqId: ${requestId}):`,
        sendError
      );
      if (sendError instanceof Error) {
        reject(sendError);
      } else {
        reject(new Error("Failed to send IPC message"));
      }
    }
  });
}

export const findAllUsersAsync = async (): Promise<User[]> => {
  const result = await sendRequestToPrimary<unknown[]>("getAllUsers");
  if (!Array.isArray(result))
    throw new Error("Invalid response type for getAllUsers");
  return result as User[];
};

export const findUserByIdAsync = async (
  id: string
): Promise<User | undefined> => {
  const result = await sendRequestToPrimary<unknown>("getUserById", { id });
  if (
    result !== undefined &&
    (typeof result !== "object" || result === null || !("id" in result))
  ) {
    return undefined;
  }
  return result as User | undefined;
};

export const saveUserAsync = async (userData: NewUserInput): Promise<User> => {
  const result = await sendRequestToPrimary<unknown>("createUser", userData);
  if (typeof result !== "object" || result === null || !("id" in result))
    throw new Error("Invalid response type for createUser");
  return result as User;
};

export const updateUserInStoreAsync = async (
  id: string,
  updates: NewUserInput
): Promise<User | null> => {
  const result = await sendRequestToPrimary<unknown>("updateUser", {
    id,
    data: updates,
  });
  if (result !== null && (typeof result !== "object" || !("id" in result)))
    throw new Error("Invalid response type for updateUser");
  return result as User | null;
};

export const deleteUserFromStoreAsync = async (
  id: string
): Promise<boolean> => {
  const result = await sendRequestToPrimary<unknown>("deleteUser", { id });
  if (typeof result !== "boolean")
    throw new Error("Invalid response type for deleteUser");
  return result;
};
