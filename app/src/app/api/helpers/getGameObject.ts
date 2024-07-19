import { GameOnChain } from "@/types/GameOnChain";
import { SuiClient, SuiMoveObject } from "@mysten/sui/client";

interface GetGameObjectProps {
  suiClient: SuiClient;
  gameId: string;
}
export const getGameObject = async ({
  suiClient,
  gameId,
}: GetGameObjectProps): Promise<GameOnChain> => {
  const res = await suiClient.getObject({
    id: gameId,
    options: { showContent: true },
  });
  const gameObject = res?.data?.content as SuiMoveObject;
  const { fields } = gameObject;
  return fields as unknown as GameOnChain;
};
