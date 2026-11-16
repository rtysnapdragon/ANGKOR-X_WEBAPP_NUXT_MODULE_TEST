import { defineStore, ref, computed } from "#imports";
import { useWindowSize } from "@vueuse/core"

export const RV_BREAKPOINTS = Object.freeze({ tablet: 768, desktop: 1100 })

export const useScreenStore = defineStore("ScreenStore", () => {
  const width = ref(0);
  const height = ref(0);

  const isMobile = computed(() => width.value < 768);
  const isTablet = computed(() => width.value >= 768 && width.value < 1024);
  const isDesktop = computed(() => width.value >= 1024);

  const mode = computed(() => {
    if (width.value < RV_BREAKPOINTS.tablet) return "mobile"
    if (width.value < RV_BREAKPOINTS.desktop) return "tablet"
    return "desktop"
  })

  const breakpoint = computed(() => {
    if (isMobile.value) return "mobile";
    if (isTablet.value) return "tablet";
    return "desktop";
  });

  function setSize(w, h) {
    width.value = w;
    height.value = h;
  }

  return {
    width,
    height,
    isMobile,
    isTablet,
    mode,
    isDesktop,
    breakpoint,
    setSize,
  };
});




// /**
//  * Viewport layout mode used by RVisualEditor (page padding, density defaults).
//  * Per-instance toolbar density additionally uses the editor container width.
//  * SSR-safe: useWindowSize reports Infinity on the server, i.e. "desktop".
//  */
// export const useScreenStore = defineStore("screen", () => {
//   const { width, height } = useWindowSize()

//   const mode = computed(() => {
//     if (width.value < RV_BREAKPOINTS.tablet) return "mobile"
//     if (width.value < RV_BREAKPOINTS.desktop) return "tablet"
//     return "desktop"
//   })
//   const isMobile = computed(() => mode.value === "mobile")
//   const isTablet = computed(() => mode.value === "tablet")
//   const isDesktop = computed(() => mode.value === "desktop")

//   return { width, height, mode, isMobile, isTablet, isDesktop }
// })