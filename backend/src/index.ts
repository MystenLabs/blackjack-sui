import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { PORT } from "./utils/config";
import { StatusCodes } from "http-status-codes";

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    message: "Hello World!",
  });
});

app.listen(PORT || 3000, () => {
  console.log(`Server is running on port ${PORT || 3000}`);
});
