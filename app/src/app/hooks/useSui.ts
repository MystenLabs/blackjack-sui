import {
    Connection,
    ExecuteTransactionRequestType,
    JsonRpcProvider,
    SignedTransaction,
    SuiTransactionBlockResponseOptions,
} from '@mysten/sui.js';

interface ExecuteSignedTransactionBlockProps {
    signedTx: SignedTransaction;
    requestType: ExecuteTransactionRequestType;
    options?: SuiTransactionBlockResponseOptions;
}

export const useSui = () => {
    const FULL_NODE = process.env.NEXT_PUBLIC_SUI_NETWORK!;

    const connection = new Connection({
        fullnode: FULL_NODE,
    });
    const provider = new JsonRpcProvider(connection);

    const executeSignedTransactionBlock = async ({
        signedTx,
        requestType,
        options,
    }: ExecuteSignedTransactionBlockProps) => {
        return provider.executeTransactionBlock({
            transactionBlock: signedTx.transactionBlockBytes,
            signature: signedTx.signature,
            requestType,
            ...(options && { options }),
        });
    };

    return { executeSignedTransactionBlock, provider };
};
