# REditor — refactor notes & API

## File layout

```
components/REditor/REditor.vue              ← replaces REditorDev.vue
components/REditor/REditorLinkPopover.vue   ← was an inline defineComponent
components/REditor/REditorMedia.js          ← image/video/file nodes, drop/paste plugin, helpers
components/REditor/REditorFiles.js          ← file lifecycle (insert/replace/delete/track/upload)
composables/EditorCompletionExtension.js    ← ghost-text extension (unique plugin key per editor)
composables/EditorUseCompletion.js          ← fetch-based composable (no @ai-sdk/vue)
server/api/completion.post.ts               ← free open-source AI route (Ollama / any OpenAI-compatible)
```

Delete: `server/api/ai.post.ts`, `server/api/completion.post.js`, `server/api/completion.ts`
(four files mapped to one route, and two logged the whole `runtimeConfig`).
`@ai-sdk/vue`, `ai`, `@ai-sdk/gateway`, `@ai-sdk/google`, `@ai-sdk/anthropic` are no longer needed by the editor.

## Upload model

```
pick / drop / paste ──► instant blob: preview in the doc, record.status = 'pending'
                              │
        ┌─────────────────────┼──────────────────────────────┐
  'immediate' strategy   parent calls uploadPending()     parent uploads itself
  (default when api.url) (uses uploadHandler / api)       and calls resolveFile(id, {url})
        └─────────────────────┴──────────────────────────────┘
                              ▼
        blob: src swapped for the final URL (history-neutral), status = 'uploaded'
```

Strategy: `uploadStrategy="deferred"` (default without `api`) or `"immediate"` (default with `api.url`).

### Publish-button flow (parent-controlled, no `api` prop)

```vue
<REditor
  ref="editor"
  v-model="body"
  :upload-handler="uploadToMyBackend"
  @file-uploaded="r => console.log('now at', r.url)"
  @upload-error="e => toast.error(e.message)"
/>
```
```js
// (file, onProgress, record) => Promise<{ url, id? }>
async function uploadToMyBackend(file, onProgress) {
  const form = new FormData(); form.append('file', file)
  const res = await $fetch('/api/uploads', { method: 'POST', body: form })
  return { url: res.url, id: res.id }
}

async function publish() {
  const { ok, failed } = await editor.value.uploadPending()   // uploads every pending file still in the doc
  if (!ok) return toast.error(`${failed.length} upload(s) failed`)
  await $fetch('/api/posts', { method: 'POST', body: { body: body.value } })  // v-model now has final URLs
}
```

Fully manual (you own the transport):
```js
for (const rec of editor.value.getPendingFiles()) {       // rec.file is the File
  const { url, id } = await myUpload(rec.file)
  editor.value.resolveFile(rec.id, { url, id })
}
```

Insert existing HTTPS files — no upload, no re-upload:
```js
editor.value.insertFileUrl('https://cdn.example.com/a.pdf', { name: 'Brochure', size: 120000 })
editor.value.insertFileUrls([{ url: 'https://cdn.example.com/p.jpg', kind: 'image' }, 'https://cdn.example.com/v.mp4'])
```
`kind` is guessed from the extension (`image`/`video`, else `file`); pass `kind` for extension-less CDN URLs.
Only `https:` is accepted. Also available in the picker modal ("Insert URL").

## Props

Unchanged: `contentType`, `placeholder`, `disabled`, `mentionItems`, `extraExtensions`, `extraHandlers`, `options`, `ui`, `api`, all `upload*` crop/compress/limit props, `aiApi`, `aiLanguages`, `v-model`.

| New prop | Type | Default | Purpose |
|---|---|---|---|
| `uploadHandler` | `(file, onProgress, record) => Promise<{url, id?}>` | – | Parent-controlled upload. Beats `api`. |
| `uploadStrategy` | `'deferred' \| 'immediate'` | auto | Upload at insert time or wait for `uploadPending()`. |
| `initialFiles` | `Array<string \| {url, name?, size?, kind?, id?}>` | `[]` | Pre-register existing remote files in the media library (nothing inserted). |

`api` is now optional: `{ url, method, fieldName, headers, extraFields, responseUrlKey, responseIdKey, deleteUrl, deleteMethod, withCredentials }` (`withCredentials` is new).

