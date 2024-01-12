import { deriveBLS_SecretKey, ADMIN_SECRET_KEY } from "./config";
import { bls12_381 } from "@noble/curves/bls12-381";
import { utils } from "@noble/bls12-381";

interface GenerateBLSSigProps {
  counter: number;
  userRandomness: Uint8Array;
}

export const generateBLSSig = ({
  counter,
  userRandomness,
}: GenerateBLSSigProps) => {
  const counterHex = utils.bytesToHex(Uint8Array.from([counter]));
  const randomnessHexString = utils.bytesToHex(userRandomness);
  const messageToSign = randomnessHexString.concat(counterHex)
  const secretKey = deriveBLS_SecretKey(ADMIN_SECRET_KEY!);
  const signedHouseHash = bls12_381.sign(messageToSign, secretKey);
  const adminPublicKey = bls12_381.getPublicKey(secretKey);
  const isValid = bls12_381.verify(
    signedHouseHash,
    messageToSign,
    adminPublicKey
  );

  console.log({
    counterHex,
    randomnessHexString,
    messageToSign,
    secretKey,
    signedHouseHash,
    userRandomness,
    adminPublicKey,
    isValid,
  });
};

generateBLSSig({
  counter: 0,
  userRandomness: Uint8Array.from([
    1, 2, 3, 4, 5, 6
  ]),
});
