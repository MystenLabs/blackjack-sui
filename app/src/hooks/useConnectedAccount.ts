import {useCurrentAccount} from "@mysten/dapp-kit";

export default function useConnectedAccount() {
	const account = useCurrentAccount();

	if (!account) {
		throw new Error('No account is available');
	}
}