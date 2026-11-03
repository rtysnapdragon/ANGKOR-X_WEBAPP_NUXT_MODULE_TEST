import { defineStore, acceptHMRUpdate } from "#imports";
export const useRChipDataStore = defineStore("RChipDataStore", {
    state: () => ({
        data: {},
    }),
    getters: {
        getData: (state) => state.data,
    },
    actions: {
        clearAllData(stateKey) {
            if (isNotEmpty(stateKey)) {
                this.data = { ...this.data, ...{ [stateKey]: {} } }
            } else {
                this.data = {}
            }
        },
        clearData(stateKey) {
            if (isEmpty(stateKey)) return
            this.data = { ...this.data, ...{ [stateKey]: { ...this.data[stateKey], ...{ data: {} } } } }
        },
        setData(data) {
            this.data = data
        },
    },
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useRChipDataStore, import.meta.hot));
}