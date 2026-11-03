export const useAuthorizeIframe = authorizeIframe;

async function authorizeIframe(data, retry = 0) {
  const dom = document.getElementById("SETATHORIZECOOKIE");

  if (!dom && retry < 1000) {
    await new Promise((r) => setTimeout(r, 300));
    return authorizeIframe(data, retry + 1);
  }

  if (data) dom?.contentWindow.postMessage(data, "*");
  return ref(dom);
}
