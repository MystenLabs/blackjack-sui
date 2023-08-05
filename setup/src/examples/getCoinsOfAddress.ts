import { Coin, JsonRpcProvider } from "@mysten/sui.js";

interface GetMyCoinsProps {
  provider: JsonRpcProvider;
  address: string;
}

export const getCoinsOfAddress = async ({
  provider,
  address,
}: GetMyCoinsProps) => {
  let coins: Coin = [];
  await provider
    .getAllCoins({
      owner: address,
    })
    .then((resp) => {
      coins = resp.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return coins;
};
