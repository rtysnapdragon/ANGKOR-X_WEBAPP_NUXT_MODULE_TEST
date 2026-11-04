<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: My Module
- Package name: my-module
- Description: My new Nuxt module
-->

# My Module
- Use node verions : 24
- NUXT version 4.8.0
- NUXTUI version 4.8.2

--- This generates the correct module structure automatically.
npx nuxi module init

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

My new Nuxt module for doing amazing things.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/my-module?file=playground%2Fapp.vue) -->
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->

- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxt module add my-module
```

That's it! You can now use My Module in your Nuxt app ✨

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```




Because you use pnpm 10.29.3, avoid using npx nuxi module add for this installation. It attempted to run: npm install -D nuxt-echarts@1.1.0
# Package in this project

npm install vue-grid-layout-v3 --save
npx nuxi module add echarts ( include vue-echarts,nuxt-echarts,echarts)
npm install -D nuxt-echarts@1.1.0
npm install nuxt-echarts echarts


npm install wavesurfer.js // audio library

npm install @nuxt/kit
npm install fs-extra
npm i nuxt-swiper swiper
npm install @nuxt/content
npm install query-string

npm install better-sqlite3
npm install @nuxt/module-builder @nuxt/kit typescript -D

npm install -D sass-embedded
npm install -D sass
npm install axios
npm install zod
npm install v-calendar@3
npm install @headlessui/vue
npm install defu //If defu is only used during development and is not needed by consumers, you can instead configure your build to externalize it. But since your module imports it at runtime, declaring it as a dependency is generally the safer choice.


npm install v-calendar
npm install vue-screen-utils
npm install @easylogic/colorpicker
npm install @popperjs/core
npx nuxt upgrade

</details>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/my-module/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/my-module
[npm-downloads-src]: https://img.shields.io/npm/dm/my-module.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/my-module
[license-src]: https://img.shields.io/npm/l/my-module.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/my-module
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com



## REditor
- Need to install manual packages more
```bash
//For REEditor
npm install @tiptap/extension-image
npm install @tiptap/extension-text-align
npm install @tiptap/extension-emoji


//For RAi
npm install ai @ai-sdk/gateway @ai-sdk/vue

npm install ai @ai-sdk/anthropic  // AI SDK is using Anthropic API free

npm install ai @ai-sdk/google


The AI SDK makes it easy to support Anthropic, OpenAI, Gemini, etc., by creating a provider registry. That lets you switch models without rewriting your application.
```
npm install --legacy-peer-deps

Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
npm install







## Release to CDN
git status
git add .
git commit -m "Prepare CDN release"
git push origin main

git tag v1.0.0
git push origin v1.0.0



## Build CDN with host
npm run prepack
npm pack
will create new file webapp-nuxt-module-1.0.0.tgz
and need to config in package.json

Step 1: Automate or Generate the Tarball Locally
Make sure your module is correctly configured to include the dist/ directory in package.json (as shown previously):
{
  "files": [
    "dist"
  ],
  "scripts": {
    "prepack": "nuxt-module-build build"
  }
}

Run the pack command in your module repository:
```bash
npm run prepack
npm pack
```

Step 2: Create a GitHub Release and Upload the Tarball
1. Push your code changes and tag your commit in git:

```bash 
git tag v1.0.0
git push origin v1.0.0
```

Step 3: Get the Direct Download URL
Once the release is published, right-click the uploaded .tgz file in the release assets and select Copy Link Address."# ANGKOR-X_WEBAPP_NUXT_MODULE" 
