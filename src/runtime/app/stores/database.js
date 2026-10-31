import { defineStore, acceptHMRUpdate } from 'pinia'
const { api, str } = helper()

export const useDatabaseStore = defineStore("DatabaseStore", {
  state: () => ({
    loading: true,
    data: {},
    selected: {},
  }),
  getters: {
    getLoading: (state) => state.loading,
    getData: (state) => state.data,
    getList: (state) => state.data.Data,
  },
  actions: {
    async get(search = "") {
      console.log('Search -------------------------> ',search)
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      const dbCookie = useCookie(str.dbCode, { expires, sameSite: "lax" });
      const toast = useToast();
      try {
        if (isEmpty(this.data) || search != "") this.loading = true;
        let filter = {
          Pages: 1,
          Records: 0,
          Status: [1, 3, 4],
          Search: search,
        };
        const { data, error } = await useHttp(api.database, {
          method: "POST",
          data: filter,
        });

        if (error.value) throw error.value;

        if (data.value) {
          this.data = data.value;
          this.selected = data.value?.Data?.find(
            (e) => e.Code === dbCookie.value
          );
        }

        this.loading = false;
      } catch (e) {
        this.loading = false;
        toast.add({
          color: "red",
          title: `${e.Message || e.detail?.Message || e.detail}`,
        });
      }
    },
  },
});
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDatabaseStore, import.meta.hot));
}
