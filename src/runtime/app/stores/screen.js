import { defineStore, ref, computed } from "#imports";

export const useScreenStore = defineStore("ScreenStore", () => {
  const width = ref(0);
  const height = ref(0);

  const isMobile = computed(() => width.value < 768);
  const isTablet = computed(() => width.value >= 768 && width.value < 1024);
  const isDesktop = computed(() => width.value >= 1024);

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
    isDesktop,
    breakpoint,
    setSize,
  };
});
