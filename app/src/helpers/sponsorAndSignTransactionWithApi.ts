import { SuiClient } from "@mysten/sui/src/client";
import { Transaction} from "@mysten/sui/src/transactions";

interface Args {
	tx: Transaction;
	suiClient: SuiClient;
	sender: string;
}

export default function sponsorAndSignTransactionWithApi<T>({ tx, suiClient, sender }: Args) {


}