import { ref, nextTick } from "vue";
import { defineStore, acceptHMRUpdate } from "#imports";

export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [],
    maxToasts: 20,
    running: false,
    queue: [],
  }),

  actions: {
    generateId() {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    },

    async processQueue() {
      if (this.running || this.queue.length === 0) return;
      this.running = true;

      while (this.queue.length > 0) {
        const toast = this.queue.shift();
        await nextTick();
        this.toasts = [...this.toasts, toast].slice(-this.maxToasts);

        // Note: We're not setting timeouts here anymore
        // as they are managed in the component
      }

      this.running = false;
    },

    add({ title, description, type = "error", duration = 3000, action }) {
      const body = {
        id: this.generateId(),
        title,
        description,
        duration,
        action,
        open: true,
        type,
      };
      this.queue.push(body);
      this.processQueue();
      return body;
    },

    update(id, toast) {
      const index = this.toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.toasts[index] = { ...this.toasts[index], ...toast };
      }
    },

    remove(id) {
      const index = this.toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.toasts[index] = { ...this.toasts[index], open: false };
      }
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
      }, 200);
    },

    clear() {
      this.toasts = [];
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useToastStore, import.meta.hot));
}
