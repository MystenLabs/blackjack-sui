import { fromB64 } from "@mysten/sui.js/utils";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";

export const getKeypair = (secretKey: string) => {
  let privateKeyArray = Uint8Array.from(Array.from(fromB64(secretKey)));
  const keypairAdmin = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));
  return keypairAdmin;
};
