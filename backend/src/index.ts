import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "http";
import { HOUSE_DATA_ID, PORT, SUI_NETWORK } from "./utils/config";
import { StatusCodes } from "http-status-codes";
import { logger } from "./utils/logger";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import { doInitialDeal } from "./services/doInitialDeal";
import { SuiClient, SuiEvent } from "@mysten/sui.js/client";
import { houseHitOrStand } from "./services/houseHitOrStand";
import { HitDoneEvent } from "./types/HitDoneEvent";
import { GameMessage } from "./types/GameMessage";

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
    methods: ["GET", "POST"],
  },
});

const suiClient = new SuiClient({
  url: SUI_NETWORK,
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

  socket.on("gameCreated", (...args) => {
    const { gameId } = args[0];
    logger.info(`Received game created message: ${gameId}`);
    doInitialDeal({
      gameId,
      suiClient,
      houseDataId: HOUSE_DATA_ID,
      onSuccess: () => {
        io.emit("dealExecuted", { gameId });
      },
    });
  });

  socket.on("hitRequested", (...args) => {
    const { gameId } = args[0];
    logger.info(`Received hit requested message: ${gameId}`);
    houseHitOrStand({
      gameId,
      move: "hit",
      suiClient,
      onHitSuccess: (event: SuiEvent) => {
        const {
          game_id: gameId,
          player_cards: playerCards,
          current_player_hand_sum: playerScore,
        } = event?.parsedJson as HitDoneEvent;
        const gameMessage: GameMessage = {
          gameId,
          playerCards,
          playerScore,
        };
        io.emit("hitExecuted", gameMessage);
      },
      houseDataId: HOUSE_DATA_ID,
    });
  });

  socket.on("standRequested", (...args) => {
    const { gameId } = args[0];
    logger.info(`Received stand requested message: ${gameId}`);
    houseHitOrStand({
      gameId,
      move: "stand",
      suiClient,
      onStandSuccess: (gameId: string) => {
        const gameMessage: GameMessage = {
          gameId: gameId,
          playerCards: [], // unused
          playerScore: "", // unused
        };
        io.emit("standExecuted", gameMessage);
      },
      houseDataId: HOUSE_DATA_ID,
    });
  });
});

server.listen(PORT || 3000, () => {
  logger.info(`Server is running on port ${PORT || 3000}`);
});
