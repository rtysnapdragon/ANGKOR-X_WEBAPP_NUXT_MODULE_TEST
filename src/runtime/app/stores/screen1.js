import { defineStore, acceptHMRUpdate } from '#imports'

export const useScreenStore = defineStore('ScreenStore', {
  state: () => ({
    width: 0,
    height: 0,
  }),

  getters: {
    isMobile: (state) => state.width < 768,
    isTablet: (state) => state.width >= 768 && state.width < 1024,
    isDesktop: (state) => state.width >= 1024,
    breakpoint: (state) => {
      if (state.width < 768) return 'mobile'
      if (state.width < 1024) return 'tablet'
      return 'desktop'
    },
  },

  actions: {
    setSize(w, h) {
      this.width = w
      this.height = h
    },
  },
})


// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScreenStore, import.meta.hot))
}


// import { defineStore, ref, computed } from "#imports";

// export const useScreenStore = defineStore("ScreenStore", () => {
//   const width = ref(0);
//   const height = ref(0);

//   const isMobile = computed(() => width.value < 768);
//   const isTablet = computed(() => width.value >= 768 && width.value < 1024);
//   const isDesktop = computed(() => width.value >= 1024);

//   const breakpoint = computed(() => {
//     if (isMobile.value) return "mobile";
//     if (isTablet.value) return "tablet";
//     return "desktop";
//   });

//   function setSize(w, h) {
//     width.value = w;
//     height.value = h;
//   }

//   return {
//     width,
//     height,
//     isMobile,
//     isTablet,
//     isDesktop,
//     breakpoint,
//     setSize,
//   };
// });
