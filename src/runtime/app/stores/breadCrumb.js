import { defineStore, acceptHMRUpdate } from "#imports";
export const useBreadCrumbStore = defineStore("breadCrumbStore", {
  state: () => ({
    data: {
      hasBack: false,
      toolTip: null,
      label: null,
      fnBack: () => {},
    },
  }),
  actions: {
    add(d) {
      this.data = d;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBreadCrumb, import.meta.hot));
}
