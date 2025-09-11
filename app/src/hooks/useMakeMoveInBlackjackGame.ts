import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui/client";
import { useCallback, useState } from "react";
import { GameOnChain } from "@/types/GameOnChain";
import toast from "react-hot-toast";
import axios from "axios";
import { useEnokiFlow, useZkLogin } from "@mysten/enoki/react";
import { useSui } from "./useSui";
import { doHit, doStand } from "@/__generated__/blackjack/single_player_blackjack";
import useSponsoredTransaction from "@/hooks/useSponsoredTransaction";

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
  const { sponsorAndSignTransaction } = useSponsoredTransaction();
  const { address } = useZkLogin();
  const [isMoveLoading, setIsMoveLoading] = useState(false);

  const handleHitOrStand = useCallback(
    async ({
      move,
      game,
      gameId,
    }: HandleHitOrStandProps): Promise<HandleSuccessResponse | null> => {
      try {
        if (!game || !gameId) {
          toast.error("You need to create a game first");
          setIsMoveLoading(false);
          return null;
        }

        setIsMoveLoading(true);

        const { player_sum } = game;

        // Step 1: Create the transaction and get TxBytes
        const tx = new Transaction();
        const request = tx.add(
            move === 'hit' ? doHit({
              arguments: [tx.object(gameId), tx.pure.u8(player_sum)],
            }) : doStand({
              arguments: [tx.object(gameId), tx.pure.u8(player_sum)],
            })
        );
        tx.transferObjects(
          [request],
          tx.pure.address(process.env.NEXT_PUBLIC_ADMIN_ADDRESS!)
        );

        const transactionResult = await sponsorAndSignTransaction(tx, address!);

        if (transactionResult.effects?.status?.status !== "success") {
          throw new Error("Transaction failed");
        }

        // Extract created objects
        const createdObjects = transactionResult.objectChanges?.filter(
          ({ type }) => type === "created"
        ) as SuiObjectChangeCreated[];

        const hitOrStandRequest = createdObjects.find(
          ({ objectType }) =>
            objectType.endsWith(`${move
                .slice(0, 1)
                .toUpperCase()
                .concat(move.slice(1))}Request`),
        );
        if (!hitOrStandRequest) {
          throw new Error(
            `No ${move}Request found in the admin's owned objects`
          );
        }

        console.log({
          [`${move}RequestId`]: hitOrStandRequest?.objectId,
        });

        // Success handler
        return onRequestMoveSuccess({
          move,
          gameId,
          requestObjectId: hitOrStandRequest?.objectId!,
          txDigest: transactionResult.effects?.transactionDigest!,
        });
      } catch (err) {
        console.error(err);
        toast.error(`Error executing ${move}`);
        return null;
      } finally {
        setIsMoveLoading(false);
      }
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
