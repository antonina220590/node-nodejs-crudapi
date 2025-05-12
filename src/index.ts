import http from "http";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  router(req, res);
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
