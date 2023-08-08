import {
    Connection,
    Ed25519Keypair, fromB64,
    JsonRpcProvider,
    RawSigner, SuiMoveObject,
    TransactionBlock,
} from "@mysten/sui.js";
import {
    PACKAGE_ADDRESS,
    SUI_NETWORK, ADMIN_SECRET_KEY, GAME_ID, HOUSE_DATA_ID, deriveBLS_SecretKey, BJ_PLAYER_SECRET_KEY,
} from "./config";

let privateKeyArray = Uint8Array.from(Array.from(fromB64(BJ_PLAYER_SECRET_KEY!)));

const playerKeypair = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));

const connection = new Connection({
    fullnode: SUI_NETWORK,
});
const provider = new JsonRpcProvider(connection);
const playerSigner = new RawSigner(playerKeypair, provider);

console.log("Connecting to SUI network: ", SUI_NETWORK);
console.log("Player Address =  ", playerKeypair.getPublicKey().toSuiAddress());

const doPlayerStandRequest = async () => {

    const tx = new TransactionBlock();

    await provider.getObject({
        id: GAME_ID,
        options: {showContent: true},
    }).then(async (res) => {

        const gameObject = res?.data?.content as SuiMoveObject;
        const playerHandSum = gameObject.fields.player_sum;

        console.log("found game with id = ", gameObject.fields.id);

        tx.moveCall({
            target: `${PACKAGE_ADDRESS}::single_player_blackjack::do_stand`,
            arguments: [
                tx.object(GAME_ID),
                tx.pure(playerHandSum, "u8")
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

                console.log("Stand Request executed! status = ", status);

                if (status === "success") {
                    process.exit(0);
                }
                if (status == "failure") {
                    console.log("Error = ", res?.effects);
                    process.exit(1);
                }
            });

    });

};


doPlayerStandRequest();