### `options` (merged over defaults)

Existing: `toolbar, bubbleToolbar, dragHandle, suggestionMenu, mentionMenu, emojiMenu, textAlign, link, imageUpload, videoUpload, fileUpload, mediaLibrary, ai`.
New:

| Key | Default | Meaning |
|---|---|---|
| `fileDrop` | `true` | Accept files dropped / pasted straight into the editor. |
| `urlInsert` | `true` | "Insert URL" field in the picker. |
| `accept` | `{image:'image/*', video:'video/*', file:'.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'}` | Per-kind `accept` string (also enforced on drop/paste). |
| `maxSize` | image 8 MB, video 100 MB, file 20 MB | Per-kind byte limits (override the `uploadMax*Size` props). |

`imageUpload / videoUpload / fileUpload: false` hide that kind's UI and reject it on drop. Toggles are read once at setup (the extension list must stay stable).

## Events

Existing events keep their names. **One semantic change:** `record.id` is now a stable *client* id; the server id is `record.remoteId`.

| Event | Payload | When |
|---|---|---|
| `change` | value | content changed |
| `focus` / `blur` | event | |
| `update:files` | `record[]` | tracked list changed |
| `file-pending` | record | local file inserted, awaiting upload |
| `file-uploaded` | record | file has its final URL (upload, `resolveFile`, or URL insert) |
| `file-upload-progress` | `{ record, percent }` | |
| `file-changed` | `{ old, next }` | media replaced |
| `file-deleted` | record | media removed + tracking dropped (call your own delete here if you don't use `api.deleteUrl`) |
| `file-delete-error` | `{ record, error }` | `api.deleteUrl` call failed |
| `upload-error` | `{ file?, url?, record?, message, type: 'size'\|'type'\|'url'\|'upload'\|…, error? }` | previously fired twice per error |
| `upload-complete` | `{ uploaded, failed, ok }` | after `uploadPending()` |
| `ai-error` | Error | completion endpoint failed |

## Exposed methods

Unchanged: `getEditor, focus, clear, clearContent, getHTML, getJSON, getText, getMarkdown, setContent(v, emitUpdate), insertContent, getUploadedFiles, openFilePicker, openLibrary, insertLibraryFile, deleteUploadedFile`.

New:

| Method | Returns |
|---|---|
| `getFiles()` | all tracked records (alias of `getUploadedFiles`) |
| `getPendingFiles({includeErrors=true, onlyInDocument=true})` | records with `file` still to upload |
| `getUnusedFiles()` | tracked records no longer in the document (e.g. removed with Backspace) → clean up server-side |
| `getDocumentMedia()` | `[{pos, kind, src, name, fileId, record}]` for every media node in the doc |
| `hasPendingFiles()` / `isUploading` | boolean |
| `insertFiles(File[], {pos})` | inserts + tracks (compresses images if `uploadCompress`) |
| `insertFileUrl(url, opts)` / `insertFileUrls(list)` | remote record(s), no upload |
| `uploadPending({concurrency=3, onlyInDocument=true})` | `{uploaded, failed, ok}` |
| `uploadFile(id)` | uploads one record |
| `resolveFile(id, {url, id?, name?, size?})` | swaps blob URL → final URL |
| `deleteFile(recordOrId, {pos?})` | removes node(s) + tracking |

## Bugs found & root causes (all fixed)

**Component**
1. `<template #fallback>` inside a plain `<div>` is not a slot of anything → SSR fallback never rendered. Now a real `v-if="!editorInstance"` skeleton (no `<ClientOnly>`).
2. `defineProps([...])` array form has no Boolean casting → `<REditor disabled>` passed `''` and was **not** disabled. Now typed props.
3. `defineEmits(['update:modelValue'])` + `defineModel` + manual `content.value = v` → parent got every update twice.
4. `starterKit.headings` → Tiptap v3 option is `heading`; levels were ignored.
5. UEditor's built-in `image` extension + custom `ResizableImage` named `image` → duplicate extension. Now `:image="false"`.
6. `completionExtension` / handlers always created even with `ai: false`, and `props.aiApi` read non-reactively. Now created once, only when enabled.
7. Local `const placeholder` / `const contentType` shadowed props of the same name.
8. Media toolbar items captured `selection.from` at *render* time → Replace/Delete could hit a stale node. Now resolved at click time.
9. Library delete called `deleteRange` inside `descendants()` with positions that shift after each delete. Now one transaction, back-to-front.
10. Keyboard-deleted media stayed tracked (orphans). `getUnusedFiles()` / doc-scan based `getPendingFiles()` fix this.
11. `FileBlock` lost its URL on HTML round-trip (`<a>` has `href`, attribute parsed `src`) and rendered an empty link; node view used `innerHTML`. Rewritten with explicit parse/render and DOM APIs; `javascript:` URLs blocked.
12. Image resize listeners leaked if the node was destroyed mid-drag; resize ignored container width. Now pointer-capture based.
13. `clearContent()` called `editorRef.value.commands` (undefined); `getMarkdown` defined twice in `defineExpose`; `setContent(v, boolean)` is the v2 signature.
14. Link popover: `padding: 100px !important`; typed URLs used as-is (incl. `javascript:`); `hasLink` fine but no empty-selection handling. Now its own SFC.
15. Styles for teleported menus lived in scoped CSS (can't match), with a `::deep` typo and a `50px` scrollbar. Moved to an unscoped block.
16. `RFileUpload` errors were forwarded from both `@error` and `@upload-error` → duplicates. `@error` only.
17. Dead code: `emojiOnUpdate`, `appendToBody`, unused imports.

**AI completion**
1. `useCompletion({ body: computed(...) })` — refs aren't unwrapped, so `mode`/`language` never reached the server; everything ran as "continue" (and `completion.post.ts` rejected all non-translate modes with 400).
2. Two watchers + shared mutable `mode`/`insertState` raced.
3. `streamText({ instructions })` — the documented option is `system`; the system prompt was effectively dropped.
4. `google(model, { apiKey })` is not a valid signature (use `createGoogleGenerativeAI`).
5. `console.log(runtimeConfig)` leaked secrets to logs.
6. "Keyed plugin" error: module-level `new PluginKey('completion')`; ProseMirror's key counter is per package copy, so two copies of `prosemirror-state` mint the same key. Now one uniquely-named key per editor instance.
7. Mod-J was debounced and refused after punctuation; debounce timer leaked past destroy; `editor.storage.markdown.serializer` is the v2 community API (Tiptap v3: `editor.markdown.serialize`).

## Free open-source AI setup (Ollama)

```bash
# https://ollama.com — free, runs open models locally
ollama pull qwen2.5:3b        # small & fast; try gemma2 / llama3.2 / qwen2.5:7b for quality
```
`nuxt.config.ts`:
```ts
runtimeConfig: {
  ai: {
    baseURL: 'http://localhost:11434/v1',   // NUXT_AI_BASE_URL
    model: 'qwen2.5:3b',                    // NUXT_AI_MODEL
    apiKey: '',                             // NUXT_AI_API_KEY (not needed for Ollama)
  },
},
```
Any OpenAI-compatible endpoint works (LM Studio, vLLM, or free tiers of Groq / OpenRouter serving open models — set `baseURL`, `model`, `apiKey`). Khmer quality varies a lot by model: test your target languages. The route has an in-memory rate limit (30/min/IP); put real auth in front of it before exposing it publicly.

## Dedupe ProseMirror (recommended)

```ts
// nuxt.config.ts
vite: {
  resolve: { dedupe: ['prosemirror-state', 'prosemirror-view', 'prosemirror-model', 'prosemirror-transform'] },
  optimizeDeps: { include: ['@tiptap/pm/state', '@tiptap/pm/view'] },
},
```
Check for duplicates with `npm ls prosemirror-state` / `pnpm why prosemirror-state`.

## Known limits

- `contentType="markdown"`: images and file links round-trip; **video** is emitted as raw HTML, and image `width` is not stored in markdown. Use `html` or `json` for lossless media.
- Dropped/pasted images are compressed but not cropped (cropping stays in the picker).
- Blob URLs live in `v-model` until uploaded; call `uploadPending()` / `resolveFile()` before saving.
- Suggested small fixes in `RFileUpload.vue` (not changed here): add `defineOptions({ inheritAttrs: false })` (attrs are applied to both the wrapper and `UFileUpload`), and note that compress converts PNG→JPEG, which turns transparent / circle-crop corners black.
