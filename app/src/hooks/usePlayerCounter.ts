import { useEffect, useState } from "react";
import { useWalletKit } from "@mysten/wallet-kit";
import { useSui } from "./useSui";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui.js/client";
import toast from "react-hot-toast";
import { getCounterId } from "@/utils/getCounterId";

export const usePlayerCounter = () => {
  const { currentAccount, signTransactionBlock } = useWalletKit();
  const { suiClient, executeSignedTransactionBlock } = useSui();
  const [counterId, setCounterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleCreateCounter = async (): Promise<string | undefined> => {
    setIsLoading(true);
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::counter_nft::mint_and_transfer`,
      arguments: [],
    });
    tx.setGasBudget(1000000000);

    let signedTx: any = null;
    try {
      signedTx = await signTransactionBlock({
        transactionBlock: tx as any,
      });
    } catch (err) {
      toast.error("Could not sign transaction block");
      setIsLoading(false);
      setCounterId(null);
      return;
    }

    executeSignedTransactionBlock({
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
          throw new Error("CounterNft not created");
        }
        const createdObjects = resp.objectChanges?.filter(
          ({ type }) => type === "created"
        ) as SuiObjectChangeCreated[];
        const createdCounterNft = createdObjects.find(({ objectType }) =>
          objectType.endsWith("counter_nft::Counter")
        );
        if (!createdCounterNft) {
          throw new Error("CounterNft not created");
        }
        console.log({ createdCounterNftId: createdCounterNft.objectId });
        setIsLoading(false);
        setCounterId(createdCounterNft.objectId);
      })
      .catch((err) => {
        console.log(err);
        setIsLoading(false);
        setCounterId(null);
      });
  };

  useEffect(() => {
    if (!currentAccount) return;
    setIsLoading(true);
    getCounterId({
      address: currentAccount!.address,
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
  }, [currentAccount?.address]);

  return {
    counterId,
    handleCreateCounter,
    isLoading,
  };
};
