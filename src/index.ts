import http from "http";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  void router(req, res);
});

server.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);

  if (process.env.NODE_ENV === "development") {
    console.log(`Available here: http://localhost:${PORT}/api/users`);
  }
});

server.on("error", (error) => {
  if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
    console.error(`Error: Port ${PORT} is already in use.`);
  } else {
    console.error(`Server error: ${error.message}`);
  }
  process.exit(1);
});
