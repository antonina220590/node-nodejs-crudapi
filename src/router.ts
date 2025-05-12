import http from "http";
import * as userController from "./controllers/userController.js";

type Request = http.IncomingMessage;
type Response = http.ServerResponse;

const router = async (req: Request, res: Response): Promise<void> => {
  const { method, url } = req;
  console.log(`Request received: Method = ${method}, URL - ${url}`);

  if (method === "GET" && url === "/api/users") {
    await userController.getAllUsersController(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Error 404" }));
  }
};

export default router;
