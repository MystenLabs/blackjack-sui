import { config } from "dotenv";

config({});
export const SUI_NETWORK = process.env.SUI_NETWORK!;
export const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS!;
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY!;
export const BJ_PLAYER_SECRET_KEY = process.env.BJ_PLAYER_SECRET_KEY!;
export const BJ_PLAYER_2_SECRET_KEY = process.env.BJ_PLAYER_2_SECRET_KEY!;
export const PACKAGE_ADDRESS = process.env.PACKAGE_ADDRESS!;

export const HOUSE_ADMIN_CAP = process.env.HOUSE_ADMIN_CAP!;

export const HOUSE_DATA_ID = process.env.HOUSE_DATA_ID!;
export const GAME_ID = process.env.GAME_ID!;

// console.log everything in the process.env object
const keys = Object.keys(process.env);
console.log("env contains ADMIN_ADDRESS:", keys.includes("ADMIN_ADDRESS"));
console.log(
  "env contains ADMIN_SECRET_KEY:",
  keys.includes("ADMIN_SECRET_KEY")
);
