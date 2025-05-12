import http from "http";
import * as userService from "../services/userService.js";
import { User, NewUserInput } from "../types.js";
import { validate as isValidUuid } from "uuid";

export const getAllUsersController = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> => {
  try {
    const users: User[] = await userService.getAllUsers();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
  } catch (error) {
    console.error("Error in getAllUsersController:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};

export const getUserByIdController = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  userId: string,
): Promise<void> => {
  try {
    if (!isValidUuid(userId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `Error 400: userId '${userId}' in not valid UUID`,
        }),
      );
      return;
    }

    const user = await userService.fetchUserById(userId);

    if (user) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `Error 404: User with ID '${userId}' is not found`,
        }),
      );
    }
  } catch (error) {
    console.error(
      `Error in getUserByIdController using by ID ${userId}:`,
      error,
    );
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};

const handleCreateUserRequest = async (
  body: string,
  res: http.ServerResponse,
): Promise<void> => {
  try {
    const parsedData = JSON.parse(body) as unknown;
    if (
      typeof parsedData === "object" &&
      parsedData !== null &&
      "username" in parsedData &&
      typeof (parsedData as { username: unknown }).username === "string" &&
      "age" in parsedData &&
      typeof (parsedData as { age: unknown }).age === "number" &&
      "hobbies" in parsedData &&
      Array.isArray((parsedData as { hobbies: unknown }).hobbies) &&
      (parsedData as { hobbies: unknown[] }).hobbies.every(
        (hobby: unknown) => typeof hobby === "string",
      )
    ) {
      const { username, age, hobbies } = parsedData as {
        username: string;
        age: number;
        hobbies: string[];
      };

      const newUserInput: NewUserInput = { username, age, hobbies };
      const createdUser = await userService.addNewUser(newUserInput);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(createdUser));
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message:
            "Error 400: Request body doesn't have info (username, age, hobbies)",
        }),
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(
        "JSON parsing error in handleCreateUserRequest:",
        error.message,
      );
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Error 400: Incorrect JSON in request body",
        }),
      );
    } else if (error instanceof Error) {
      console.error("Error in handleCreateUserRequest:", error.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Internal server error",
          details: error.message,
        }),
      );
    } else {
      console.error("Uncaught error in handleCreateUserRequest:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Internal server error",
        }),
      );
    }
  }
};

export const createUserController = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
): void => {
  let body = "";
  req.on("data", (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on("error", (err) => {
    console.error("Error:", err);
    if (!res.writableEnded) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Internal server error",
        }),
      );
    }
  });

  req.on("end", () => {
    void handleCreateUserRequest(body, res);
  });
};

const handleUpdateUserRequest = async (
  userId: string,
  body: string,
  res: http.ServerResponse,
): Promise<void> => {
  try {
    const parsedBody = JSON.parse(body) as unknown;
    if (
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "username" in parsedBody &&
      typeof (parsedBody as { username: unknown }).username === "string" &&
      "age" in parsedBody &&
      typeof (parsedBody as { age: unknown }).age === "number" &&
      "hobbies" in parsedBody &&
      Array.isArray((parsedBody as { hobbies: unknown }).hobbies) &&
      (parsedBody as { hobbies: unknown[] }).hobbies.every(
        (hobby: unknown) => typeof hobby === "string",
      )
    ) {
      const { username, age, hobbies } = parsedBody as {
        username: string;
        age: number;
        hobbies: string[];
      };
      const userDataToUpdate: NewUserInput = { username, age, hobbies };

      const updatedUser = await userService.modifyUser(
        userId,
        userDataToUpdate,
      );

      if (updatedUser) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(updatedUser));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: `Error 404: User with ID '${userId}' not found`,
          }),
        );
      }
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message:
            "Error 400: Request body does not contain required fields (username, age, hobbies) or they have incorrect types",
        }),
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(
        "JSON parsing error in handleUpdateUserRequest:",
        error.message,
      );
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Error 400: Invalid JSON in request body" }),
      );
    } else if (error instanceof Error) {
      console.error(
        `Error in handleUpdateUserRequest for user ID ${userId}:`,
        error.message,
      );
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Internal server error",
          details: error.message,
        }),
      );
    } else {
      console.error(
        `Unknown error in handleUpdateUserRequest for user ID ${userId}:`,
        error,
      );
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Internal server error (unknown error)" }),
      );
    }
  }
};

export const updateUserController = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  userId: string,
): void => {
  if (!isValidUuid(userId)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: `Error 400: userId '${userId}' is not a valid UUID`,
      }),
    );
    return;
  }

  let body = "";
  req.on("data", (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on("error", (err) => {
    console.error("Request stream error:", err);
    if (!res.writableEnded) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Internal server error while reading request",
        }),
      );
    }
  });

  req.on("end", () => {
    void handleUpdateUserRequest(userId, body, res);
  });
};

export const deleteUserController = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  userId: string,
): Promise<void> => {
  try {
    if (!isValidUuid(userId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `Error 400: User ID '${userId}' is not a valid UUID`,
        }),
      );
      return;
    }
    const wasDeleted = await userService.removeUserById(userId);
    if (wasDeleted) {
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `Error 404: User with ID '${userId}' not found`,
        }),
      );
    }
  } catch (error) {
    console.error(
      `Error in deleteUserController for user ID ${userId}:`,
      error,
    );
    if (!res.headersSent && !res.writableEnded) {
      if (error instanceof Error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Internal server error",
            details: error.message,
          }),
        );
      } else {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ message: "Internal server error (unknown error)" }),
        );
      }
    } else if (!res.writableEnded) {
      res.end();
    }
  }
};
