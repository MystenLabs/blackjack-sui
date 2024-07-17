/*
 * This function
 * iterates over all of the owned objects of the admin
 * we skip iterating over the automatic pagination for the testing here
 * tries to find a HitRequest or StandRequest object for the given game id and player sum
 * to use it as argument for the hit/stand moveCall
 * It will be used only in this testing setup/ project, as it is computationally expensive
 * In the production back-end, the id of the HitRequest/StandRequest will be provided by the player (and then validated)
 */

import {
  SuiClient,
  SuiObjectData,
  SuiObjectResponse,
  SuiParsedData,
} from "@mysten/sui/client";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../../config";
import { getAddress } from "../keypair/getAddress";
import { GameOnChain } from "../../types/GameOnChain";
import { HitOrStandRequest } from "../../types/HitRequest";

interface GetHitOrStandRequestForGameAndSumProps {
  move: "hit" | "stand";
  gameId: string;
  playerSum: number;
  suiClient: SuiClient;
}

export const getHitOrStandRequestForGameAndSum = async ({
  move,
  gameId,
  playerSum,
  suiClient,
}: GetHitOrStandRequestForGameAndSumProps): Promise<string | undefined> => {
  const adminAddress = getAddress(ADMIN_SECRET_KEY);
  const objectType = move === "hit" ? "HitRequest" : "StandRequest";
  return suiClient
    .getOwnedObjects({
      owner: adminAddress,
      filter: {
        StructType: `${PACKAGE_ADDRESS}::single_player_blackjack::${objectType}`,
      },
      options: {
        showContent: true,
      },
    })
    .then(async (resp) => {
      // Complex TS code, but just to see what it takes not to use the "any" type casting at all
      const hitOrStandRequest = resp.data.find(
        ({ data }: SuiObjectResponse) => {
          const { content } = data as SuiObjectData;
          const { fields } = content as Extract<
            SuiParsedData,
            { dataType: "moveObject" }
          >;
          const { game_id, current_player_sum } =
            fields as unknown as HitOrStandRequest;
          return game_id === gameId && current_player_sum === playerSum;
        }
      );
      if (!hitOrStandRequest) {
        return undefined;
      }
      const {
        id: { id },
      } = (
        (hitOrStandRequest.data as SuiObjectData).content as Extract<
          SuiParsedData,
          { dataType: "moveObject" }
        >
      ).fields as unknown as GameOnChain;
      return id;
    })
    .catch((err) => {
      console.log(err);
      return undefined;
    });
};
