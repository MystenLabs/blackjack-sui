import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { sponsorTransaction } from "./sponsorTransaction";
import { getKeypair } from "../helpers/getKeyPair";

interface SponsorAndSignTransactionProps {
  suiClient: SuiClient;
  tx: Transaction;
}

export const sponsorAndSignTransaction = async ({
  tx,
  suiClient,
}: SponsorAndSignTransactionProps) => {
  const adminKeypair = getKeypair(process.env.ADMIN_SECRET_KEY!);
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });
  const sponsoredTransaction = await sponsorTransaction({
    txBytes,
    forceFailure: false,
  });
  if (!sponsoredTransaction) {
    throw new Error("Sponsoring transaction failed");
  }
  const signedTransaction = await adminKeypair.signTransaction(
    await Transaction.from(sponsoredTransaction.txBytes).build({
      client: suiClient,
    })
  );
  return {
    signedTransaction,
    sponsoredTransaction,
  };
};
