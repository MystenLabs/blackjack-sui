import {useSuiClientContext} from "@mysten/dapp-kit";
import {PropsWithChildren, useEffect} from "react";
import {isEnokiNetwork, registerEnokiWallets} from "@mysten/enoki";

export default function EnokiWalletProvider({ children }: PropsWithChildren) {

	const { client, network } = useSuiClientContext();
	useEffect(() => {
		if (!isEnokiNetwork(network)) return;

		const { unregister } = registerEnokiWallets({
			apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
			providers: {
				google: {
					clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
					// TODO Redirect URI?
				},
			},
			client: client as never,
			network,
		});

		return unregister;
	}, [client, network]);

	return children;
}