import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "http";
import { PORT } from "./utils/config";
import { StatusCodes } from "http-status-codes";
import { logger } from "./utils/logger";
import bodyParser from "body-parser";
import { Server } from "socket.io";

const app = express();
app.use(bodyParser.json());
app.use(helmet());
app.use(
  cors({
    origin: "*",
  })
);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req: Request, res: Response) => {
  logger.info("GET: /");
  res.status(StatusCodes.OK).json({
    message: "Hello World!",
  });
});

io.on("connection", (socket) => {
  logger.info("A user connected");
  socket.on("disconnect", () => {
    logger.info("A user disconnected");
  });
});

server.listen(PORT || 3000, () => {
  logger.info(`Server is running on port ${PORT || 3000}`);
});
