import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui/client";
import { useCallback, useState } from "react";
import { GameOnChain } from "@/types/GameOnChain";
import toast from "react-hot-toast";
import axios from "axios";
import { useEnokiFlow, useZkLogin } from "@mysten/enoki/react";
import { fromB64, toB64 } from "@mysten/sui/utils";
import { useSui } from "./useSui";

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
  const { suiClient } = useSui();
  const enokiFlow = useEnokiFlow();
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
        let request = tx.moveCall({
          target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::do_${move}`,
          arguments: [tx.object(gameId), tx.pure.u8(player_sum)],
        });
        tx.transferObjects(
          [request],
          tx.pure.address(process.env.NEXT_PUBLIC_ADMIN_ADDRESS!)
        );

        const txBytes = await tx.build({
          client: suiClient,
          onlyTransactionKind: true,
        });

        // Step 2: Send TxBytes to the backend for sponsorship
        const sponsorResponse = await fetch("/api/sponsor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionKindBytes: toB64(txBytes),
            sender: address,
          }),
        });

        if (!sponsorResponse.ok) {
          throw new Error("Failed to sponsor transaction");
        }

        const { bytes: sponsoredBytes, digest: txDigest } =
          await sponsorResponse.json();

        // Step 3: User signs the sponsored TxBytes
        const signer = await enokiFlow.getKeypair({
          network: process.env.NEXT_PUBLIC_SUI_NETWORK_NAME! as
            | "mainnet"
            | "testnet",
        });

        const { signature } = await signer.signTransaction(
          fromB64(sponsoredBytes)
        );

        // Step 4: Send signed TxBytes and txDigest back to the backend for execution
        const executeResponse = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            digest: txDigest,
            signature: signature,
          }),
        });

        if (!executeResponse.ok) {
          throw new Error("Failed to execute transaction");
        }

        const { digest: executedDigest } = await executeResponse.json();

        // Step 5: Wait for transaction confirmation
        await suiClient.waitForTransaction({
          digest: executedDigest,
          timeout: 10_000,
        });

        const transactionResult = await suiClient.getTransactionBlock({
          digest: executedDigest,
          options: {
            showEffects: true,
            showObjectChanges: true,
            showEvents: true,
          },
        });

        if (transactionResult.effects?.status?.status !== "success") {
          throw new Error("Transaction failed");
        }

        // Extract created objects
        const createdObjects = transactionResult.objectChanges?.filter(
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
