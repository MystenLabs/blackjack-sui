import { useCallback, useState } from "react";
import { useSui } from "./useSui";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui/client";
import toast from "react-hot-toast";
import axios from "axios";
import { useEnokiFlow } from "@mysten/enoki/react";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";

interface HandleCreateGameSuccessResponse {
  gameId: string;
  txDigest: string;
}

export const useCreateBlackjackGame = () => {
  const { suiClient } = useSui();
  const enokiFlow = useEnokiFlow();
  const [isCreateGameLoading, setIsCreateGameLoading] = useState(false);
  const [isInitialDealLoading, setIsInitialDealLoading] = useState(false);

  const handleCreateGameAndDeal = useCallback(
    async (
      counterId: string | null,
      randomBytesAsHexString: string,
      reFetchGame: (gameId: string, txDigest?: string) => Promise<void>
    ): Promise<HandleCreateGameSuccessResponse | null> => {
      if (!counterId) {
        toast.error("You need to own a Counter NFT to play");
        return null;
      }
      console.log("Creating game...");
      setIsCreateGameLoading(true);
      const tx = new Transaction();
      const betAmountCoin = tx.splitCoins(tx.gas, [tx.pure.u64(0.2 * Number(MIST_PER_SUI))]);
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::place_bet_and_create_game`,
        arguments: [
          tx.pure.string(randomBytesAsHexString),
          tx.object(counterId!),
          betAmountCoin,
          tx.object(process.env.NEXT_PUBLIC_HOUSE_DATA_ID!),
        ],
      });
      console.log("Executing transaction...");
      const signer = await enokiFlow.getKeypair({network: "testnet"});
      return suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: signer as any,
        requestType: "WaitForLocalExecution",
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      })
        .then((resp) => {
          const status = resp?.effects?.status.status;
          if (status !== "success") {
            console.log(resp.effects);
            throw new Error("Game not created");
          }
          const createdObjects = resp.objectChanges?.filter(
            ({ type }) => type === "created"
          ) as SuiObjectChangeCreated[];
          const createdGame = createdObjects.find(({ objectType }) =>
            objectType.endsWith("single_player_blackjack::Game")
          );
          if (!createdGame) {
            throw new Error("Game not created");
          }
          const { objectId } = createdGame;
          console.log("Created game id:", objectId);
          reFetchGame(objectId, resp.effects?.transactionDigest!);
          setIsCreateGameLoading(false);
          setIsInitialDealLoading(true);
          toast.success("Game created!");
          return makeInitialDealRequest({
            gameId: objectId,
            txDigest: resp.effects?.transactionDigest!,
          });
        })
        .catch((err) => {
          console.log(err);
          setIsCreateGameLoading(false);
          toast.error("Game creation failed");
          return null;
        });
    },
    []
  );

  // Passes the txDigest from the game creation tx to the API
  // So that the API will waitForTransactionBlock on it before making the initial deal
  const makeInitialDealRequest = async ({
    gameId,
    txDigest,
  }: HandleCreateGameSuccessResponse): Promise<HandleCreateGameSuccessResponse | null> => {
    console.log("Making initial deal request to the API...");
    return axios
      .post(`/api/games/${gameId}/deal`, {
        txDigest,
      })
      .then((resp) => {
        const { message, txDigest } = resp.data;
        console.log(message);
        setIsInitialDealLoading(false);
        return {
          gameId,
          txDigest,
        };
      })
      .catch((error) => {
        console.log(error);
        toast.error("Game created, but initial deal failed.");
        setIsInitialDealLoading(false);
        return null;
      });
  };

  return {
    isCreateGameLoading,
    isInitialDealLoading,
    handleCreateGameAndDeal,
  };
};
