import { useWalletKit } from "@mysten/wallet-kit";
import { useState } from "react";
import { useSui } from "./useSui";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { MIST_PER_SUI } from "@mysten/sui.js/utils";
import toast from "react-hot-toast";

interface HandleTransferSUIProps {
  amount: number;
  recipient: string;
  refresh?: () => void;
}

export const useTransferSUI = () => {
  const { currentAccount, signTransactionBlock } = useWalletKit();
  const { executeSignedTransactionBlock } = useSui();
  const [isLoading, setIsLoading] = useState(false);

  const handleTransferSUI = async ({
    amount,
    recipient,
    refresh,
  }: HandleTransferSUIProps) => {
    setIsLoading(true);

    const tx = new TransactionBlock();
    let coin = tx.splitCoins(tx.gas, [tx.pure(amount * Number(MIST_PER_SUI))]);
    tx.transferObjects([coin], tx.pure(recipient));

    let signedTx: any = null;
    try {
      signedTx = await signTransactionBlock({
        transactionBlock: tx,
      });
    } catch (err) {
      toast.error("Could not sign transaction block");
      setIsLoading(false);
      return;
    }

    await executeSignedTransactionBlock({
      signedTx,
      requestType: "WaitForLocalExecution",
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    })
      .then((resp) => {
        console.log(resp);
        if (resp.effects?.status.status !== "success") {
          throw new Error("Transaction failed");
        }
        setIsLoading(false);
        toast.success("SUI transferred successfully!");
        !!refresh && refresh();
      })
      .catch((err) => {
        console.log(err);
        toast.error("Transaction failed");
        setIsLoading(false);
      });
  };

  return {
    isLoading,
    handleTransferSUI,
  };
};
