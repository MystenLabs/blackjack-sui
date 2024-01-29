import hkdf from "futoin-hkdf";

export const getBLSSecreyKey = (privateKey: string) => {
    // initial key material
    const ikm = privateKey;
    const length = 32;
    const salt = "blackjack";
    const info = "bls-signature";
    const hash = 'SHA-256';
    const derivedSecretKey = hkdf(ikm, length, {salt, info, hash});
    return Uint8Array.from(derivedSecretKey);
}