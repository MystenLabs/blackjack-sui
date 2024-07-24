import { useEffect, useState } from "react";
import { useSui } from "./useSui";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectChangeCreated } from "@mysten/sui/client";
import toast from "react-hot-toast";
import { getCounterId } from "@/utils/getCounterId";
import { useZkLogin } from "@mysten/enoki/react";

export const usePlayerCounter = () => {
  const { address } = useZkLogin();
  const { suiClient, enokiSponsorExecute } = useSui();
  const [counterId, setCounterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const handleCreateCounter = async () => {
    setIsCreateLoading(true);
    const tx = new Transaction();
    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::counter_nft::mint_and_transfer`,
      arguments: [],
    });

    return enokiSponsorExecute({
      transaction: tx,
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
        toast.success("Counter NFT minted!");
        setIsCreateLoading(false);
        setCounterId(createdCounterNft.objectId);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Minting Counter NFT failed");
        setIsCreateLoading(false);
        setCounterId(null);
      });
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
