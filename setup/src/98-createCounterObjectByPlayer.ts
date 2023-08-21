import {Connection, Ed25519Keypair, fromB64, JsonRpcProvider, RawSigner, TransactionBlock,} from "@mysten/sui.js";
import {BJ_PLAYER_2_SECRET_KEY, BJ_PLAYER_SECRET_KEY, HOUSE_DATA_ID, PACKAGE_ADDRESS, SUI_NETWORK,} from "./config";

import {bytesToHex, randomBytes} from '@noble/hashes/utils';
import fs from "fs";

let privateKeyArray = Uint8Array.from(Array.from(fromB64("AGyzzLoyHxKMEz0KJqFj5784VdmCdFSlMcJTMM0EvrfF"!)));

const playerKeypair = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));

const connection = new Connection({
    fullnode: SUI_NETWORK,
});
const provider = new JsonRpcProvider(connection);
const playerSigner = new RawSigner(playerKeypair, provider);

console.log("Connecting to SUI network: ", SUI_NETWORK);
console.log("Player Address =  ", playerKeypair.getPublicKey().toSuiAddress());

export const createCounterObjectByPlayer = async (): Promise<string|void> => {

    const tx = new TransactionBlock();

    tx.moveCall({
        target: `${PACKAGE_ADDRESS}::counter_nft::mint`,
        arguments: [],
    });

    tx.setGasBudget(1000000000);

    return playerSigner
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
                    if (obj.type === "created" && obj.objectType.endsWith("counter_nft::Counter")) {
                        const counterNftId = `COUNTER_NFT_ID=${obj.objectId}\n`;
                        const counterNftIdForApp = `NEXT_PUBLIC_COUNTER_NFT_ID=${obj.objectId}\n`;
                        console.log(counterNftId);
                        //fs.appendFileSync("./.env", counterNftId);
                        //fs.appendFileSync("../app/.env", counterNftIdForApp);
                        return counterNftId
                    }
                });
            }
            if (status == "failure") {
                console.log("Error = ", res?.effects);
            }
        });

};


createCounterObjectByPlayer();


//---------------------------------------------------------
/// Helper Functions
//---------------------------------------------------------

function getUserRandomBytesAsHexString() {
    const userRandomness = randomBytes(16);
    return bytesToHex(userRandomness);
}

function getFixedUserBytesAsHexString() {
    const userRandomness = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]);
    return bytesToHex(userRandomness);
}
