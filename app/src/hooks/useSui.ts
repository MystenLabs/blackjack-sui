import {
  ExecuteTransactionRequestType,
  SuiClient,
  SuiTransactionBlockResponseOptions,
} from "@mysten/sui.js/client";

interface ExecuteSignedTransactionBlockProps {
  signedTx: {
    signature: string | string[];
    transactionBlockBytes: Uint8Array | string;
  };
  requestType: ExecuteTransactionRequestType;
  options?: SuiTransactionBlockResponseOptions;
}

export const useSui = () => {
  const FULL_NODE = process.env.NEXT_PUBLIC_SUI_NETWORK!;

  const suiClient = new SuiClient({ url: FULL_NODE });

  const executeSignedTransactionBlock = async ({
    signedTx,
    requestType,
    options,
  }: ExecuteSignedTransactionBlockProps) => {
    return suiClient.executeTransactionBlock({
      transactionBlock: signedTx.transactionBlockBytes,
      signature: signedTx.signature,
      requestType,
      ...(options && { options }),
    });
  };

  return { executeSignedTransactionBlock, suiClient };
};
