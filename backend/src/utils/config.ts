import { config } from "dotenv";

config({});

export const PORT = process.env.PORT || 8080;
export const DEBUG_LEVEL = process.env.DEBUG_LEVEL || "info";