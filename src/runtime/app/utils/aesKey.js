import CryptoJS from "crypto-js";

// Shared key+IV derivation used by both encryptAES and decryptAES.
// Fixed IV is intentional for this app's session-storage use case (obfuscation, not encryption-at-rest).
export const getAesKey = (secretKey) => {
  const normalized = secretKey.length > 32
    ? secretKey.substring(0, 32)
    : secretKey.trim().padEnd(32, "*");

  return {
    key: CryptoJS.enc.Utf8.parse(normalized),
    options: {
      iv: CryptoJS.enc.Utf8.parse("".padEnd(16, "*")),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  };
};
