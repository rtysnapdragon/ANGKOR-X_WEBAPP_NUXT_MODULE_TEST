# Resolve ProseMirror Keyed Plugin Conflict in UEditor/REditor

Add Vite dependency optimization settings to ensure ProseMirror and TipTap packages are pre-bundled as a single instance. This resolves the `Adding different instances of a keyed plugin (plugin$)` error in Nuxt UI v4 / Tiptap.

## User Review Required

> [!IMPORTANT]
> The error occurs because Vite compiles separate instances of `prosemirror-state` and other ProseMirror libraries from different dependency paths (such as `@nuxt/ui` and `webapp-nuxt-module`). Adding these dependencies to Vite's `optimizeDeps.include` forces Vite to bundle them into a single instance.
>
> After applying these changes, you will need to restart your development server. It is also recommended to clear the Vite cache by deleting the `.nuxt` and `node_modules/.vite` folders if the issue persists after restart.

## Proposed Changes

---

### main-app

#### [MODIFY] [nuxt.config.ts](file:///d:/1_RITHY/1_PROJECT%20PROGRAMMING/PROJECTS/BZIN%20PROJECT/CEREMONY_WEBAPP_NUXT/nuxt.config.ts)

Uncomment and configure `vite.optimizeDeps` in `nuxt.config.ts` to include ProseMirror and TipTap PM packages.

```typescript
  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        '@nuxt/ui > prosemirror-keymap',
        'prosemirror-state',
        'prosemirror-transform',
        'prosemirror-model',
        'prosemirror-view',
        'prosemirror-gapcursor',
        'prosemirror-keymap',
        '@tiptap/pm',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'vue',
        'pinia',
        '@pinia/nuxt'
      ]
    },
    build: {
      target: 'esnext'
    },
    ...
```

---

### webapp-nuxt-module

#### [MODIFY] [nuxt.config.ts](file:///d:/1_RITHY/1_PROJECT%20PROGRAMMING/PROJECTS/BZIN%20PROJECT/NUXT_MODULES/WEBAPP_NUXT_MODULE/nuxt.config.ts)

Update the Vite configuration inside `webapp-nuxt-module/nuxt.config.ts` to also pre-bundle the ProseMirror packages so that the module playground does not run into the same issue.

```typescript
  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        '@nuxt/ui > prosemirror-keymap',
        'prosemirror-state',
        'prosemirror-transform',
        'prosemirror-model',
        'prosemirror-view',
        'prosemirror-gapcursor',
        'prosemirror-keymap',
        '@tiptap/pm'
      ]
    },
    plugins: [
      require('@tailwindcss/vite')()
    ],
    ...
```

## Verification Plan

### Manual Verification
1. Restart the Nuxt dev server in `CEREMONY_WEBAPP_NUXT` by running `npm run dev`.
2. Visit `/demo/r-editor` and `/demo/r-editor-dev` in the browser.
3. Verify that the pages load successfully without throwing a `500 Internal Server Error` or browser console errors about `Adding different instances of a keyed plugin`.
