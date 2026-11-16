import { defineStore, acceptHMRUpdate, useToast } from "#imports";
import devPermission from "../assets/json/dev_permission.json";
import techPermission from "../assets/json/tech_permission.json";

const { api, config, str } = helper();
const toast = useToast();

export const usePermissionStore = defineStore("PermissionStore", {
  state: () => ({
    loading: false,
    currName: "",
    currentDbCode: "",
    data: [],
  }),
  getters: {
    getLoading: (state) => state.loading,
    getData: (state) => state.data,
    getChildLevelOne: (state) => {
      let data = flattenData(state.data);

      if (config.isDevelopment || isTesting()) {
        data = addDevPermission(data);
      }

      return data;
    },
    getCurrent: (state) => {
      let data = flattenData(state.data);

      if (config.isDevelopment || isTesting()) {
        data = addDevPermission(data);
      }

      return data.filter((e) => e.Name === state.currName);
    },
    getIsExist: (state) => {
      let data = flattenData(state.data);

      // Is development or testing
      if (config.isDevelopment || isTesting()) {
        data = addDevPermission(data);
      }

      // Add permission for the teacher
      const isTeacher = extractDataFromAccessToken()["o:t"] == "Teacher";

      if (isTeacher) {
        data.push(techPermission);
      }

      return data.some((e) => e.Name === state.currName);
    },
  },
  actions: {
    setCurrName(key) {
      this.currName = key;
    },
    async fetched() {
      const dbCode = useCookie(str.dbCode).value;

      if (this.data.length && this.currentDbCode == dbCode) return;
      if (this.loading) return;

      try {
        this.loading = true;
        const { error, data } = await useHttp(api.permissions, {
          method: "post",
        });

        if (error.value) {
          throw {
            Message: error.value.message || "Failed to fetch permissions.",
          };
        }

        if (data.value) {
          this.currentDbCode = dbCode;
          this.data = data.value;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: `${e.Message}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionStore, import.meta.hot));
}

function isTesting() {
  try {
    return ISTESTING;
  } catch (e) {
    return false;
  }
}

function flattenData(data, list = []) {
  data.forEach((e) => {
    const children = e.Children || [];
    list.push(...children);

    if (children.length) {
      flattenData(children, list);
    }
  });

  return list.filter(
    (e) => Array.isArray(e.Actions) && e.Actions.some((f) => f.Value === 1)
  );
}

// 0 no permission 1 have 2 empty
function addDevPermission(data) {
  data.push(devPermission);
  return data;
}
