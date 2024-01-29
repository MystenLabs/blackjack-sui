import { useCallback, useState } from "react";
import { useSui } from "./useSui";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui.js/client";
import { useWalletKit } from "@mysten/wallet-kit";
import { getUserRandomnessAsHexString } from "@/helpers/getUserRandomnessAsHexString";
import toast from "react-hot-toast";
import axios from "axios";

interface HandleCreateGameSuccessResponse {
  gameId: string;
  txDigest: string;
}

export const useCreateBlackjackGame = () => {
  const { executeSignedTransactionBlock } = useSui();
  const { signTransactionBlock } = useWalletKit();
  const [isCreateGameLoading, setIsCreateGameLoading] = useState(false);

  const handleCreateGame = useCallback(
    async (
      counterId: string | null
    ): Promise<HandleCreateGameSuccessResponse | null> => {
      if (!counterId) {
        toast.error("You need to own a Counter NFT to play");
        return null;
      }
      console.log("Creating game...");
      setIsCreateGameLoading(true);
      const tx = new TransactionBlock();
      const betAmountCoin = tx.splitCoins(tx.gas, [tx.pure("200000000")]);
      const randomBytesAsHexString = getUserRandomnessAsHexString();
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::place_bet_and_create_game`,
        arguments: [
          tx.pure(randomBytesAsHexString),
          tx.object(counterId!),
          betAmountCoin,
          tx.object(process.env.NEXT_PUBLIC_HOUSE_DATA_ID!),
        ],
      });
      let signedTx: any = null;
      try {
        console.log("Signing transaction...");
        signedTx = await signTransactionBlock({
          transactionBlock: tx as any,
        });
      } catch (err) {
        toast.error("Could not sign transaction block");
        setIsCreateGameLoading(false);
        return null;
      }
      console.log("Executing transaction...");
      return executeSignedTransactionBlock({
        signedTx,
        requestType: "WaitForLocalExecution",
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      })
        .then((resp) => {
          const status = resp?.effects?.status.status;
          if (status !== "success") {
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
          return makeInitialDealRequest({
            gameId: objectId,
            txDigest: resp.effects?.transactionDigest!,
          });
        })
        .catch((err) => {
          console.log(err);
          setIsCreateGameLoading(false);
          return null;
        });
    },
    []
  );

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
        toast.success(message);
        setIsCreateGameLoading(false);
        return {
          gameId,
          txDigest,
        };
      })
      .catch((error) => {
        console.log(error);
        toast.error("Game created, but initial deal failed.");
        setIsCreateGameLoading(false);
        return null;
      });
  };

  return {
    isCreateGameLoading,
    handleCreateGame,
  };
};
