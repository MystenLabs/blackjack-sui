import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { PORT } from "./utils/config";
import { StatusCodes } from "http-status-codes";
import { logger } from "./utils/logger";

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  logger.info("GET: /");
  res.status(StatusCodes.OK).json({
    message: "Hello World!",
  });
});

app.listen(PORT || 3000, () => {
  logger.info(`Server is running on port ${PORT || 3000}`);
});
