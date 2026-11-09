// export const useAuthorizeIframe = authorizeIframe;

// async function authorizeIframe(data, retry = 0) {
//   const dom = document.getElementById("SETATHORIZECOOKIE");

//   if (!dom && retry < 1000) {
//     await new Promise((r) => setTimeout(r, 300));
//     return authorizeIframe(data, retry + 1);
//   }

//   if (data) dom?.contentWindow.postMessage(data, "*");
//   return ref(dom);
// }

import { ref } from "vue";

export const useAuthorizeIframe = authorizeIframe;

async function authorizeIframe(data, retry = 0) {
  const dom = document.getElementById("SETATHORIZECOOKIE");

  if (!dom) {
    if (retry >= 1000) {
      throw new Error("Authorization iframe not found.");
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    return authorizeIframe(data, retry + 1);
  }

  if (data) {
    dom.contentWindow?.postMessage(data, "*");
    // dom.contentWindow?.postMessage(data, "https://your-trusted-origin.com");
  }

  return ref(dom);
}