import { SuiClient } from "@mysten/sui/client";

interface GetCounterIdProps {
  address: string;
  suiClient: SuiClient;
}

export const getCounterId = async ({
  address,
  suiClient,
}: GetCounterIdProps): Promise<string | undefined> => {
  return suiClient
    .getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::counter_nft::Counter`,
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
