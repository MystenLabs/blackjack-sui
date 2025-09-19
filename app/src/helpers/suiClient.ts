import { SuiClient } from '@mysten/sui/client';

export const suiClient = new SuiClient({
	url: process.env.NEXT_PUBLIC_SUI_NETWORK!,
	mvr: {
		overrides: {
			packages: {
				'@local-pkg/blackjack': process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!,
			},
		},
	},
});
