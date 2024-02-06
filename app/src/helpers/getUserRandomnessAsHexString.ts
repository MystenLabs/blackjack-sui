import { bytesToHex, randomBytes } from "@noble/hashes/utils";

export const getUserRandomnessAsHexString = () => {
  const userRandomness = randomBytes(16);
  return bytesToHex(userRandomness);
};
