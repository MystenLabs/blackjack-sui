import {
  SuiClient,
  SuiTransactionBlockResponseOptions,
} from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useEnokiFlow } from "@mysten/enoki/react";

interface EnokiSponsorExecuteProps {
  transaction: Transaction;
  options?: SuiTransactionBlockResponseOptions;
}

export const useSui = () => {
  const FULL_NODE = process.env.NEXT_PUBLIC_SUI_NETWORK!;
  const suiClient = new SuiClient({ url: FULL_NODE });
  const enokiFlow = useEnokiFlow();

  //TODO: Change approach here since this is deprecated
  const enokiSponsorExecute = async ({
    transaction,
    options,
  }: EnokiSponsorExecuteProps) => {
    return enokiFlow
      .sponsorAndExecuteTransaction({
        network: process.env.NEXT_PUBLIC_SUI_NETWORK?.includes("testnet")
          ? "testnet"
          : "mainnet",
        transaction: transaction as any,
        client: suiClient as any,
      })
      .then((resp) => {
        return suiClient.getTransactionBlock({
          digest: resp.digest,
          options,
        });
      });
  };

  return { enokiSponsorExecute, suiClient };
};
