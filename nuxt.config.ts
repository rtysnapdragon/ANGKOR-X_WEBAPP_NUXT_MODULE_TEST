// https://nuxt.com/docs/api/configuration/nuxt-config

import path from "path";
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxtjs/i18n",
    "@nuxtjs/prismic",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  
  // ── NuxtUI v4 ──
  ui: {
    colorMode: true,
    // prefix: 'Nuxt',
    // content: true,
    // // global: true,  
    // theme: {
    //   colors: ['primary', 'error'],
    //   unstyled: true,
    //   // prefix: 'tw'
    // },
    // // global: false,
    // experimental: {
    //   componentDetection: true,
    //   // componentDetection: ['Modal', 'Dropdown', 'Popover']

    // }
  },
  // ai: {
  //   gateway: true
  // },
 app: {
    rootAttrs: {
      'data-vaul-drawer-wrapper': '',
      'class': 'bg-default'
    },
    head:{
      // script:[{ src:"https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",defer: true}]
    }
  },
  // ── Global SCSS ──
  css: ['./runtime/app/assets/styles/global.scss','./runtime/app/assets/styles/tailwind.css'],

  vite: {
    server: {
      fs: {
        allow: [
          '.',
          '../NUXT_MODULES/WEBAPP_NUXT_MODULE'
        ]
      }
    },
    // server: {
    //   fs: {
    //     allow: [
    //       process.cwd(),
    //       path.resolve("../NUXT_MODULES/WEBAPP_NUXT_MODULE")
    //     ]
    //   }
    // },
    optimizeDeps: {
      include: [
        // Core ProseMirror / Tiptap (critical for REditor + Completion)
        'prosemirror-state',
        'prosemirror-transform',
        'prosemirror-model',
        'prosemirror-view',
        'prosemirror-gapcursor',
        'prosemirror-keymap',

        '@tiptap/core',
        '@tiptap/pm/state',
        '@tiptap/pm/transform',
        '@tiptap/pm/model',
        '@tiptap/pm/view',
        '@tiptap/pm/gapcursor',
        '@tiptap/pm/keymap',

        // Nuxt UI editor dependencies
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        '@nuxt/ui > prosemirror-keymap',

        // AI / Completion
        '@ai-sdk/gateway',
        '@ai-sdk/vue',
        '@ai-sdk/provider-utils',
      ],
      // force: true   // ← add this
    },
    
    // plugins: [
    //   require('@tailwindcss/vite')()
    // ],
    // css: {
    //   preprocessorOptions: {
    //     scss: {
    //       // Make mixins available in every component <style lang="scss">
    //       // additionalData: `@use './src/runtime/app/assets/styles/mixin' as *;`,
    //     },
    //   },
    // },
  },
  // // / ── Auto-import composables ──
  // imports: {
  //   dirs: ['composables/**', 'stores/**','utils/**'],
  // },
})

function defineNuxtConfig(arg0: {
  modules: string[];
  // ── NuxtUI v4 ──
  ui: { colorMode: boolean; }; app: { rootAttrs: { 'data-vaul-drawer-wrapper': string; class: string; }; head: {}; };
  // ── Global SCSS ──
  css: string[]; vite: {
    // server: {
    //   fs: {
    //     allow: [
    //       '.',
    //       '../NUXT_MODULES/WEBAPP_NUXT_MODULE'
    //     ]
    //   }
    // },
    server: { fs: { allow: string[]; }; }; optimizeDeps: { include: string[]; };
    // plugins: [
    //   require('@tailwindcss/vite')()
    // ],
    css: {
      preprocessorOptions: {
        scss: {
          // Make mixins available in every component <style lang="scss">
          additionalData: string;
        };
      };
    };
  };
}) {
  throw new Error("Function not implemented.");
}
