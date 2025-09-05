import { SuiCodegenConfig } from '@mysten/codegen'
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const config: SuiCodegenConfig = {
	output: './src/__generated__',
	generateSummaries: true,
	prune: true,
	packages: [
		{
			package: 'blackjack',
			path: path.join(__dirname, '../move/blackjack'),
		},
	],
};

export default config;