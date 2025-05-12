import http from "http";
import * as userService from "../services/userService.js";
import { User } from "../types.js";

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
