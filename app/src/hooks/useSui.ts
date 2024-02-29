import {
  SuiClient,
  SuiTransactionBlockResponseOptions,
} from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useEnokiFlow } from "@mysten/enoki/react";

interface EnokiSponsorExecuteProps {
  transactionBlock: TransactionBlock;
  options?: SuiTransactionBlockResponseOptions;
}

export const useSui = () => {
  const FULL_NODE = process.env.NEXT_PUBLIC_SUI_NETWORK!;
  const suiClient = new SuiClient({ url: FULL_NODE });
  const enokiFlow = useEnokiFlow();

  const enokiSponsorExecute = async ({
    transactionBlock,
    options,
  }: EnokiSponsorExecuteProps) => {
    return enokiFlow
      .sponsorAndExecuteTransactionBlock({
        network: "testnet",
        client: suiClient as any,
        transactionBlock: transactionBlock as any,
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
