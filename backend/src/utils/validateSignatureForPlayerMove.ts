import { SuiClient } from "@mysten/sui.js/client";
import { getGameObject } from "../helpers/getGameObject";
import { verifyPersonalMessage } from "@mysten/sui.js/verify";
import { logger } from "./logger";

interface VerifySignatureForPlayerMoveProps {
  suiClient: SuiClient;
  gameId: string;
  signature: string;
  move: "hit" | "stand";
}

export const isSignatureForPlayerMoveValid = async ({
  suiClient,
  gameId,
  signature,
  move,
}: VerifySignatureForPlayerMoveProps): Promise<boolean> => {
  const game = await getGameObject({ suiClient, gameId });
  const message = game.id.id + move + game.player_sum;
  const encodedMessage = new TextEncoder().encode(message);
  const publicKey = await verifyPersonalMessage(encodedMessage, signature);
  const address = publicKey.toSuiAddress();
  if (address !== game.player) {
    logger.error(
      `Player address ${address} does not match game player address ${game.player}`
    );
    return false;
  }
  return true;
};
