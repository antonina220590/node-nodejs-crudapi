import http from "http";

type Request = http.IncomingMessage;
type Response = http.ServerResponse;

const router = (req: Request, res: Response): void => {
  const { method, url } = req;
  console.log(`Request received: Method = ${method}, URL - ${url}`);

  if (method === "GET" && url === "/api/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "List of users (will be added soon)" }));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Error 404" }));
  }
};

export default router;
