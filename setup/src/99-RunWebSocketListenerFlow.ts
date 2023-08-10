import {
    Connection,
    Ed25519Keypair, fromB64,
    JsonRpcProvider,
    RawSigner, SuiEvent, SuiMoveObject,
    TransactionBlock,
} from "@mysten/sui.js";
import {
    PACKAGE_ADDRESS,
    SUI_NETWORK, ADMIN_SECRET_KEY, HOUSE_DATA_ID, deriveBLS_SecretKey,
} from "./config";

import * as bls from "@noble/bls12-381";

import {bytesToHex} from "@noble/hashes/utils";
import {utils} from "@noble/bls12-381";

import { Server } from "socket.io";

const io = new Server(8080,{
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});



let privateKeyArray = Uint8Array.from(Array.from(fromB64(ADMIN_SECRET_KEY!)));

const keypairAdmin = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));

const connection = new Connection({
    fullnode: SUI_NETWORK,
});
const provider = new JsonRpcProvider(connection);
const houseSigner = new RawSigner(keypairAdmin, provider);


console.log("Connecting to SUI network: ", SUI_NETWORK);

console.log("HOUSE_DATA_ID: ", HOUSE_DATA_ID);
console.log("Signer Address: ", keypairAdmin.getPublicKey().toSuiAddress());
console.log("PACKAGE_ADDRESS: ", PACKAGE_ADDRESS);

