import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getKeypair } from "../helpers/getKeyPair";
import { enokiClient } from "@/app/api/EnokiClient";
import serverConfig from "@/config/serverConfig";
import { toBase64 } from "@mysten/bcs";

interface SponsorAndSignTransactionProps {
  suiClient: SuiClient;
  tx: Transaction;
}

export const sponsorAndSignTransaction = async ({
  tx,
  suiClient,
}: SponsorAndSignTransactionProps) => {
  const adminKeypair = getKeypair(serverConfig.ADMIN_SECRET_KEY);
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  const sponsoredTransaction = await enokiClient.createSponsoredTransaction({
    network: serverConfig.NEXT_PUBLIC_SUI_NETWORK_NAME,
    transactionKindBytes: toBase64(txBytes),
    sender: adminKeypair.toSuiAddress(),
  });

  const signedTransaction = await adminKeypair.signTransaction(
    await Transaction.from(sponsoredTransaction.bytes).build({
      client: suiClient,
    })
  );

  return {
    sponsoredTransaction,
    signedTransaction,
  };
};
