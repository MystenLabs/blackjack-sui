import { SuiClient } from "@mysten/sui/client";
import { PACKAGE_ADDRESS } from "../../config";

interface GetCounterNftObjectProps {
  address: string;
  suiClient: SuiClient;
}

export const getCounterNftId = async ({
  address,
  suiClient,
}: GetCounterNftObjectProps): Promise<string | undefined> => {
  return suiClient
    .getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ADDRESS}::counter_nft::Counter`,
      },
    })
    .then(async (res) => {
      const objects = res?.data;
      if (objects.length > 0) {
        return objects[0]?.data?.objectId;
      }
      return undefined;
    })
    .catch((err) => {
      console.log(err);
      return undefined;
    });
};
