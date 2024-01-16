import { SuiClient, SuiMoveObject } from "@mysten/sui.js/client";

interface GetGameObjectProps {
  suiClient: SuiClient;
  gameId: string;
}
export const getGameObject = async ({
  suiClient,
  gameId,
}: GetGameObjectProps) => {
  const res = await suiClient.getObject({
    id: gameId,
    options: { showContent: true },
  });
  const gameObject = res?.data?.content as SuiMoveObject;
  return gameObject;
};
