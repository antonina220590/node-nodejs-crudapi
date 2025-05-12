import http from "http";
import * as userController from "./controllers/userController.js";
type Request = http.IncomingMessage;
type Response = http.ServerResponse;

const router = async (req: Request, res: Response): Promise<void> => {
  const { method, url } = req;
  console.log(`Request received: Method = ${method}, URL - ${url}`);

  const userByIdRegex = /^\/api\/users\/([a-zA-Z0-9-]+)$/;
  const userByIdMatch = url?.match(userByIdRegex);

  if (method === "GET" && url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Welcome to CRUD API!",
        documentation: `Try this endpoint: GET /api/users`,
      })
    );
  } else if (method === "GET" && url === "/api/users") {
    await userController.getAllUsersController(req, res);
  } else if (method === "GET" && userByIdMatch) {
    const userId = userByIdMatch[1];
    await userController.getUserByIdController(req, res, userId);
  } else if (method === "POST" && url === "/api/users") {
    userController.createUserController(req, res);
  } else if (method === "PUT" && userByIdMatch) {
    const userId = userByIdMatch[1];
    userController.updateUserController(req, res, userId);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Error 404" }));
  }
};

export default router;
