import { SuiClient } from "@mysten/sui/client";
import { getKeypair } from "../keypair/getKeyPair";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../../config";

interface GetIsHouseAdminCapBurntProps {
  suiClient: SuiClient;
}

export const getIsHouseAdminCapBurnt = async ({
  suiClient,
}: GetIsHouseAdminCapBurntProps): Promise<boolean> => {
  const adminKeypair = getKeypair(ADMIN_SECRET_KEY!);
  const adminAddress = adminKeypair.getPublicKey().toSuiAddress();

  return suiClient
    .getOwnedObjects({
      owner: adminAddress,
      filter: {
        StructType: `${PACKAGE_ADDRESS}::single_player_blackjack::HouseAdminCap`,
      },
    })
    .then(async (resp) => {
      return resp.data.length === 0;
    });
};
