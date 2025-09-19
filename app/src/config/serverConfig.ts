import { z } from "zod";

/*
 * The schema for the server-side environment variables
 * These variables should be defined in:
 * * the app/.env.development.local file for the local environment
 * * the Vercel's UI for the deployed environment
 * They must not be tracked by Git
 * They are SECRET, and not exposed to the client side
 */

const serverConfigSchema = z.object({
  ENOKI_SECRET_KEY: z.string(),
  ADMIN_SECRET_KEY: z.string(),
  NEXT_PUBLIC_SUI_NETWORK_NAME: z.enum(['mainnet', 'testnet', 'devnet']),
});

const serverConfig = serverConfigSchema.safeParse({
  ENOKI_SECRET_KEY: process.env.ENOKI_SECRET_KEY,
  ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
  NEXT_PUBLIC_SUI_NETWORK_NAME: process.env.NEXT_PUBLIC_SUI_NETWORK_NAME,
});

if (!serverConfig.success) {
  console.error("Invalid environment variables:", serverConfig.error.format());
  throw new Error("Invalid environment variables");
}

export default serverConfig.data;
