import { useCallback } from "react";
import { useEnokiFlow } from "@mysten/enoki/react";
import { fromBase64, toBase64 } from "@mysten/bcs";
import { Transaction } from "@mysten/sui/transactions";
import { useSui } from "./useSui";

export default function useSponsoredTransaction() {
	const { suiClient } = useSui();
	const enokiFlow = useEnokiFlow();

	const sponsorAndSignTransaction = useCallback(async (tx: Transaction, sender: string) => {
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
				sender,
			}),
		});

		if (!sponsorResponse.ok) {
			throw new Error("Failed to sponsor transaction");
		}
		const { bytes: sponsoredBytes, digest: txDigest } =
			await sponsorResponse.json();

		// Step 3: User signs the sponsored TxBytes
		const signer = await enokiFlow.getKeypair({
			network: process.env.NEXT_PUBLIC_SUI_NETWORK_NAME! as
				| "mainnet"
				| "testnet",
		});

		const { signature } = await signer.signTransaction(
			fromBase64(sponsoredBytes)
		);

		// Step 4: Send signed TxBytes and txDigest back to the backend for execution
		const executeResponse = await fetch("/api/execute", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				digest: txDigest,
				signature: signature,
			}),
		});

		if (!executeResponse.ok) {
			throw new Error("Failed to execute transaction");
		}

		const { digest: executedDigest } = await executeResponse.json();

		// Step 5: Wait for transaction confirmation
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

	}, [enokiFlow, suiClient]);

	return {
		sponsorAndSignTransaction,
	}
}