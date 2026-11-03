import { defineStore, acceptHMRUpdate } from "#imports";
export const useConfirmStore_1 = defineStore("ConfirmStore", {
  state: () => ({
    confirm: null,
    loading: false
  }),
  getters: {
    data: (state) => state.confirm,
  },
  actions: {
    setLoading(loading) {
      this.loading = loading
    },
    hide() {
      this.confirm = null;
    },
    show(props) {
      this.confirm = props;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfirmStore, import.meta.hot));
}
