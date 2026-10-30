import { defineNuxtPlugin } from "#app";
import { ref } from "vue";
import isEmpty from "../utils/isEmpty.js";
import isNotEmpty from "../utils/isNotEmpty.js";
import rdate from "../utils/rdate.js";
import tBy from "../utils/tBy.js";
import getDeviceId from "../utils/getDeviceId.js";
import queryParams from "../utils/queryParams.js";
import copyWith from "../utils/copyWith.js";

export default defineNuxtPlugin((nuxtApp) => {
  const screen = useScreenStore();

  const updateSize = () => {
    if (typeof window === "undefined") return;
    screen.setSize(window.innerWidth, window.innerHeight);
  };

  updateSize(); // Initial size
  window.addEventListener("resize", updateSize);

  // Cleanup in dev HMR
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.removeEventListener("resize", updateSize);
    });
  }


  const online = ref(true);

  online.value = navigator.onLine;

  window.addEventListener("online", () => {
    online.value = true;
  });

  window.addEventListener("offline", () => {
    online.value = false;
  });

  nuxtApp.provide("isOnline", () => online.value);
  // nuxtApp.provide("isEmpty", isEmpty);
  // nuxtApp.provide("isNotEmpty", isNotEmpty);
  // nuxtApp.provide("getDeviceId", getDeviceId);
  // nuxtApp.provide("ocdate", rdate);
  // nuxtApp.provide("tBy", tBy);
  // nuxtApp.provide("queryParams", queryParams);
  // nuxtApp.provide("copyWith", copyWith);
});
