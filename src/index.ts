import http from "http";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  const responseBody = {
    message: "Server works! Welcome to CRUD API",
    currentUrl: req.url,
    method: req.method,
  };

  res.end(JSON.stringify(responseBody));
});

server.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);

  if (process.env.NODE_ENV === "development") {
    console.log(`Available here: http://localhost:${PORT}`);
  }
});

server.on("error", (error) => {
  if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
    console.error(`Ошибка: Порт ${PORT} уже используется.`);
  } else {
    console.error(`Ошибка сервера: ${error.message}`);
  }
  process.exit(1);
});
