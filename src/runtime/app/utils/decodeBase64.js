export default (base64Url) => {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  base64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return atob(base64);
};
