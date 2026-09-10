import * as Crypto from "expo-crypto";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string) {
  const saltBytes = await Crypto.getRandomBytesAsync(16);
  const salt = bytesToHex(saltBytes);

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );

  return {
    hash,
    salt,
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
) {
  const generatedHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${storedSalt}:${password}`
  );

  return generatedHash === storedHash;
}