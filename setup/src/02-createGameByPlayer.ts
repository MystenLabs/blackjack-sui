import {Connection, Ed25519Keypair, fromB64, JsonRpcProvider, RawSigner, TransactionBlock,} from "@mysten/sui.js";
import { BJ_PLAYER_SECRET_KEY, HOUSE_DATA_ID, PACKAGE_ADDRESS, SUI_NETWORK,} from "./config";

import {bytesToHex, randomBytes} from '@noble/hashes/utils';
import fs from "fs";

let privateKeyArray = Uint8Array.from(Array.from(fromB64(BJ_PLAYER_SECRET_KEY!)));

const playerKeypair = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));

const connection = new Connection({
    fullnode: SUI_NETWORK,
});
const provider = new JsonRpcProvider(connection);
const playerSigner = new RawSigner(playerKeypair, provider);

console.log("Connecting to SUI network: ", SUI_NETWORK);
console.log("Player Address =  ", playerKeypair.getPublicKey().toSuiAddress());

const betAmount = 100000000;


const createGameByPlayer = async () => {

    const tx = new TransactionBlock();

    const betAmountCoin = tx.splitCoins(tx.gas, [tx.pure(betAmount)]);

    const randomBytesAsHexString = getUserRandomBytesAsHexString();

    tx.moveCall({
        target: `${PACKAGE_ADDRESS}::single_player_blackjack::place_bet_and_create_game`,
        arguments: [
            tx.pure(randomBytesAsHexString),
            betAmountCoin,
            tx.object(HOUSE_DATA_ID)
        ],
    });

    playerSigner
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

            console.log("executed! status = ", status);

            if (status === "success") {
                res?.objectChanges?.find((obj) => {
                    if (obj.type === "created" && obj.objectType.endsWith("single_player_blackjack::Game")) {
                        const gameIdString = `GAME_ID=${obj.objectId}\n`;
                        console.log(gameIdString);
                        fs.appendFileSync("./.env", gameIdString);
                    }
                });
                process.exit(0);
            }
            if (status == "failure") {
                console.log("Error = ", res?.effects);
                process.exit(1);
            }
        });

};


createGameByPlayer();


//---------------------------------------------------------
/// Helper Functions
//---------------------------------------------------------

function getUserRandomBytesAsHexString() {
    const userRandomness = randomBytes(16);
    return bytesToHex(userRandomness);
}
