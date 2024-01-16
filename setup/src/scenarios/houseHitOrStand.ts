import { SuiClient, SuiEvent, SuiMoveObject } from "@mysten/sui.js/client";
import { getKeypair } from "../helpers/getKeyPair";
import {
  ADMIN_SECRET_KEY,
  HOUSE_DATA_ID,
  PACKAGE_ADDRESS,
  SUI_NETWORK,
  deriveBLS_SecretKey,
} from "../config";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bytesToHex, hexToBytes } from "@noble/curves/abstract/utils";
import { bls12_381 } from "@noble/curves/bls12-381";

interface HouseHitOrStandProps {
  eventParsedJson: {
    current_player_hand_sum: number;
    gameId: string;
  };
  move: "hit" | "stand";
  onHitSuccess?: (event: SuiEvent) => void;
  onStandSuccess?: (gameId: string) => void;
}

export const houseHitOrStand = async ({
  eventParsedJson,
  move,
  onHitSuccess,
  onStandSuccess,
}: HouseHitOrStandProps) => {
  const adminKeypair = getKeypair(ADMIN_SECRET_KEY!);
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });

  const { gameId } = eventParsedJson;

  await suiClient
    .getObject({
      id: gameId,
      options: { showContent: true },
    })
    .then(async (res) => {
      const tx = new TransactionBlock();
      const gameObject = res?.data?.content as SuiMoveObject;
      const { fields } = gameObject as any;
      const counterHex = bytesToHex(Uint8Array.from([fields.counter]));
      const randomnessHexString = bytesToHex(
        Uint8Array.from(fields.user_randomness)
      );

      const messageToSign = randomnessHexString.concat(counterHex);

      let signedHouseHash = bls12_381.sign(
        messageToSign,
        deriveBLS_SecretKey(ADMIN_SECRET_KEY!)
      );

    //   console.log("randomness = ", fields.user_randomness);
    //   console.log("counter = ", counterHex);
    //   console.log("Full MessageTo Sign Bytes = ", hexToBytes(messageToSign));

      tx.setGasBudget(10000000000);

      tx.moveCall({
        target: `${PACKAGE_ADDRESS}::single_player_blackjack::${move}`,
        arguments: [
          tx.object(gameId),
          tx.pure(Array.from(signedHouseHash), "vector<u8>"),
          tx.object(HOUSE_DATA_ID),
        ],
      });

      await suiClient
        .signAndExecuteTransactionBlock({
          signer: adminKeypair,
          transactionBlock: tx,
          requestType: "WaitForLocalExecution",
          options: {
            showObjectChanges: true,
            showEffects: true,
            showEvents: true,
          },
        })
        .then((resp) => {
          const status = resp?.effects?.status.status;
          if (status !== "success") {
            throw new Error("Transaction failed");
          }
          console.log(`${move} executed`);
          if (move === "hit") {
            const event = resp.events?.find(
              ({ type }) =>
                type ===
                `${PACKAGE_ADDRESS}::single_player_blackjack::HitDoneEvent`
            );
            !!onHitSuccess && onHitSuccess(event!);
          } else {
            !!onStandSuccess && onStandSuccess(gameId);
          }
        })
        .catch((err) => {
          console.log("Error = ", err);
        });
    })
    .catch((err) => {
      console.log("Game not found!");
    });
};
