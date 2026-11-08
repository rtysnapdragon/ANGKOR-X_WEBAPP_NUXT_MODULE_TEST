import { defineNuxtPlugin } from "#app";
import { ref } from "vue";

import isEmpty from "../utils/isEmpty.js";
import isNotEmpty from "../utils/isNotEmpty.js";
import rdate from "../utils/rdate.js";
import tBy from "../utils/tBy.js";
import getDeviceId from "../utils/getDeviceId.js";
import queryParams from "../utils/queryParams.js";
import copyWith from "../utils/copyWith.js";

import { useScreenStore } from "../stores/screen.js";

export default defineNuxtPlugin((nuxtApp) => {
  const screen = useScreenStore();

  // SSR-safe default: assume online until the client reports its state.
  const online = ref(true);

  if (import.meta.client) {
    const updateSize = () => {
      screen.setSize(window.innerWidth, window.innerHeight);
    };

    const updateOnline = () => {
      online.value = navigator.onLine;
    };

    // Initial browser state
    updateSize();
    updateOnline();

    // Register listeners
    window.addEventListener("resize", updateSize);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    // Cleanup
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        window.removeEventListener("resize", updateSize);
        window.removeEventListener("online", updateOnline);
        window.removeEventListener("offline", updateOnline);
      });
    }
  }

  nuxtApp.provide("isOnline", () => online.value);

  // Other utilities can be provided here when needed.
});