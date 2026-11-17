import { cpSync, existsSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import {
  addComponentsDir,
  addImportsDir,
  addLayout,
  addPlugin,
  addRouteMiddleware,
  addServerHandler,
  addServerImportsDir,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import copyJsonFile from './utils/copyJsonFile.js'
import createTsConfigFile from './utils/createTsConfigFile.js'
import getPages from './utils/getPages.js'

export interface ModuleOptions {
  /** Sibling Nuxt layers (folder names next to the host project) whose pages/lang files are merged. */
  layers?: string[]
  /** Key for /api/completion. Prefer the NUXT_ANTHROPIC_API_KEY environment variable. */
  anthropicApiKey?: string
}

const LANGS = ['km', 'en', 'zh'] as const

/** Real runtime scripts only: skips the .d.ts / .d.mts files emitted by `nuxt-module-build`. */
const isRuntimeScript = (file: string) =>
  /\.[cm]?[jt]s$/.test(file) && !/\.d\.[cm]?ts$/.test(file)

/** Node-only build helpers that must never be offered as client auto-imports. */
const NODE_ONLY_UTILS =
  /\/utils\/(?:copyJsonFile|createTsConfigFile|getComponentPaths|getPages)\.[cm]?[jt]s$/

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'webapp-nuxt-module',
    configKey: 'webappModule',
    compatibility: { nuxt: '>=4.0.0' },
  },

  defaults: {
    layers: [],
    anthropicApiKey: '',
  },

  // Nuxt installs these automatically (and before this module's setup runs),
  // so the host app does not need to list them in its own `modules`.
  moduleDependencies: {
    '@nuxt/ui': { version: '^4.8.2' },
    '@nuxt/icon': {},
    '@nuxt/content': {},
    // @nuxtjs/i18n v10 reads `locales` / `langDir` from the HOST's nuxt.config
    // (per layer), so options injected from a module are ignored. Define them there.
    '@nuxtjs/i18n': {},
    '@pinia/nuxt': {},
    '@vueuse/nuxt': { version: '>=14.0.0' },
    'nuxt-swiper': {},
  },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = resolve('./runtime')
    const appDir = resolve('./runtime/app')
    const serverDir = resolve('./runtime/server')
    const layers = options.layers ?? []

    // The runtime ships as source (.vue/.ts), so Vite/Nitro must transpile it.
    nuxt.options.build.transpile.push(runtimeDir)

    // ── Styles (Tailwind v4 + Nuxt UI entry first, then Sass) ─────────────────
    for (const file of ['tailwind.css', 'global.scss', 'date.scss']) {
      nuxt.options.css.push(join(appDir, 'assets', 'styles', file))
    }

    // ── Components: ONE registration, scanned recursively ────────────────────
    // Every runtime/app/components/**/*.vue becomes globally resolvable by its
    // file name (RBtn.vue -> <RBtn />), so module components can use each other
    // with no `import`. Do NOT set `prefix`: it would rename BtnBack.vue to
    // RBtnBack and break every unprefixed tag used inside the module.
    addComponentsDir({
      path: join(appDir, 'components'),
      pathPrefix: false,
      extensions: ['vue'],
    })

    // ── Functions: utils, composables, stores (named + default exports) ──────
    // Top-level files only (Nuxt convention). Sub-folders such as utils/chart/**
    // stay internal and are imported explicitly by the files that need them.
    addImportsDir([
      join(appDir, 'utils'),
      join(appDir, 'composables'),
      join(appDir, 'stores'),
    ])
    addServerImportsDir(join(serverDir, 'utils'))

    nuxt.hook('imports:extend', (imports) => {
      for (let i = imports.length - 1; i >= 0; i--) {
        if (NODE_ONLY_UTILS.test(imports[i]!.from.replace(/\\/g, '/'))) imports.splice(i, 1)
      }
    })
    // Vue APIs (ref, computed, watch, onMounted, ...) are already auto-imported by
    // Nuxt itself. defineProps/defineEmits are compiler macros: never import them.

    // ── Server ───────────────────────────────────────────────────────────────
    addServerHandler({
      route: '/api/completion',
      method: 'post',
      handler: join(serverDir, 'api', 'completion.post'),
    })
    nuxt.options.runtimeConfig.anthropicApiKey ||= options.anthropicApiKey || ''

    // ── Public assets (must live inside runtime/ to be published) ────────────
    const publicDir = join(runtimeDir, 'public')
    if (existsSync(publicDir)) {
      nuxt.hook('nitro:config', (nitroConfig) => {
        const nitro = nitroConfig as { publicAssets?: { dir: string, baseURL?: string }[] }
        nitro.publicAssets ||= []
        nitro.publicAssets.push({ dir: publicDir, baseURL: '/' })
      })
    }

    // ── Plugins / middleware / layouts (auto-registered from runtime/app) ────
    const listFiles = (dir: string, test: (f: string) => boolean) =>
      existsSync(dir) ? readdirSync(dir).filter(test) : []

    for (const file of listFiles(join(appDir, 'plugins'), isRuntimeScript)) {
      addPlugin(join(appDir, 'plugins', file))
    }
    for (const file of listFiles(join(appDir, 'middlewares'), isRuntimeScript)) {
      addRouteMiddleware({
        name: basename(file).replace(/\.[cm]?[jt]s$/, ''),
        path: join(appDir, 'middlewares', file),
        global: false,
      })
    }
    for (const file of listFiles(join(appDir, 'layouts'), f => f.endsWith('.vue'))) {
      addLayout(join(appDir, 'layouts', file), file.replace(/\.vue$/, ''))
    }

    // ── Fonts: copy into the host app, never delete anything there ───────────
    nuxt.hook('build:before', () => {
      const from = join(appDir, 'assets', 'fonts')
      if (existsSync(from)) {
        cpSync(from, join(nuxt.options.rootDir, 'assets', 'fonts'), { recursive: true, force: true })
      }
    })

    // ── i18n: merge module + host language files where @nuxtjs/i18n will read them ──
    // i18n v10 resolves <root>/<restructureDir>/<langDir> from the host's config,
    // so derive the target from it instead of hard-coding <root>/_locales.
    const rootDir = nuxt.options.rootDir
    const i18nConfig = (nuxt.options as { i18n?: { restructureDir?: string, langDir?: string } }).i18n
    const localesDir = join(rootDir, i18nConfig?.restructureDir ?? 'i18n', i18nConfig?.langDir ?? 'locales')
    for (const lang of LANGS) {
      const inputPaths = [
        join(appDir, 'assets', 'lang', `${lang}.json`), // module
        join(rootDir, 'assets', 'lang', `${lang}.json`), // host
        join(rootDir, 'app', 'assets', 'lang', `${lang}.json`), // host (Nuxt 4 app dir)
      ].filter(existsSync)

      copyJsonFile({
        inputPaths,
        outputPath: join(localesDir, `${lang}.json`),
        deep: false,
      })
    }

    createTsConfigFile(layers)

    // ── Prerender the /km routes when generating ─────────────────────────────
    nuxt.hook('nitro:config', (nitroConfig) => {
      if (nitroConfig.prerender?.routes) {
        const pages = ['pages', ...layers.map(l => `../${l}/pages`)]
        nitroConfig.prerender.routes.push('/km', ...getPages(pages).map((r: string) => `/km/${r}`))
      }
    })
  },
})