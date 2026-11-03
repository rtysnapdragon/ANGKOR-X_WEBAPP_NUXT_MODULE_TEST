import decodeBase64 from "./decodeBase64";

export default (token) => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT: must contain 3 parts");
  }

  const header = decodeBase64(parts[0]);
  const payload = decodeBase64(parts[1]);

  return {
    header: JSON.parse(header),
    payload: JSON.parse(payload),
    signature: parts[2],
  };
};
