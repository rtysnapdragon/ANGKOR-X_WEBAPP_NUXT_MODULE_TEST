import { useLocalePath, useCookie } from "#imports";
export default (path) => {
  const cookie = useCookie("i18n_redirected").value;
  return cookie != "en" ? `/${cookie}${path}` : path;
};
