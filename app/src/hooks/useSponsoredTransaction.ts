import { useCallback } from "react";
import { toBase64 } from "@mysten/bcs";
import { Transaction } from "@mysten/sui/transactions";
import { useSui } from "./useSui";
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';

export default function useSponsoredTransaction() {
	const { suiClient } = useSui();
	const currentAccount = useCurrentAccount();
	const { mutateAsync: signTransaction } = useSignTransaction();

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
		const { bytes: sponsoredBytes, digest: sponsoredDigest } = await sponsorResponse.json();

		// 3) Sign the sponsored TxBytes
		const { signature } = await signTransaction({
			transaction: sponsoredBytes,
		});

		// 4) Execute the sponsored + signed TxBytes
		const execResp = await fetch("/api/execute", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ digest: sponsoredDigest, signature }),
		});

		if (!execResp.ok) {
			throw new Error(`Failed to execute transaction: ${execResp.status}`);
		}

		const { digest: executedDigest } = (await execResp.json()) as {
			digest: string;
		};

		await suiClient.waitForTransaction({
			digest: executedDigest,
			timeout: 10_000,
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

	}, [currentAccount, signTransaction, suiClient]);

	return {
		sponsorAndSignTransaction,
	}
}