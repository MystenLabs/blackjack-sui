import { GasStationClient, SponsoredTransaction } from "shinami";
import { getAddress } from "../helpers/getAddress";

export const retryDelays = [1000, 2000, 4000];

interface SponsorTransactionProps {
  txBytes: Uint8Array;
  forceFailure?: boolean;
}

export const sponsorTransaction = async ({
  txBytes,
  forceFailure = false,
}: SponsorTransactionProps): Promise<SponsoredTransaction | undefined> => {
  console.log("Sponsoring transaction...");
  const gasStation = new GasStationClient(
    process.env.SHINAMI_GAS_STATION_API_KEY!
  );
  // convert the byte array to a base64 encoded string
  const gaslessPayloadBase64 = btoa(
    txBytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const sponsoredTx: SponsoredTransaction | undefined =
    await sponsorTransactionWithRetrying({
      gasStation,
      gaslessPayloadBase64: gaslessPayloadBase64,
      sender: getAddress(process.env.ADMIN_SECRET_KEY!),
      retryIndex: 0,
      forceFailure,
    });
  return sponsoredTx;
};

interface SponsorTransactionWithRetryingProps {
  gasStation: GasStationClient;
  gaslessPayloadBase64: string;
  sender: string;
  retryIndex: number;
  forceFailure?: boolean;
}

const sponsorTransactionWithRetrying = async ({
  gasStation,
  gaslessPayloadBase64,
  sender,
  retryIndex,
  forceFailure = false,
}: SponsorTransactionWithRetryingProps): Promise<
  SponsoredTransaction | undefined
> => {
  return gasStation
    .sponsorTransactionBlock(
      forceFailure ? "123" : gaslessPayloadBase64,
      sender,
      1_900_000_000
    )
    .then((resp) => {
      return resp;
    })
    .catch(async (err) => {
      console.log(
        "Error sponsoring tx: Code = " + err.code + " | Details = " + err
      );
      if (retryIndex < retryDelays.length) {
        const retryDelay = retryDelays[retryIndex];
        console.log(`Waiting for ${retryDelay}...`);
        await delay(retryDelay);
        console.log(`Retrying for the ${retryIndex + 1} time...`);
        return sponsorTransactionWithRetrying({
          gasStation,
          gaslessPayloadBase64,
          sender,
          retryIndex: retryIndex + 1,
          forceFailure: false,
        });
      }
      return undefined;
    });
};

const delay = (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};
