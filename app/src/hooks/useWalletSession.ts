import {useCurrentWallet, useWallets} from "@mysten/dapp-kit";
import {AuthProvider, EnokiWallet, getSession, isEnokiWallet} from "@mysten/enoki";
import {useEffect, useState} from "react";

export default function useWalletSession() {
	const currentAccount = useCurrentWallet()
	const wallets = useWallets().filter(isEnokiWallet);
	const [jwt, setJwt] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			const walletsByProvider = wallets.reduce<
				Map<AuthProvider, EnokiWallet>
			>((map, wallet) => {
				map.set(wallet.provider, wallet);
				return map;
			}, new Map<AuthProvider, EnokiWallet>());

			const googleWallet = walletsByProvider.get("google");
			if (!googleWallet) {
				throw new Error('Google wallet provider is not available');
			}

			const session = await getSession(googleWallet);
			if (session?.jwt) {
				setJwt(session.jwt);
			}
		})();
	}, [wallets, currentAccount]);

	return {
		jwt,
	};
}