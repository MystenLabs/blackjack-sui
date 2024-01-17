import { SuiClient, SuiEvent } from "@mysten/sui.js/client";
import { Server } from "socket.io";
import { houseHitOrStand } from "./helpers/scenarios/houseHitOrStand";
import { doInitialDeal } from "./helpers/scenarios/doinitialDeal";
import { getKeypair } from "./helpers/keypair/getKeyPair";
import { GameMessage } from "./types/GameMessage";
import {
  PACKAGE_ADDRESS,
  SUI_NETWORK,
  ADMIN_SECRET_KEY,
  HOUSE_DATA_ID,
} from "./config";
import { HitDoneEvent } from "./types/HitDoneEvent";

const io = new Server(8080, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const suiClient = new SuiClient({
  url: SUI_NETWORK,
});

const keypairAdmin = getKeypair(ADMIN_SECRET_KEY!);

console.log("Connecting to SUI network: ", SUI_NETWORK);
console.log("HOUSE_DATA_ID: ", HOUSE_DATA_ID);
console.log("Signer Address: ", keypairAdmin.getPublicKey().toSuiAddress());
console.log("PACKAGE_ADDRESS: ", PACKAGE_ADDRESS);

const onInitialDealSuccess = (gameId: string) => {
  const gameMessage: GameMessage = {
    gameId: gameId,
  };
  io.emit("dealExecuted", gameMessage);
};

const onHitSuccess = (event: SuiEvent) => {
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
};

const onStandSuccess = (gameId: string) => {
  const gameMessage: GameMessage = {
    gameId: gameId,
    playerCards: [],
    playerScore: "",
  };

  io.emit("StandExecuted", gameMessage);
};

io.on("connection", (socket) => {
  console.log("a user connected");

  // send a message to the client
  socket.emit("hello from server", 1, "2", { 3: Buffer.from([4]) });

  // receive a message from the client
  socket.on("game", (...args) => {
    const game: GameMessage = args[0];
    console.log("Client sent a game message: ", game);
  });

  socket.on("gameCreated", (...args) => {
    const game: GameMessage = args[0];
    console.log("GameCreatedEvent Event Received! GameId = ", game.gameId);
    doInitialDeal({
      gameId: game.gameId,
      houseDataId: HOUSE_DATA_ID,
      suiClient,
      onSuccess: onInitialDealSuccess,
    });
  });

  socket.on("hitRequested", (...args) => {
    const game: GameMessage = args[0];
    console.log("Client requested hit for game = ", game.gameId);
    houseHitOrStand({
      eventParsedJson: {
        gameId: game.gameId,
        current_player_hand_sum: parseInt(game.playerScore!),
      },
      move: "hit",
      suiClient,
      onHitSuccess,
    });
  });

  socket.on("StandRequested", (...args) => {
    const game: GameMessage = args[0];
    console.log("Stand requested for game = ", game.gameId);
    houseHitOrStand({
      eventParsedJson: {
        gameId: game.gameId,
        current_player_hand_sum: parseInt(game.playerScore!),
      },
      move: "stand",
      suiClient,
      onStandSuccess,
    });
  });
});
