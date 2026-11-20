import { defineStore, acceptHMRUpdate } from "#imports";
export const useRTableDataStore = defineStore("RTYTableDataStore", {
  state: () => ({
    data: {},
    row: null,
  }),
  getters: {
    getData: (state) => state.data,
  },
  actions: {
    clearAllData(stateKey) {
      if (isNotEmpty(stateKey)) {
        this.data = { ...this.data, ...{ [stateKey]: {} } };
      } else {
        this.data = {};
      }
    },
    clearData(stateKey) {
      if (isEmpty(stateKey)) return;
      this.data = {
        ...this.data,
        ...{ [stateKey]: { ...this.data[stateKey], ...{ data: [] } } },
      };
    },
    setData(data) {
      this.data = data;
    },
    upDateData(stateKey, obj) {
    //   const listTable = this.data[stateKey];
      if (isEmpty(this.data[stateKey])) return;
      if (isEmpty(obj)) return;

      if (this.data[stateKey]?.data?.some((e) => e.Id === obj.Id)) {
        this.data[stateKey].data = this.data[stateKey].data.map((e) => {
          if (e.Id === obj.Id) {
            return { ...e, ...obj };
          }
          return e;
        });

        console.log(obj, "===>>>", this.data[stateKey]);
      }
    },
    setRow(row) {
      this.row = row;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRTableDataStore, import.meta.hot));
}
