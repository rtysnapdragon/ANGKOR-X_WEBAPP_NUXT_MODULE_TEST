import type { HttpOptions, HeaderResult } from "../models/http.js";
import { useCookie, useUserData } from "#imports";
import helper from "../utils/helper.js";
import getDeviceId from "../utils/getDeviceId.js";
import getUrl from "../utils/getUrl.js";
import isNotEmpty from "../utils/isNotEmpty.js";

export default function useOptions(
  url: string,
  options?: HttpOptions
): HeaderResult | undefined {
  const { str, config } = helper();
  const userCatch = useUserData().value;
  const locale = useCookie(str.langCode);
  const deviceId = getDeviceId();
  const lang = locale.value ?? "en";
  const dbCookie = useCookie(str.dbCode);
  let authorization = "";

  // if (!options?.isGlobal && !userCatch) return;

  // if (!options?.isGlobal) {
  //   const val: any = useUserData().value;
  //   authorization = `${val.token_type} ${val.access_token}`;
  // } else {
  //   // Prefer JWT from access_token cookie (CEREMONY_WEBAPP_NUXT pattern);
  //   // fall back to basic key for other apps that don't use JWT cookies.
  //   const jwtToken = useCookie('access_token').value;
  //   authorization = jwtToken ? `Bearer ${jwtToken}` : `basic ${config.basicKey}`;
  // }
    const jwtToken = useCookie('access_token').value;
    authorization = jwtToken ? `Bearer ${jwtToken}` : `basic ${config.basicKey}`;
  let newHeader;

  if (isNotEmpty(options?.headers)) {
    newHeader = options?.headers;
    delete options?.headers;
  }

  // Map `body` → `data` so axios receives the payload correctly
  const { body, ...restOptions } = options ?? {};

  options = {
    headers: {
      Authorization: authorization,
      "Content-Type": body instanceof FormData ? undefined : "application/json",
      Accept: "application/json, text/javascript, */*; q=0.01",
      lang,
      device_id: deviceId,
      database: dbCookie.value,
      ...newHeader,
    },
    ...restOptions,
    ...(body !== undefined ? { data: body } : {}),
  };

  // Remove undefined Content-Type so browser sets multipart boundary for FormData
  if (body instanceof FormData) {
    delete (options.headers as any)["Content-Type"];
  }

  return { url: getUrl(url, options?.isWeb), options };
}
