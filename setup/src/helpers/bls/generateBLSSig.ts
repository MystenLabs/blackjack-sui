import { ADMIN_SECRET_KEY } from "../../config";
import { bls12_381 } from "@noble/curves/bls12-381";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { getBLSSecreyKey } from "./getBLSSecretKey";

interface GenerateBLSSigProps {
  counter: number;
  userRandomness: Uint8Array;
}

export const generateBLSSig = ({
  counter,
  userRandomness,
}: GenerateBLSSigProps) => {
  const counterHex = bytesToHex(Uint8Array.from([counter]));
  const randomnessHexString = bytesToHex(userRandomness);
  const messageToSign = randomnessHexString.concat(counterHex);

  const secretKey = getBLSSecreyKey(ADMIN_SECRET_KEY!);
  const signedHouseHash = bls12_381.sign(messageToSign, secretKey);

  const adminPublicKey = bls12_381.getPublicKey(secretKey);
  const isValid = bls12_381.verify(
    signedHouseHash,
    messageToSign,
    adminPublicKey
  );

  console.log({
    counterHex,
    // randomnessHexString,
    // messageToSign,
    // secretKey,
    // signedHouseHash,
    // userRandomness,
    // adminPublicKey,
    isValid,
  });
  return signedHouseHash;
};

const signatures: Uint8Array[] = [];
for (let counter = 0; counter < 10; counter++) {
  const signature = generateBLSSig({
    counter,
    userRandomness: Uint8Array.from([
      49, 54, 54, 100, 57, 55, 51, 51, 52, 48, 57, 55, 57, 99, 101, 101, 101,
      54, 56, 97, 101, 55, 57, 97, 57, 48, 98, 98, 56, 100, 55, 52, 203, 238,
      99, 168, 234, 77, 171, 131, 149, 30, 131, 196, 89, 118, 163, 234, 52, 79,
      168, 132, 153, 253, 170, 108, 219, 244, 73, 224, 168, 245, 135, 100, 0, 0,
      0, 0, 0, 0, 0, 0,
    ]),
  });
  signatures.push(signature);
}

console.log(signatures);
