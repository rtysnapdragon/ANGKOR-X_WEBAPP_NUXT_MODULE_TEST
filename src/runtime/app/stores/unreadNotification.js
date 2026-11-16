import { defineStore, acceptHMRUpdate } from "#imports";
import api from "~/helpers/apis";

export const useUnreadNotification = defineStore("UnreadNotificationStore", {
  state: () => ({
    total: 0,
    count: 0,
    byMode: { WebApp: 0, Web: 0, Push: 0, Total: 0 },
    error: null,
  }),
  getters: {
    data: (state) => state.total,
  },
  actions: {
    async getData() {
      const toast = useToast();
      try {
        const { data, error } = await useHttp(api.notification.countUnread, {
          method: "POST",
        });
        if (error.value) throw error.value;
        this.total = data.value?.Count ?? data.value?.count ?? data.value ?? 0;
      } catch (e) {
        this.error = e;
        if (isNotEmpty(e.Message)) {
          toast.add({ color: "red", title: `${e.Message}` });
        }
      }
    },
    async getByAppModes() {
      try {
        const { data, error } = await useHttp(api.notification.countUnreadByAppModes, {
          method: "POST",
        });
        if (error.value) throw error.value;
        this.byMode = data.value ?? { WebApp: 0, Web: 0, Push: 0, Total: 0 };
        this.total = this.byMode.Total ?? 0;
      } catch (e) {
        this.error = e;
      }
    },
    addTotal() {
      this.total++;
    },
    updateTotal(value) {
      this.total = value;
    },
    getNewMessage() {
      this.count++;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useUnreadNotification, import.meta.hot)
  );
}