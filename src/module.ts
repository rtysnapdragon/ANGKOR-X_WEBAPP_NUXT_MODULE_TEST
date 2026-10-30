import {
  defineNuxtModule,
  installModule,
  addImportsDir,
  createResolver,
  addPlugin,
  addComponentsDir,
  addImports,
  addLayout,
  addRouteMiddleware,
  addServerHandler,
  addServerImportsDir,
} from "@nuxt/kit";

import { defu } from 'defu'
import fs from "fs";
import path from "path";
import pkg from "fs-extra";
const { copySync } = pkg;
// import copyJsonFile from "./runtime/app/utils/copyJsonFile.js";
import copyJsonFile from "./utils/copyJsonFile.js";
import getPages from "./utils/getPages.js";
import createTsConfigFile from "./utils/createTsConfigFile.js";
// import { runtimeDir } from "@nuxt/ui/unplugin";
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "webapp-nuxt-module",
    configKey: "webappModule",
  },

  defaults: {},
  // defaults: {
  //   anthropicApiKey: ''
  // },
  async setup(options: Record<any, any>, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const runtimeAppDir = resolve("./runtime/app"); // Client-side
    const runtimeServerDir = resolve("./runtime/server"); // Server-side
    const resolver = createResolver(import.meta.url)

    // Transpile
    nuxt.options.build.transpile.push(runtimeAppDir);
    nuxt.options.build.transpile.push(runtimeServerDir);

    // Auto-load global SCSS mixins
    // const mixinPath = resolver.resolve(
    //   './runtime/app/assets/styles/mixin.scss'
    // )


    // nuxt.options.vite.css.preprocessorOptions = {
    //   ...nuxt.options.vite.css.preprocessorOptions,
    //   scss: {
    //     ...nuxt.options.vite.css.preprocessorOptions?.scss,
    //     additionalData: `
    //       @use "${mixinPath}" as *;
    //     `,
    //   },
    // }

    const layers: string[] = options.layers || [];
    // Add the runtime directory to the transpile array
    // nuxt.options.build.transpile.push(runtimeAppDir);
    // // Add global.scss to the global CSS array
    nuxt.options.css = nuxt.options.css || [];
    nuxt.options.css.push(
      resolve(runtimeAppDir, "assets", "styles", "tailwind.css")
    );
    nuxt.options.css.push(
      resolve(runtimeAppDir, "assets", "styles", "global.scss")
    ); 

    nuxt.options.css.push(
      resolve(runtimeAppDir, "assets", "styles", "date.scss")
    ); 
    nuxt.options.serverHandlers.push({
      route: '/api/completion',
      handler: resolve(runtimeServerDir, 'api/completion.post.js')
    });

    nuxt.options.nitro.publicAssets ||= []
    nuxt.options.nitro.publicAssets.push({
      dir: resolve('./', 'public'),
      baseURL: '/',
    })

    nuxt.options.runtimeConfig.anthropicApiKey = options.anthropicApiKey
    //  nuxt.options.serverHandlers.push({
    //   route: "/api/completion",
    //   handler: resolver.resolve("./runtime/server/api/completion.post")
    // });

    // CSS (client only)
    // nuxt.options.css = nuxt.options.css || [];
    // nuxt.options.css.push(resolve(runtimeAppDir, "assets/styles/tailwind.css"));
    // nuxt.options.css.push(resolve(runtimeAppDir, "assets/styles/global.scss"));
    // nuxt.options.css.push(resolve(runtimeAppDir, "assets/styles/date.scss"));
// Only if the host already has @nuxtjs/i18n installed
    nuxt.options.i18n = defu(nuxt.options.i18n || {}, {
      langDir: '_locales',
      lazy: true,
      locales: [
        { code: 'en', file: 'en.json' },
        { code: 'km', file: 'km.json' },
        { code: 'zh', file: 'zh.json' }
      ],
      defaultLocale: 'en'
    })
    // Install external modules
    const modulesToInstall = [
      "@nuxt/ui",
      "@vueuse/nuxt",
      "nuxt-swiper",
      "@nuxt/content",
      "@pinia/nuxt",
      "@nuxtjs/i18n",
      // "nuxt-content-assets",
    ];
    for (const mod of modulesToInstall) {
      await installModule(mod);
    }
// ====================== SERVER API ======================

    // addServerImportsDir(runtimeServerDir);   // Only server directory

    addImports([
      { name: "ref", from: "vue" },
      { name: "reactive", from: "vue" },
      { name: "computed", from: "vue" },
      { name: "watch", from: "vue" },
      { name: "onMounted", from: "vue" },
      { name: "onUpdated", from: "vue" },
      { name: "onUnmounted", from: "vue" },
      { name: "toRefs", from: "vue" },
      { name: "useAttrs", from: "vue" },
      { name: "useSlots", from: "vue" },
      { name: "provide", from: "vue" },
      { name: "inject", from: "vue" },
      { name: "nextTick", from: "vue" },
      { name: "defineProps", from: "vue" },
      { name: "defineEmits", from: "vue" },
    ]);

    // add import utils, stores, composables
    const dirsToAdd = ["utils", "composables", "stores"];
    for (const dir of dirsToAdd) {
      addImportsDir(resolve(runtimeAppDir, dir));
    }

    // add middleware
    const middlewareDir = resolve(runtimeAppDir, "middlewares");
    if (fs.existsSync(middlewareDir)) {
      const middlewareFiles = fs
        .readdirSync(middlewareDir)
        .filter((file) => file.endsWith(".js"));
      middlewareFiles.forEach((file) => {
        const name = file.replace(/\.js$/, ""); // Remove .js extension
        const filePath = resolve(middlewareDir, file);
        addRouteMiddleware({ name: name, path: filePath, global: false });
      });
    }

    // Copy fonts from runtime to assets/fonts
    nuxt.hook("build:before", () => {
      const srcDir = resolve("./runtime/app/assets/fonts");
      const destDir = path.join(nuxt.options.rootDir, "assets/fonts");

      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }

      copySync(srcDir, destDir, { overwrite: true });
    });

    // add layouts
    const layoutsDir = resolve(runtimeAppDir, "layouts");
    if (fs.existsSync(layoutsDir)) {
      const layoutFiles = fs
        .readdirSync(layoutsDir)
        .filter((file) => file.endsWith(".vue"));
      layoutFiles.forEach((file) => {
        const name = file.replace(/\.vue$/, ""); // Remove .vue extension
        addLayout(resolve(layoutsDir, file), name);
      });
    }

    // Add components and recursively
    addComponentsDir({
      path: resolve(runtimeAppDir, "components"),
      prefix: options.prefix || "",
      pathPrefix: false,
    });
    const componentsDir = path.join(runtimeAppDir, "components");
    function addComponentsFromDir(
      directory: string,
      baseDir: string = componentsDir
    ) {
      const items = fs.readdirSync(directory, { withFileTypes: true });
      items.forEach((item) => {
        const itemPath = path.join(directory, item.name);
        if (item.isDirectory()) {
          addComponentsDir({
            path: resolve(
              runtimeAppDir,
              "components",
              path.relative(baseDir, itemPath).replace(/\\/g, "/")
            ),
            prefix: options.prefix || "",
            pathPrefix: false,
          });
          // // Recursively process subdirectories
          addComponentsFromDir(itemPath, baseDir);
        }
      });
    }
    addComponentsFromDir(componentsDir);
    // // Add plugin
    const pluginsDir = resolve(runtimeAppDir, "plugins")
    for (const file of fs.readdirSync(pluginsDir)) {
      if (/\.(js|ts|mjs)$/.test(file)) {
        addPlugin(resolve(pluginsDir, file))
      }
    }
    // addPlugin(resolve(runtimeAppDir, "plugins", "plugin"));
    addPlugin(resolve(runtimeAppDir, "plugins", "assets"));


    console.log("layers:", layers)
    console.log("layers.length:", layers.length)
    // Merge lang JSON files to app locales
    const lang = ["km", "en", "zh"];
    const rootDir = nuxt.options.rootDir

    for (const lan of lang) {
        // Main app language
        const mainLang = path.join(rootDir, "app", "assets", "lang", `${lan}.json`)
        const moduleLang = resolve("./runtime/app/assets/lang", `${lan}.json`)

      const assetLangs = layers?.map((l) => {
        const baseDir = path.dirname(
          path.posix.join(...process.cwd().split(/\\+/))
        );
        const p = path.join(process.cwd(), "app", "assets", "lang", `${lan}.json`)

        return `${baseDir}/${l}/app/assets/lang/${lan}.json`;
      });
      assetLangs.push(mainLang)

      console.log("assetLangs:", assetLangs)

      const output = path.join(rootDir, "_locales", `${lan}.json`)

      console.log("Output:", output)

      // Add current working directory's assets path at the beginning
      assetLangs.unshift(
        `${path.posix.join(
          ...process.cwd().split(/\\+/)
        )}/app/assets/lang/${lan}.json`
      );


      const inputPaths = [ //If you want to merge both the app and the module
        resolve("./runtime/app/assets/lang", `${lan}.json`),           // module
        path.join(rootDir, "assets", "lang", `${lan}.json`),           // app
        path.join(rootDir, "app", "assets", "lang", `${lan}.json`)     // app (Nuxt app dir, if used)
      ].filter(fs.existsSync)

      copyJsonFile({
        inputPaths,
        outputPath: path.join(rootDir, "_locales", `${lan}.json`),
        deep: false
      })

      // const moduleLang = resolve("./runtime/app/assets/lang", `${lan}.json`) //If your goal is to copy the module's language files into _locales WEBAPP_NUXT_MODULE/runtime/app/assets/lang --> CEREMONY_WEBAPP_NUXT/_locales

      // console.log(moduleLang)
      // console.log(fs.existsSync(moduleLang))

      // copyJsonFile({
      //   inputPaths: [moduleLang],
      //   outputPath: path.join(rootDir, "_locales", `${lan}.json`),
      //   deep: false
      // })

      // copyJsonFile({
      //   inputPaths: [moduleLang],
      //   outputPath: path.join(rootDir, "_locales", `${lan}.json`),
      //   deep: false
      // })
      // copyJsonFile({
      //   inputPaths: assetLangs.reverse(),
      //   outputPath: `${path.posix.join(
      //     ...process.cwd().split(/\\+/)
      //   )}/_locales/${lan}.json`,
      //   deep: false,
      // });
    }

    // Create tsconfig.json file
    createTsConfigFile(layers);

    // Create km routes when generate
    nuxt.hook("nitro:config", async (nitroConfig) => {
      if (nitroConfig.prerender?.routes) {
        const pages = [...["pages"], ...layers.map((l) => `../${l}/pages`)];
        const routes = [
          "/km",
          ...getPages(pages).map((r: string) => `/km/${r}`),
        ];

        nitroConfig.prerender.routes.push(...routes);
      }
    });
  },
});


// import { defineNuxtModule, addPlugin, createResolver, addComponentsDir } from '@nuxt/kit'

// // Module options TypeScript interface definition
// export interface ModuleOptions {}

// export default defineNuxtModule<ModuleOptions>({
//   meta: {
//     name: 'my-module',
//     configKey: 'myModule',
//   },
//   // Default configuration options of the Nuxt module
//   defaults: {},
//   setup(_options, _nuxt) {
//     const resolver = createResolver(import.meta.url)

//     addComponentsDir({
//       path: resolver.resolve("./runtime/app/components"),
//       pathPrefix: false,
//       extensions: ["vue"],
//       prefix: "",
//     });

//     addComponentsDir({
//       path: resolver.resolve("./runtime/app/utils"),
//       pathPrefix: false,
//       extensions: ["js"],
//       prefix: "",
//     });

//     addComponentsDir({
//       path: resolver.resolve("./runtime/app/composables"),
//       pathPrefix: false,
//       extensions: ["js"],
//       prefix: "",
//     });
    
//     // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
//     addPlugin(resolver.resolve('./runtime/plugin'))
//   },
// })
