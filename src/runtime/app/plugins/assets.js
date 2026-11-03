// src/runtime/plugins/assets.js
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      public: (path) => {
        if (path.startsWith("/")) {
          path = path.slice(1);
        }

        return `/_rtytech/${path}`;
      },
    },
  };
});
