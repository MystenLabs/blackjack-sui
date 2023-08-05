import {
    Connection,
    Ed25519Keypair, fromB64,
    JsonRpcProvider,
    RawSigner, SuiMoveObject,
    TransactionBlock,
} from "@mysten/sui.js";
import {
    PACKAGE_ADDRESS,
    SUI_NETWORK, ADMIN_SECRET_KEY, GAME_ID, HOUSE_DATA_ID,
} from "./config";

import * as bls from "@noble/bls12-381";
import hkdf from "futoin-hkdf";

let privateKeyArray = Uint8Array.from(Array.from(fromB64(ADMIN_SECRET_KEY!)));

const keypairAdmin = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));

const connection = new Connection({
    fullnode: SUI_NETWORK,
});
const provider = new JsonRpcProvider(connection);
const houseSigner = new RawSigner(keypairAdmin, provider);


console.log("Connecting to SUI network: ", SUI_NETWORK);
console.log("GAME_ID: ", GAME_ID);
console.log("HOUSE_DATA_ID: ", HOUSE_DATA_ID);

const doInitialDeal = async () => {

    const tx = new TransactionBlock();

    await provider.getObject({
        id: GAME_ID,
        options: { showContent: true },
    }).then(async (res) => {
        const suiObject = res?.data?.content as SuiMoveObject;
        const counter = suiObject.fields.counter;
        const randomness = suiObject.fields.user_randomness;

        const houseHash = getHouseHash(GAME_ID, randomness, counter);
        const houseHashHex = bytesToHex(houseHash);
        console.log("houseHash = ", houseHashHex);

        let signedHouseHash = await bls.sign(houseHashHex, deriveBLS_SK(ADMIN_SECRET_KEY!));

        tx.setGasBudget(10000000000);

        tx.moveCall({
            target: `${PACKAGE_ADDRESS}::single_player_blackjack::deal`,
            arguments: [
                tx.object(GAME_ID),
                tx.pure(Array.from(signedHouseHash)),
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

                console.log("executed! status = ", status);
                if (status === "success") {
                    res?.objectChanges?.find((obj) => {
                        // if (obj.type === "created" && obj.objectType.endsWith("single_player_blackjack::HouseData")) {
                        //     const houseDataString = `HOUSE_DATA_ID=${obj.objectId}`;
                        //     console.log(houseDataString);
                        //     fs.writeFileSync("./tx_res.json", JSON.stringify(res));
                        //     fs.appendFileSync("./.env", houseDataString);
                        // }
                    });
                    process.exit(0);
                }
                if (status == "failure") {
                    console.log("Error = ", res?.effects);
                    process.exit(1);
                }
            }).catch(err => {
                console.log("Error = ", err);
                process.exit(1);
            });


    });


};


doInitialDeal();

import { blake2b  } from '@noble/hashes/blake2b';
import {bytesToHex} from "@noble/hashes/utils";
//---------------------------------------------------------
/// Helper Functions
//---------------------------------------------------------

function getHouseHash(gameId: string, randomness: string, counter:string) {

    const stringToHash = `${gameId}${randomness}${counter}`;

    return blake2b(stringToHash);
}

function deriveBLS_SK(private_key: string): Uint8Array {
    // initial key material
    const ikm = private_key;
    const length = 32;
    const salt = "blackjack";
    const info = "bls-signature";
    const hash = 'SHA-256';
    const derived_sk = hkdf(ikm, length, {salt, info, hash});
    return Uint8Array.from(derived_sk);
}