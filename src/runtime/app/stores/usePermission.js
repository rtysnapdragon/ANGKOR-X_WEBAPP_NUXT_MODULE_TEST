import { defineStore, acceptHMRUpdate } from 'pinia'
// import { defineStore, acceptHMRUpdate, useToast } from "#imports";
import devPermission from "../assets/json/dev_permission.json";
import techPermission from "../assets/json/tech_permission.json";
const { config,api , str } = helper();

/**
 * `useToast()` needs a live Nuxt instance, so it cannot run at module scope.
 * This store is first evaluated when the global permission middleware is
 * imported - outside a plugin, hook, middleware or setup() - which throws
 * NUXT_E1001. Resolve it lazily and stay silent when Nuxt is not ready.
 */
function addToast(payload) {
  try {
    useToast().add(payload);
  } catch {
    // Nuxt instance unavailable - dropping the toast is fine.
  }
}

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
        const { error, data } = await useRHttp(api.permissions, {
          method: "post",
        });

        if (error.value) {
          throw {
            Message: error.value.message || "Failed to fetch permissions.",
          };
        }

        if (data.value) {
          this.currentDbCode = dbCode;
          // The backend returns `{ ..., Items: <tree> }`; older builds returned
          // the tree array directly.
          this.data = Array.isArray(data.value)
            ? data.value
            : data.value?.Items ?? [];
        }
      } catch (e) {
        addToast({
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
    // `ISTESTING` is an optional build-time global; it is simply absent here,
    // so test-only permissions stay off unless a build defines it.
    return globalThis.ISTESTING !== undefined && Boolean(globalThis.ISTESTING);
  } catch {
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
