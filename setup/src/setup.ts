import { Connection, JsonRpcProvider } from "@mysten/sui.js";
import { ADMIN_ADDRESS, SUI_NETWORK } from "./config";
import { getCoinsOfAddress } from "./examples/getCoinsOfAddress";

console.log("Connecting to SUI network: ", SUI_NETWORK);

const run = async () => {
  const connection = new Connection({
    fullnode: SUI_NETWORK,
  });
  const provider = new JsonRpcProvider(connection);
  const coins = await getCoinsOfAddress({ provider, address: ADMIN_ADDRESS });
  console.log(coins);
};

run();
