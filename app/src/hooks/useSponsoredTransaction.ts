import { useCallback } from "react";
import { toBase64 } from "@mysten/bcs";
import { Transaction } from "@mysten/sui/transactions";
import { useSui } from "./useSui";
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

export default function useSponsoredTransaction() {
	const { suiClient } = useSui();
	const currentAccount = useCurrentAccount();
	const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

	const sponsorAndSignTransaction = useCallback(async (tx: Transaction) => {
		if (!currentAccount) {
			throw new Error('No account is available');
		}

		const txBytes = await tx.build({
			client: suiClient,
			onlyTransactionKind: true,
		});

		// Step 2: Send TxBytes to the backend for sponsorship
		const sponsorResponse = await fetch("/api/sponsor", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				transactionKindBytes: toBase64(txBytes),
				sender: currentAccount.address,
			}),
		});

		if (!sponsorResponse.ok) {
			throw new Error("Failed to sponsor transaction");
		}
		const { bytes: sponsoredBytes } = await sponsorResponse.json();

		const { digest: executedDigest } = await signAndExecuteTransaction({
			transaction: sponsoredBytes,
		});
		await suiClient.waitForTransaction({
			digest: executedDigest,
			timeout: 60_000,
		});

		return suiClient
			.getTransactionBlock({
				digest: executedDigest,
				options: {
					showEffects: true,
					showObjectChanges: true,
					showEvents: true,
				},
			});

	}, [currentAccount, signAndExecuteTransaction, suiClient]);

	return {
		sponsorAndSignTransaction,
	}
}