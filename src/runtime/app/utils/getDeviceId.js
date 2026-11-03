import { v4 as uuidv4 } from "uuid";
import { useCookie } from "nuxt/app";
import str from "../helpers/str";
export default () => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  const deviceId = useCookie(str.deviceId, { expires, sameSite: "lax" });

  if (!deviceId.value) {
    deviceId.value = uuidv4();
  }

  return deviceId.value;
};
