import { useEffect, useState } from "react";
import { useSui } from "./useSui";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui/client";
import toast from "react-hot-toast";
import { getCounterId } from "@/utils/getCounterId";
import { useEnokiFlow, useZkLogin } from "@mysten/enoki/react";
import { fromB64, toB64 } from "@mysten/sui/utils";

export const usePlayerCounter = () => {
  const enokiFlow = useEnokiFlow();
  const { address } = useZkLogin();
  const { suiClient } = useSui();
  const [counterId, setCounterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const handleCreateCounter = async () => {
    try {
      setIsCreateLoading(true);

      // Step 1: Create the transaction and get TxBytes
      const tx = new Transaction();
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::counter_nft::mint_and_transfer`,
        arguments: [],
      });
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
        },
      });

      if (transactionResult.effects?.status?.status !== "success") {
        throw new Error("Transaction failed");
      }

      // Extract created Counter NFT
      const createdObjects = transactionResult.objectChanges?.filter(
        ({ type }) => type === "created"
      ) as SuiObjectChangeCreated[];

      const createdCounterNft = createdObjects.find(({ objectType }) =>
        objectType.endsWith("counter_nft::Counter")
      );

      if (!createdCounterNft) {
        throw new Error("Counter NFT not created");
      }

      console.log({ createdCounterNftId: createdCounterNft.objectId });
      toast.success("Counter NFT minted!");
      setCounterId(createdCounterNft.objectId);
    } catch (err) {
      console.error(err);
      toast.error("Minting Counter NFT failed");
      setCounterId(null);
    } finally {
      setIsCreateLoading(false);
    }
  };

  useEffect(() => {
    if (!address) return;
    setIsLoading(true);
    getCounterId({
      address,
      suiClient,
    })
      .then((resp) => {
        if (!resp) {
          setIsLoading(false);
          setCounterId(null);
        } else {
          setCounterId(resp);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.log(err);
        setCounterId(null);
      });
  }, [address]);

  return {
    counterId,
    handleCreateCounter,
    isLoading,
    isCreateLoading,
  };
};
