import { useCallback, useState } from "react";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui/client";
import toast from "react-hot-toast";
import axios from "axios";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { placeBetAndCreateGame } from '@/__generated__/blackjack/single_player_blackjack';
import useSponsoredTransaction from "@/hooks/useSponsoredTransaction";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface HandleCreateGameSuccessResponse {
  gameId: string;
  txDigest: string;
}

export const useCreateBlackjackGame = () => {
  const currentAccount = useCurrentAccount();
  const { sponsorAndSignTransaction } = useSponsoredTransaction();
  const [isCreateGameLoading, setIsCreateGameLoading] = useState(false);
  const [isInitialDealLoading, setIsInitialDealLoading] = useState(false);

  const handleCreateGameAndDeal = useCallback(
    async (reFetchGame: (gameId: string, txDigest?: string) => Promise<void>): Promise<HandleCreateGameSuccessResponse | null> => {
      if (!currentAccount) {
        throw new Error('No account is available for creating the game');
      }

      setIsCreateGameLoading(true);

      const tx = new Transaction();
      tx.setSender(currentAccount.address)

      const betAmountCoin = coinWithBalance({ balance: BigInt(0.2 * Number(MIST_PER_SUI)), useGasCoin: false })(tx);
      tx.add(
          placeBetAndCreateGame({
            arguments: [
              betAmountCoin,
              tx.object(process.env.NEXT_PUBLIC_HOUSE_DATA_ID!),
            ],
          }),
      );

      return sponsorAndSignTransaction(tx)
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
    [currentAccount, sponsorAndSignTransaction]
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
