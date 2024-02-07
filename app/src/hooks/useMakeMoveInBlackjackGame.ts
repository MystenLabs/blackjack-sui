import { useSui } from "./useSui";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui.js/client";
import { useWalletKit } from "@mysten/wallet-kit";
import { useCallback, useState } from "react";
import { GameOnChain } from "@/types/GameOnChain";
import toast from "react-hot-toast";
import axios from "axios";

interface HandleHitOrStandProps {
  move: "hit" | "stand";
  game: GameOnChain | null;
  gameId: string;
}

interface HandleSuccessResponse {
  gameId: string;
  txDigest: string;
}

interface OnRequestMoveSuccessProps {
  gameId: string;
  move: "hit" | "stand";
  txDigest: string;
  requestObjectId: string;
}

export const useMakeMoveInBlackjackGame = () => {
  const { executeSignedTransactionBlock } = useSui();
  const { signTransactionBlock } = useWalletKit();
  const [isMoveLoading, setIsMoveLoading] = useState(false);

  const handleHitOrStand = useCallback(
    async ({
      move,
      game,
      gameId,
    }: HandleHitOrStandProps): Promise<HandleSuccessResponse | null> => {
      if (!game || !gameId) {
        toast.error("You need to create a game first");
        setIsMoveLoading(false);
        return null;
      }

      setIsMoveLoading(true);
      const { player_sum } = game;
      const tx = new TransactionBlock();
      let request = tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::do_${move}`,
        arguments: [tx.object(gameId), tx.pure(player_sum, "u8")],
      });
      tx.transferObjects(
        [request],
        tx.pure(process.env.NEXT_PUBLIC_ADMIN_ADDRESS!)
      );

      let signedTx: any = null;
      try {
        signedTx = await signTransactionBlock({
          transactionBlock: tx as any,
        });
      } catch (err) {
        console.error(err);
        toast.error("Could not sign transaction block");
        setIsMoveLoading(false);
        return null;
      }

      return executeSignedTransactionBlock({
        signedTx,
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
          const createdObjects = resp.objectChanges?.filter(
            ({ type }) => type === "created"
          ) as SuiObjectChangeCreated[];
          const hitOrStandRequest = createdObjects.find(
            ({ objectType }) =>
              objectType ===
              `${
                process.env.NEXT_PUBLIC_PACKAGE_ADDRESS
              }::single_player_blackjack::${move
                .slice(0, 1)
                .toUpperCase()
                .concat(move.slice(1))}Request`
          );
          if (!hitOrStandRequest) {
            throw new Error(
              `No ${move}Request found in the admin's owned objects`
            );
          }
          console.log({
            [`${move}RequestId`]: hitOrStandRequest?.objectId,
          });
          return onRequestMoveSuccess({
            move,
            gameId,
            requestObjectId: hitOrStandRequest?.objectId!,
            txDigest: resp.effects?.transactionDigest!,
          });
        })
        .catch((err) => {
          console.log({ err });
          return null;
        });
    },
    []
  );

  const onRequestMoveSuccess = async ({
    gameId,
    move,
    txDigest,
    requestObjectId,
  }: OnRequestMoveSuccessProps): Promise<HandleSuccessResponse | null> => {
    return axios
      .post(`/api/games/${gameId}/${move}`, {
        requestObjectId,
        txDigest,
      })
      .then((resp) => {
        const { message, txDigest } = resp.data;
        console.log(message);
        setIsMoveLoading(false);
        return {
          gameId,
          txDigest,
        };
      })
      .catch((err) => {
        console.log(err);
        toast.error(`Error executing ${move}`);
        setIsMoveLoading(false);
        return null;
      });
  };

  return {
    isMoveLoading,
    handleHitOrStand,
  };
};
