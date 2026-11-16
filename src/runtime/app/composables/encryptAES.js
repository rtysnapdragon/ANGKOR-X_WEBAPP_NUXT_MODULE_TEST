import CryptoJS from "crypto-js";

export default (plain, secretKey) => {
  return encryptAES(plain, secretKey);
};

const encryptAES = (plain, secretKey) => {
  secretKey ??= "017c5da476f6ff1fbb08de6f6bf812ed6dd6343b0f39ce556b8c0bfbaf68c777";

  if (isEmpty(plain)) return "";

  const keys = getKey(secretKey);
  const encrypted = CryptoJS.AES.encrypt(String(plain), keys.key, keys.options);

  return encrypted.toString();
};

const getKey = (secretKey) => {
  const _secretKey =
    secretKey.length > 32 ? secretKey.substring(0, 32) : secretKey;
  const key = CryptoJS.enc.Utf8.parse(_secretKey.trim().padEnd(32, "*"));

  return {
    key,
    options: {
      iv: CryptoJS.enc.Utf8.parse("".padEnd(16, "*")),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  };
};