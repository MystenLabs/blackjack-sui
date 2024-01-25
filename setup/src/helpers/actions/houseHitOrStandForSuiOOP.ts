import { SuiClient, SuiEvent } from "@mysten/sui.js/client";
import { formatAddress } from "@mysten/sui.js/utils";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getGameObject } from "../getObject/getGameObject";
import { getKeypair } from "../keypair/getKeyPair";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../../config";
import { getBLSSecreyKey } from "../bls/getBLSSecretKey";
import { getHitOrStandRequestForGameAndSum } from "../getObject/getHitOrStandRequestForGameAndSum";

interface HouseHitOrStandForSuiOOPProps {
  gameId: string;
  counter: number;
  user_randomness: number[];
  move: "hit" | "stand";
  houseDataId: string;
  requestObjectId: string;
}

export const houseHitOrStandForSuiOOP = ({
  gameId,
  counter,
  user_randomness,
  move,
  houseDataId,
  requestObjectId,
}: HouseHitOrStandForSuiOOPProps) => {
  console.log(
    `House is ${
      move === "hit" ? "hitting" : "standing"
    } for game ${formatAddress(gameId)}...`
  );

  const tx = new TransactionBlock();
  const counterHex = bytesToHex(Uint8Array.from([counter]));
  const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));
  const messageToSign = randomnessHexString.concat(counterHex);
  let signedHouseHash = bls12_381.sign(
    messageToSign,
    getBLSSecreyKey(ADMIN_SECRET_KEY!)
  );

  tx.setGasBudget(10000000000);
  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::${move}`,
    arguments: [
      tx.object(gameId),
      tx.pure(Array.from(signedHouseHash), "vector<u8>"),
      tx.object(houseDataId),
      tx.object(requestObjectId),
    ],
  });

  return tx;
};
