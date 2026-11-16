// import { defineStore, acceptHMRUpdate } from "#imports";
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAuthorizeIframeStore = defineStore("AuthorizeIframeStore", {
  state: () => ({
    loading: false,
  }),
  getters: {},
  actions: {
    async setLoaded() {
      this.loading = true;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useAuthorizeIframeStore, import.meta.hot)
  );
}
