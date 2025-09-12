"use client";

import { LargeScreenLayout } from "@/components/layouts/LargeScreenLayout";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { useRegisterServiceWorker } from "@/hooks/useRegisterServiceWorker";
import { ChildrenProps } from "@/types/ChildrenProps";
import React, {useEffect} from "react";
import { Toaster } from "react-hot-toast";
import {createNetworkConfig, SuiClientProvider, useSuiClientContext, WalletProvider} from "@mysten/dapp-kit";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {isEnokiNetwork, registerEnokiWallets} from "@mysten/enoki";
import EnokiWalletProvider from "@/contexts/EnokiWalletProvider";

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
	[process.env.NEXT_PUBLIC_SUI_NETWORK_NAME!]: {
		url: process.env.NEXT_PUBLIC_SUI_NETWORK!,
	},
});
const queryClient = new QueryClient();

export const ProvidersAndLayout = ({ children }: ChildrenProps) => {
	const _ = useRegisterServiceWorker();

	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
				<WalletProvider autoConnect>
					<EnokiWalletProvider>
						<BalanceProvider>
							<main
								className={`min-h-screen w-screen`}
								style={{
									backgroundImage: "url('/general/background.svg')",
									backgroundSize: "cover",
									backgroundPositionX: "center",
									backgroundPositionY: "top",
								}}
							>
								<LargeScreenLayout>{children}</LargeScreenLayout>
								<Toaster
									position="bottom-center"
									toastOptions={{
										duration: 5000,
									}}
								/>
							</main>
						</BalanceProvider>
					</EnokiWalletProvider>
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
};
