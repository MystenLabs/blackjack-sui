import { config } from "dotenv";

config({});

export const PORT = process.env.PORT || 8080;
export const DEBUG_LEVEL = process.env.DEBUG_LEVEL || "info";
export const SUI_NETWORK = process.env.SUI_NETWORK!;
export const PACKAGE_ADDRESS = process.env.PACKAGE_ADDRESS!;
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY!;
export const HOUSE_DATA_ID = process.env.HOUSE_DATA_ID!;