const doInitialDeal = async (gameId:string) => {

    const tx = new TransactionBlock();

    await provider.getObject({
        id: gameId,
        options: { showContent: true },
    }).then(async (res) => {

        const gameObject = res?.data?.content as SuiMoveObject;
        const gameStatus = gameObject.fields.status;

        if(gameStatus !== 0) {
            console.log(`Wrong Game status! [${gameStatus}] ]`)
            console.log("Game is completed, cannot continue!");
            return;
        }

        // const gameIdHex = gameId.replace("0x","");
        // const counterHex = bytesToHex(Uint8Array.from([gameObject.fields.counter]));
        // const messageToSign = gameIdHex.concat(randomnessHexString).concat(counterHex);

        const randomnessHexString = bytesToHex(Uint8Array.from(gameObject.fields.user_randomness));

        let signedHouseHash = await bls.sign(randomnessHexString, deriveBLS_SecretKey(ADMIN_SECRET_KEY!));

        console.log("GAME_ID Bytes = ", utils.hexToBytes(gameId.replace("0x","")));
        console.log("randomness = ", gameObject.fields.user_randomness);

        tx.setGasBudget(10000000000);

        tx.moveCall({
            target: `${PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
            arguments: [
                tx.object(gameId),
                tx.pure(Array.from(signedHouseHash), "vector<u8>"),
                tx.object(HOUSE_DATA_ID)
            ],
        });

        await houseSigner
            .signAndExecuteTransactionBlock({
                transactionBlock: tx,
                requestType: "WaitForLocalExecution",
                options: {
                    showObjectChanges: true,
                    showEffects: true,
                },
            })
            .then(function (res) {
                const status = res?.effects?.status.status;

                if (status === "success") {
                    console.log("Initial Deal executed! status = ", status);

                    const gameMessage : GameMessage =  {
                        gameId: gameId,
                    };
                    io.emit("dealExecuted", gameMessage);
                }
                if (status == "failure") {
                    console.log("Error = ", res?.effects);
                }
            }).catch(err => {
                console.log("Error = ", err);
                console.log(err.data);
            });


    });


};



async function doHit(gameId: string) {

    console.log("do hit for game id: ", gameId);

    provider.getObject({
        id: gameId,
        options: {showContent: true},
    }).then(async (res) => {

        const tx = new TransactionBlock();
        const gameObject = res?.data?.content as SuiMoveObject;
        const gameIdHex = gameId.replace("0x", "");
        const counterHex = bytesToHex(Uint8Array.from([gameObject.fields.counter]));
        const randomnessHexString = bytesToHex(Uint8Array.from(gameObject.fields.user_randomness));

        //const messageToSign = gameIdHex.concat(randomnessHexString).concat(counterHex);

        let signedHouseHash = await bls.sign(randomnessHexString, deriveBLS_SecretKey(ADMIN_SECRET_KEY!));

        console.log("GAME_ID Bytes = ", utils.hexToBytes(gameId.replace("0x", "")));
        console.log("randomness = ", gameObject.fields.user_randomness);
        console.log("counter = ", counterHex);

        tx.setGasBudget(10000000000);

        tx.moveCall({
            target: `${PACKAGE_ADDRESS}::single_player_blackjack::hit`,
            arguments: [
                tx.object(gameId),
                tx.pure(Array.from(signedHouseHash), "vector<u8>"),
                tx.object(HOUSE_DATA_ID)
            ],
        });

        await houseSigner
            .signAndExecuteTransactionBlock({
                transactionBlock: tx,
                requestType: "WaitForLocalExecution",
                options: {
                    showObjectChanges: true,
                    showEffects: true,
                    showEvents:true
                },
            })
            .then(function (res) {
                const status = res?.effects?.status.status;
                if (status === "success") {
                    console.log("Hit executed! status = ", status);

                    const events = res.events;

                    const hitDoneEvent=
                        events?.filter((event =>event.type.endsWith("HitDone")))[0];

                    const gameMessage : GameMessage =  {
                        gameId: hitDoneEvent?.parsedJson?.game_id,
                        playerCards: hitDoneEvent?.parsedJson?.player_cards,
                        playerScore: hitDoneEvent?.parsedJson?.current_player_hand_sum,
                    };
                    io.emit("hitExecuted", gameMessage);

                }
                if (status == "failure") {
                    console.log("Error during Hit = ", res?.effects);
                }
            }).catch(err => {
                console.log("Error = ", err);
                console.log(err.data);
            });

    });

}


async function doStand(gameId: string) {

    console.log("GAME_ID: ", gameId);

    provider.getObject({
        id: gameId,
        options: {showContent: true},
    }).then(async (res) => {

        const tx = new TransactionBlock();
        const gameObject = res?.data?.content as SuiMoveObject;
        const counterHex = bytesToHex(Uint8Array.from([gameObject.fields.counter]));
        const randomnessHexString = bytesToHex(Uint8Array.from(gameObject.fields.user_randomness));

        // const messageToSign = gameIdHex.concat(randomnessHexString).concat(counterHex);
        //const gameIdHex = gameId.replace("0x", "");

        let signedHouseHash = await bls.sign(randomnessHexString, deriveBLS_SecretKey(ADMIN_SECRET_KEY!));

        console.log("GAME_ID Bytes = ", utils.hexToBytes(gameId.replace("0x", "")));
        console.log("randomness = ", gameObject.fields.user_randomness);

        tx.setGasBudget(10000000000);

        tx.moveCall({
            target: `${PACKAGE_ADDRESS}::single_player_blackjack::stand`,
            arguments: [
                tx.object(gameId),
                tx.pure(Array.from(signedHouseHash), "vector<u8>"),
                tx.object(HOUSE_DATA_ID)
            ],
        });

        await houseSigner
            .signAndExecuteTransactionBlock({
                transactionBlock: tx,
                requestType: "WaitForLocalExecution",
                options: {
                    showObjectChanges: true,
                    showEffects: true,
                },
            })
            .then(function (res) {
                const status = res?.effects?.status.status;

                console.log("Stand executed! status = ", status);
                if (status === "success") {
                    console.log("Stand Executed for game ", gameId);

                    const gameMessage : GameMessage =  {
                        gameId: gameId,
                        playerCards: [],
                        playerScore: "",
                    };

                    io.emit("StandExecuted", gameMessage);

                }
                if (status == "failure") {
                    console.log("Error = ", res?.effects);
                }
            }).catch(err => {
                console.log("Error = ", err);
                console.log(err.data);
            });

    });

}



io.on("connection", (socket) => {

    console.log('a user connected');

    // send a message to the client
    socket.emit("hello from server", 1, "2", { 3: Buffer.from([4]) });

    // receive a message from the client
    socket.on("game", (...args) => {
        const game : GameMessage = args[0];
        console.log("Client sent a game message: ", game);
    });

    socket.on("gameCreated", (...args) => {
        const game : GameMessage = args[0];
        console.log("Client sent a game message: ", game);
        console.log("GameCreatedEvent Event Received! GameId = ", game.gameId);
        doInitialDeal(game.gameId);
    });

    socket.on("hitRequested", (...args) => {
        const game : GameMessage = args[0];
        console.log("Client requested hit for game = ", game.gameId);
        doHit(game.gameId);
    });

    socket.on("StandRequested", (...args) => {
        const game : GameMessage = args[0];
        console.log("Stand requested for game = ", game.gameId);
        doStand(game.gameId);
    });

});



type GameMessage = {
    gameId: string;
    packageId?: string;
    type?: string;
    playerCards?: string[];
    playerScore?: string;
}