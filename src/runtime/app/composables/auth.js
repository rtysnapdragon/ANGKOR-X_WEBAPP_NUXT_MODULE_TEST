import { ref } from "vue";
import axios from "axios";

export const useAuth = async (args) => {
  const { str, config } = helper();
  const userCatch = useUserData().value;
  const isOnline = useOnline();
  const locale = useCookie(str.langCode).value;
  const deviceId = getDeviceId();
  const dbCode = useCookie(str.dbCode).value;
  const isActionLogin =
    isNotEmpty(args?.username) || isNotEmpty(args?.password);

  try {
    if (!isOnline.value) {
      throw {
        response: {
          data: {
            Message: "No internet connection",
            StatusCode: 1001,
          },
        },
      };
    }

    const toPascalCase = (obj = {}) =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/(^\w|[_-]\w)/g, (match) =>
            match.replace(/[_-]/g, '').toUpperCase()
          ),
          value,
        ])
      )

    const response = await axios({
      url: getUrl("rtsauth/oauth"),
      headers: {
        Authorization: `basic ${config.basicKey}`,
        "Content-Type": "application/json",
        rty_device_id: deviceId,
        rty_lang:locale,
        rty_database:dbCode
      },
      method: "post",
      data: {
        ...toPascalCase(args),
        Password: args?.password ?? "password",
        RememberMe: args?.remember ?? true,
        RefreshToken: isActionLogin ? null : userCatch?.refresh_token,
      },
    });

    let result = response.data;

    result = {
      token_type: result.token_type,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
      expires: result.expires,
      refresh_lifetime: result.refresh_lifetime,
    };

    result.created_at = new Date().toISOString();
    // result.created_at = new Date();

    useUserData(result);
    useAuthorizeIframe({
      action: "set_authorize_cookie",
      data: {
        cookie: {
          lang: locale ?? "en",
          database: dbCode || "",
          device_id: deviceId,
          access_token: result.access_token,
          expire: result.expires,
        },
        sameSite: config.sameSite,
      },
    });

    return { data: ref(result), error: ref(null) };
  } catch (e) {
    const data = e?.response?.data;
    if (data) {
      if (data.error == "invalid_grant" && !isActionLogin) {
        useCookie("rty_user_data").value = null;
        navigateTo(localePath("/login"));
      }
      return { error: ref(data), data: ref(null) };
    } else {
      return { error: ref(e), data: ref(null) };
    }
  }
};
