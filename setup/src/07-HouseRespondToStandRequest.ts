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

async function doStand(event: SuiEvent) {

    const eventGameId = event.parsedJson?.game_id;
    console.log("GAME_ID: ", eventGameId);

    provider.getObject({
        id: eventGameId,
        options: {showContent: true},
    }).then(async (res) => {

        const tx = new TransactionBlock();
        const gameObject = res?.data?.content as SuiMoveObject;
        const gameIdHex = eventGameId.replace("0x", "");
        const counterHex = bytesToHex(Uint8Array.from([gameObject.fields.counter]));
        const randomnessHexString = bytesToHex(Uint8Array.from(gameObject.fields.user_randomness));

        const messageToSign = gameIdHex.concat(randomnessHexString).concat(counterHex);

        let signedHouseHash = await bls.sign(messageToSign, deriveBLS_SecretKey(ADMIN_SECRET_KEY!));

        console.log("GAME_ID Bytes = ", utils.hexToBytes(eventGameId.replace("0x", "")));
        console.log("randomness = ", gameObject.fields.user_randomness);
        console.log("counter = ", counterHex);
        console.log("Full MessageTo Sign Bytes = ", utils.hexToBytes(messageToSign));

        tx.setGasBudget(10000000000);

        tx.moveCall({
            target: `${PACKAGE_ADDRESS}::single_player_blackjack::stand`,
            arguments: [
                tx.object(eventGameId),
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
                    console.log("Stand Executed for game ", eventGameId);
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

const listenForStandRequests = async () => {

    provider.subscribeEvent({
        filter: {
            MoveEventType: `${PACKAGE_ADDRESS}::single_player_blackjack::StandRequested`
        },
        onMessage(event: SuiEvent) {
            doStand(event);
        }
    }).then((subscriptionId) => {
        console.log("StandRequested  Subscriber subscribed. SubId = ", subscriptionId);
    });

}

listenForStandRequests();





//---------------------------------------------------------
/// Helper Functions
//---------------------------------------------------------
