import {
    Connection,
    Ed25519Keypair, fromB64,
    JsonRpcProvider,
    RawSigner, SuiMoveObject,
    TransactionBlock,
} from "@mysten/sui.js";
import {
    PACKAGE_ADDRESS,
    SUI_NETWORK, ADMIN_SECRET_KEY, GAME_ID, HOUSE_DATA_ID, deriveBLS_SecretKey,
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
console.log("GAME_ID: ", GAME_ID);
console.log("HOUSE_DATA_ID: ", HOUSE_DATA_ID);
console.log("Signer Address: ", keypairAdmin.getPublicKey().toSuiAddress());

const suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const cards: Map<number, Card> = new Map();


const generateDeck = () => {
    const newDeck: Card[] = [];
    let i: number = 0;
    for (const suit of suits) {
        for (const value of values) {
            const card = {
                index: i,
                suit: suit,
                value: value,
            };
            newDeck.push(card);
            cards.set(i, card);
            i++;
        }
    }
    return newDeck;
};


type Card = {
    index: number;
    suit: string;
    value: string;
}


const getPlayerHand = (playerCards: number[]) => {

    const playerInitialHand: Card[] = [];
    playerCards.forEach((cardIndex) => {
        playerInitialHand.push(cards.get(cardIndex)!);
    });
    return playerInitialHand;

}

const getGameObject = async (gameId: string) => {
    const res = await provider.getObject({
        id: gameId,
        options: {showContent: true},
    });

    const gameObject = res?.data?.content as SuiMoveObject;
    return gameObject;
}

const doInitialDeal = async () => {

    const tx = new TransactionBlock();

    await provider.getObject({
        id: GAME_ID,
        options: {showContent: true},
    }).then(async (res) => {
        const gameObject = res?.data?.content as SuiMoveObject;
        const counterHex = bytesToHex(Uint8Array.from([gameObject.fields.counter]));
        const randomnessHexString = bytesToHex(Uint8Array.from(gameObject.fields.user_randomness));

        const messageToSign = randomnessHexString.concat(counterHex);

        let signedHouseHash = await bls.sign(messageToSign, deriveBLS_SecretKey(ADMIN_SECRET_KEY!));

        console.log("GAME_ID Bytes = ", utils.hexToBytes(GAME_ID.replace("0x", "")));
        console.log("randomness = ", gameObject.fields.user_randomness);
        console.log("counter = ", counterHex);
        console.log("Full MessageTo Sign Bytes = ", utils.hexToBytes(randomnessHexString));

        tx.setGasBudget(10000000000);

        tx.moveCall({
            target: `${PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
            arguments: [
                tx.object(GAME_ID),
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
            .then(async function (res) {
                const status = res?.effects?.status.status;

                console.log("executed! status = ", status);
                if (status === "success") {

                    const updatedGameObject = await getGameObject(GAME_ID);
                    const playerCards = updatedGameObject?.fields.player_cards;

                    console.log(playerCards);
                    const playerHand = getPlayerHand(playerCards);
                    console.log("Player Hand = ", playerHand);

                    process.exit(0);
                }
                if (status == "failure") {
                    console.log("Error = ", res?.effects);
                    process.exit(1);
                }
            }).catch(err => {
                console.log("Error = ", err);
                console.log(err.data);
                process.exit(1);
            });


    });


};


const deck: Card[] = generateDeck();

doInitialDeal();


//---------------------------------------------------------
/// Helper Functions
//---------------------------------------------------------

