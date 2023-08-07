import {
    Connection,
    Ed25519Keypair, fromB64,
    JsonRpcProvider,
    RawSigner, SuiMoveObject,
    TransactionBlock,
} from "@mysten/sui.js";
import {
    PACKAGE_ADDRESS,
    SUI_NETWORK, ADMIN_SECRET_KEY, HOUSE_DATA_ID, deriveBLS_SecretKey,
} from "./config";

import * as bls from "@noble/bls12-381";
import hkdf from "futoin-hkdf";
import {bytesToHex} from "@noble/hashes/utils";
import {utils} from "@noble/bls12-381";
import {SuiEvent} from "@mysten/sui.js/src";


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

        const gameIdHex = gameId.replace("0x","");
        const counterHex = bytesToHex(Uint8Array.from([gameObject.fields.counter]));
        const randomnessHexString = bytesToHex(Uint8Array.from(gameObject.fields.user_randomness));

        const messageToSign = gameIdHex.concat(randomnessHexString).concat(counterHex);

        let signedHouseHash = await bls.sign(messageToSign, deriveBLS_SecretKey(ADMIN_SECRET_KEY!));

        console.log("GAME_ID Bytes = ", utils.hexToBytes(gameId.replace("0x","")));
        console.log("randomness = ", gameObject.fields.user_randomness);
        console.log("counter = ", counterHex);
        console.log("Full MessageTo Sign Bytes = ", utils.hexToBytes(messageToSign));

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


const listenForGameCreatedRequests = async () => {

    provider.subscribeEvent({
        filter: {
            Package: `${PACKAGE_ADDRESS}`
        },
        onMessage(event: SuiEvent) {
            const eventType = event.type;

            if(eventType.endsWith("GameCreatedEvent")) {
                const eventGameId = event.parsedJson?.game_id;
                console.log("GameCreatedEvent Event Received! GameId = ", eventGameId);
                doInitialDeal(eventGameId);
            }

        }
    }).then((subscriptionId) => {
        console.log("GameCreatedEvent Subscriber subscribed. SubId = ", subscriptionId);
    });

}

// listenForGameCreatedRequests();




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

    socket.on("connection", (socket) =>{
        console.log("Client connected!");
    });

});



type GameMessage = {
    gameId: string;
    packageId: string;
    type:string;
}