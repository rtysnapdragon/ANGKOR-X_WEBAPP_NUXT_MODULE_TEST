export default (path, isWeb) => {
  if (!path) return "";

  const { config } = helper();

  const tmpServer = useCookie("tmp_server").value;
  const tmpWebServer = useCookie("tmp_web_server").value;

  if (path.toLowerCase().startsWith("http")) return path;

  if (!path.startsWith("/")) path = `/${path}`;

  let server = isWeb
    ? isNotEmpty(tmpWebServer) ? tmpWebServer : config.webUrl
    : isNotEmpty(tmpServer)   ? tmpServer    : config.apiUrl;

  server = server?.endsWith("/") ? server.replace(/\/$/, "") : server;

  return `${server}${path}`;
};
