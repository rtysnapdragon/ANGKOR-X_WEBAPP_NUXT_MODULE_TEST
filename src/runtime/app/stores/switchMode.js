import { defineStore, acceptHMRUpdate } from "#imports";
export const useModeStore = defineStore("ModeStore", {
  state: () => ({
    isDark: null,
  }),
  actions: {
    set(d) {
      this.isDark = d;
    },
  },
});
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useModeStore, import.meta.hot));
}
