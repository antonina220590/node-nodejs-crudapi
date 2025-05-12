import http from "http";
import * as userService from "../services/userService.js";
import { User } from "../types.js";
import { validate as isValidUuid } from "uuid";

export const getAllUsersController = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
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
  userId: string
): Promise<void> => {
  try {
    if (!isValidUuid(userId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `Error 400: userId '${userId}' in not valid UUID`,
        })
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
        })
      );
    }
  } catch (error) {
    console.error(
      `Error in getUserByIdController using by ID ${userId}:`,
      error
    );
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
};
