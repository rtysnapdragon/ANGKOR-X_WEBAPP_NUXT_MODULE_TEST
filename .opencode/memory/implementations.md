# Implementation Memory

## 2026-11-18 — RVisualEditor RCanvas Design Builder

Status: implemented; compile and targeted lint verified; manual browser QA pending.

### Goal

Add an `Edit with editor` action to `RVisualEditor` image media controls. The action opens `RCanvas` inside a fullscreen `RSlider` for design editing while preserving the existing in-place `Edit design` flow.

### Files

- `src/runtime/app/components/rvisualeditor/RVisualEditorDesignBuilder.vue` — new wrapper around `RSlider` and `RCanvas`.
- `src/runtime/app/components/rvisualeditor/RVisualEditor.vue` — media bar integration, editor state, save/upload flow, media attrs, styles.
- `src/runtime/app/components/RSlider.vue` — existing slideover wrapper used by the new component.
- `src/runtime/app/components/Editor/Canvaas/RCanvas.vue` — existing canvas editor API.
- `src/runtime/app/components/Editor/Canvaas/RCanvasEngine.js` — existing document/image loading and export behavior.
- `opencode.json` — loads this memory folder into opencode sessions.
- `.opencode/memory/README.md` — memory usage rules.
- `.opencode/memory/implementations.md` — this log.

### Implementation

- Added `RVisualEditorDesignBuilder.vue`:
  - wraps `RSlider` (Nuxt UI `USlideover`) and `RCanvas`;
  - uses fullscreen mode with `:prevent-close="true"`;
  - renders `RCanvas` only while open and remounts with a computed key;
  - forwards `save` and `cancel`.
- Added slideover stacking overrides:
  - overlay `z-index: 10000`;
  - content `z-index: 10001`;
  - required because `.rv-editor.is-fullscreen` uses `z-index: 9999`.
- Hid the RSlider header and removed the inner body padding so RCanvas fills the fullscreen shell; RCanvas already has its own title bar and Cancel action.
- Added `editor` and `chevronDown` icons to `RVisualEditor`.
- Replaced the single image `Edit design` button with a split control:
  - main button `Edit with editor` opens the RCanvas drawer;
  - caret menu contains `Edit with editor` and `Edit design`.
- Added editor state:
  - `editorDesignOpen`;
  - `editorDesignTarget` as `{ pos, src, fileId }`;
  - `editorDesignImage`;
  - `editorDesignDoc`;
  - `editorDesignTitle`.
- Added `openEditorDesign`, `closeEditorDesign`, `resolveEditorDesignPos`, `uploadEditorDesignImage`, and `onEditorDesignSave`.
- Added `hasUploadEndpoint` computed:
  - true when `uploader` is a function or `uploadApi.url` is a non-empty string;
  - only passes an upload handler to `RCanvas` when an endpoint exists.
- Added media node attribute `editorDesign` with default `null`. This is required; undeclared attrs are dropped by ProseMirror.
- RCanvas save flow:
  - resolves the target media node by `fileId` first, then `src`;
  - validates the exported PNG file;
  - creates a new `uploadId`;
  - defers upload when `shouldDeferUpload` is true, otherwise uploads immediately;
  - patches the media node with new `src`, metadata, `editorDesign`, `design: null`, `width: 100`, `height: null`;
  - emits `design-saved` with `{ design, pos }`;
  - closes the drawer.
- Added cleanup on patch failure for deferred uploads.
- Added stale-design clearing:
  - `replaceMedia` clears both `design` and `editorDesign`;
  - in-place `Edit design` save clears `editorDesign`;
  - RCanvas editor save clears `design`.
- Added split-button CSS under `.rv-media__group`.

### Contracts / Decisions

- `design` remains the in-place Fabric design shape: `{ version, w, h, bg, json }`.
- `editorDesign` stores the RCanvas document shape: `{ version, width, height, current, pages: [{ id, name, json }] }`.
- `RCanvas` save emits `{ blob, file, design, width, height }`.
- The RCanvas editor exports a PNG and replaces the article image; `editorDesign` is the source document for reopening.
- `design-saved` is reused for both design flows. Consumers should account for the different payload shapes.
- RCanvas `initialImage` loads with `crossOrigin: 'anonymous'`; remote images must allow CORS.
- `safeUrl` allows HTTP(S), relative URLs, and `blob:` only when `allowBlobUrls` is enabled. Data-image fallback is limited to PNG/JPEG/WebP/GIF/AVIF base64.
- The editor button remains gated by the existing `canvas` feature flag and editability.

### Verification

- Both changed SFCs pass `@vue/compiler-sfc` parse/script/template compilation.
- `RVisualEditorDesignBuilder.vue` passes targeted ESLint with no output.
- Full ESLint for `RVisualEditor.vue` remains noisy with pre-existing errors, so it is not a reliable pass/fail signal.
- Manual browser verification is still recommended:
  - main button opens the drawer;
  - caret menu shows both actions;
  - Apply patches the image and persists `editorDesign`;
  - reopening the editor restores the RCanvas document;
  - drawer appears above fullscreen editor;
  - deferred and immediate upload paths both work.

### Caveats / Follow-ups

- RCanvas cannot reuse the in-place Fabric design format directly; opening `Edit with editor` after an in-place design starts from the rendered image.
- Very large source images are capped by RCanvas `loadImageDocument` (`maxSide = 4096`), so saving may replace the image with a lower-resolution PNG.
- Validation failure closes the drawer so the existing editor notice is visible.
- Pre-existing unrelated modifications exist in:
  - `src/runtime/app/components/rvisualeditor/RVisualEditorUsage.vue`
  - `src/runtime/app/components/btn/BtnShowUploadProcess.vue`
- These were not part of this implementation.

## 2026-11-18 — OpenCode Project Memory

Status: implemented.

### Goal

Create a persistent memory folder so future opencode sessions can recall implementation details.

### Files

- `opencode.json`
- `.opencode/memory/README.md`
- `.opencode/memory/implementations.md`

### Implementation

- Created `.opencode/memory/`.
- Added usage rules and an entry template in `README.md`.
- Added this implementation log.
- Added root `opencode.json` with `instructions` entries for both memory files.

### Verification

- JSON config matches the opencode config schema shape for `instructions`.
- Memory files are plain Markdown and contain no secrets.

### Caveats / Follow-ups

- Restart opencode after changing `opencode.json` so the new instructions are loaded.
- Append future implementation entries to this file.

## 2026-11-18 — RCanvas Save Changes Confirmation Modal

Status: implemented; SFC compile and targeted ESLint verified; manual browser QA pending.

### Goal

When `RCanvas` emits `save` after the user clicks Apply, show a CKEditor-style confirmation dialog before applying the change. The dialog must preview the exported image and show file name, dimensions, file size, Save, and Cancel.

### Files

- `src/runtime/app/components/rvisualeditor/RVisualEditorDesignBuilder.vue`

### Implementation

- Imported `RModal` and added a confirmation modal inside the design builder wrapper.
- Intercepted `RCanvas` `save` in `onSave` instead of immediately forwarding it.
- Added pending-save state:
  - `confirmOpen`;
  - `pendingSave`;
  - `fileName`;
  - `previewUrl`;
  - `fileNameInput`.
- Added object URL preview creation and cleanup with `URL.createObjectURL` / `URL.revokeObjectURL`.
- Added computed values:
  - `canConfirm`;
  - `previewAlt`;
  - `dimensions` from RCanvas `width` and `height`;
  - `fileSize` from the exported file/blob.
- Added filename normalization:
  - trims and strips unsafe path characters;
  - enforces the extension from the exported file type;
  - falls back to the original file name or `design.png`.
- Added Save flow:
  - creates a new `File` with the edited file name;
  - emits the original RCanvas payload with the renamed file;
  - closes the modal and clears pending preview state.
- Added Cancel flow:
  - closes the confirmation modal;
  - keeps the RCanvas drawer open so the user can continue editing.
- Added modal z-index overrides above the design builder:
  - overlay `10100`;
  - content `10101`.
- Added CKEditor-style modal layout:
  - title and description in the modal header;
  - image preview;
  - `Image options` section with editable `File name`;
  - `Dimensions` and `File size` stat cards;
  - Cancel and primary Save buttons.
- Focuses and selects the file name input when the modal opens.
- Closes/clears the confirmation state if the design drawer closes.

### Contracts / Decisions

- The confirmation modal lives in `RVisualEditorDesignBuilder`, not `RVisualEditor`, so the existing parent save/upload flow remains unchanged.
- Cancel from the modal does not cancel the RCanvas session; it only cancels this apply attempt.
- The modal hides its close button and disables overlay dismissal; Cancel and Save are the intended exits.
- The renamed file keeps the exported MIME type and gets a fresh `lastModified`.

### Verification

- `RVisualEditorDesignBuilder.vue` passes `@vue/compiler-sfc` parse/script/template compilation.
- `RVisualEditorDesignBuilder.vue` passes targeted ESLint with no output.
- Manual browser QA still needed:
  - Apply opens the modal with preview;
  - filename edits are reflected in the saved file;
  - dimensions and size are correct;
  - Cancel returns to RCanvas without applying;
  - Save applies and closes both modal and drawer.

### Caveats / Follow-ups

- Modal labels are currently English, matching RCanvas's existing labels.
- The preview uses a temporary object URL and is revoked when pending state is cleared.
- The existing RSlider-based drawer in the wrapper remains the host for RCanvas.
- Saving the exported image still uses the normal media upload path, so an upload endpoint is required to persist it; this matches the existing in-place design flow.
- `npm test` is currently blocked by unrelated environment/repo issues: missing `better-sqlite3` native binding, missing `splendor.api`/`useChartPaddle` modules, and missing `happy-dom`.

## 2026-11-18 - RCanvas Dirty-State Apply and Discard Guard

Status: implemented; SFC compile and targeted ESLint verified; manual browser QA pending.

### Goal

Only show the save-changes modal when the RCanvas document has changed. When Cancel is clicked with unsaved changes, warn before discarding using `RDialog.vue`.

### Files

- `src/runtime/app/components/rvisualeditor/RVisualEditorDesignBuilder.vue`

### Implementation

- Added `dirty` state to the design builder wrapper.
- Set `dirty = false` on RCanvas `ready`, on wrapper open, and when the source document/image props change.
- Set `dirty = true` on RCanvas `change`.
- `onSave` now forwards the save payload immediately when `dirty` is false; the save modal only opens for dirty documents.
- Added `discardOpen` state and a local `RDialog` warning:
  - title `Discard changes?`;
  - warning tone and icon;
  - `Keep editing` / `Discard changes`;
  - non-dismissible, close button hidden.
- Renamed the previous `onCancel` flow to:
  - `requestCancel()`: flushes pending canvas commits via `getDocument()`, then shows the warning only when dirty;
  - `performCancel()`: closes the save/discard dialogs, clears pending state, emits `cancel`, and closes the builder.
- Added a `canvasRef` to call RCanvas `getDocument()` before the dirty check so a debounced edit is flushed before deciding whether to warn.
- Added discard dialog z-index overrides:
  - overlay `10200`;
  - content `10201`.

### Contracts / Decisions

- No-change Apply still emits the normal save payload; only the confirmation modal is skipped.
- Cancel from the save modal remains non-destructive and leaves the editor open.
- Discard confirmation is destructive and closes the builder via the existing `cancel` event.
- The warning uses `RDialog` as requested, while the save confirmation continues to use `RModal`.

### Verification

- `RVisualEditorDesignBuilder.vue` passes targeted ESLint with no output.
- `RVisualEditorDesignBuilder.vue` passes `@vue/compiler-sfc` parse/script/template compilation.
- Manual browser QA still needed:
  - Apply with no changes skips the save modal;
  - Apply after an edit opens the save modal;
  - Cancel with no changes closes directly;
  - Cancel after an edit opens the discard warning;
  - Keep editing returns to RCanvas;
  - Discard changes closes without saving.

### Caveats / Follow-ups

- Dirty tracking is event-based; undoing every edit back to the original still counts as dirty.
- The warning labels are English, matching the existing RCanvas and save dialog labels.

## 2026-11-18 - Figma-Like Raw Editor for Saved RVisualEditor Designs

Status: implemented; targeted ESLint and SFC compile verified; manual browser QA pending.

### Goal

Edit saved `RVisualEditor` designs in a standalone Figma-like side editor instead of the Canva-style `RCanvas` frame/template UI. Plain images keep the existing `RCanvas` flow.

### Files

- `src/runtime/app/components/rvisualeditor/RVisualEditorRawEditor.vue` (new)
- `src/runtime/app/components/rvisualeditor/RVisualEditorDesignBuilder.vue`

### Implementation

- Added a new raw editor built on the reusable `createEngine()` from `RCanvasEngine.js`.
- Layout: top bar, left `Layers`/`Insert` tabs, centered artboard stage, right inspector.
- Top bar: undo/redo, title, dimensions, zoom out/in, fit, Cancel, Apply.
- Layers: drag reorder, inline rename, visibility, lock, selection.
- Insert: text presets, shapes, lines, image upload, image URL, existing media items.
- Inspector: transform, appearance, text, image FX/replace, arrange/align/group/duplicate/delete.
- Canvas inspector when nothing is selected: width/height, background, snapping.
- Supports keyboard shortcuts, Space pan, paste, file drop, upload handler, and image replacement.
- Reuses global `.rc*` styles from `RCanvas.css` under a `.rc.rv-raw` root.
- Emits `change`, `ready`, `save`, `cancel`; exposes `getDocument`, `getEngine`, `state`, `api`.
- `RVisualEditorDesignBuilder` now renders the raw editor when `props.document` exists, otherwise falls back to `RCanvas`.
- Passes the saved document, title, save label, media items, loading state, and upload handler into the raw editor.
- Existing dirty tracking, save modal, and discard warning are reused unchanged.

### Contracts / Decisions

- Only saved designs use the raw editor; plain images remain on `RCanvas`.
- The raw editor edits the current page only; other pages are preserved through `getDocument()`.
- Save payload remains `{ blob, file, design, width, height }` with a PNG named from the title.
- Image FX values use Fabric ranges: brightness/contrast/saturation `-1..1`, blur `0..1`.
- Alignment keys use `left`, `center`, `right`, `top`, `middle`, `bottom`.
- Space pan uses `engine.setSpace(true/false)`, not direct engine state mutation.
- Apply is disabled while loading, busy, or saving; Cancel is disabled while saving.
- While saving, editing UI, undo/redo, zoom/fit, paste, drop, and image adds are disabled so the exported blob and saved design stay in sync.

### Verification

- Both modified SFCs pass `@vue/compiler-sfc` parse/script/template/style compilation.
- Both modified SFCs pass targeted ESLint with no output.
- `npm run dev:build` completes successfully for the playground.
- Manual browser QA still needed:
  - saved document loads with layers and page size;
  - layers/insert/inspector actions update the canvas;
  - pan, zoom, fit, undo/redo work;
  - add/replace images work through upload and URL;
  - Apply with and without changes follows the dirty-state flow;
  - Cancel/discard closes without saving;
  - plain-image `RCanvas` fallback still works.

### Caveats / Follow-ups

- `RVisualEditorRawEditor` only edits the current page; page switching is intentionally out of scope.
- The design builder `canvasKey` includes a `docVersion` counter that increments when the document or initial image prop changes, so the raw editor reloads on a new document.
- W/H edits now scale by the displayed bounding-box ratio, so rotated objects are more consistent with the inspector; text boxes still scale font/width uniformly and may not match both axes exactly.
- `npm test` remains blocked by unrelated environment/repo issues.

### Follow-up fixes

- Added `:inert="!state.ready || saving"` to both side panels and disabled zoom out/in/fit while not ready or saving.
- Fixed line styling controls: `showBorder` is now shown for every selection, and an `isLine` computed switches labels to `Line color` / `Line weight` and allows line weight down to `1`.
- Fixed `applyAngle` to call `api.setAngle(next)` with an absolute angle. `FabricObject.rotate()` / the engine’s `setAngle` set the angle absolutely, not relatively.
- W/H inspector edits now pass the displayed `state.sel.rect.w/h` into `setSelectionSize`, so the scale ratio matches the bounding box the user sees, including rotated objects.
- Fixed `RCanvasEngine.serializePage()` for active multi-selections: it temporarily removes the children from the `ActiveSelection` to bake their transforms into `canvas.toObject()`, then restores the selection. Without this, moving/scaling a multi-selection while it stayed active serialized relative coordinates and lost the group transform. Verified with a Fabric node simulation.
- Targeted ESLint passes for the two modified SFCs. `RCanvasEngine.js` still has pre-existing project lint errors unrelated to this change.
- `openEditorDesign` now opens when a saved `editorDesign` document exists even if the rendered image `src` is no longer available; plain images still require a valid `src`.
- `baseName()` now strips a trailing image extension before appending `.png`, preventing names like `photo.png.png` on a no-change Apply.
- The raw editor now parses a JSON-string `document` prop before loading; invalid strings fall back to a blank document.
- Image FX/replace controls now show only for a single image selection, matching RCanvas; a multi-selection no longer replaces only the first image.
- Space pan now releases on a window-level `keyup` (and on window `blur`), so the canvas does not stay stuck in pan mode if focus leaves the editor while Space is held.
- `npm run dev:build` passes after the final raw-editor changes.
- Saved designs now route to `RVisualEditorRawEditor`: the media “Edit design” action calls `openEditorDesign` when `editorDesign` or a legacy `design` exists; plain images still fall back to `openDesign`/RCanvas.
- `openEditorDesign` converts the legacy `{ w, h, bg, json }` design shape into the engine document shape so old saved designs open in the raw editor too.
- `RVisualEditorRawEditor` now uses the same `useI18n` + `t(key, fallback)`/`tl(label)` pattern as `RVisualEditor`; raw-editor labels, titles, hints, errors, and status text are translatable. New `rve_*` keys were added to `en.json` and `km.json`.
- Targeted ESLint passes for `RVisualEditorRawEditor.vue`; `npm run dev:build` passes after the routing and i18n changes.
- `RVisualEditorDesignBuilder` now always renders `RVisualEditorRawEditor`; the old `RCanvas` fallback branch and import were removed, so “Edit with editor” cannot open RCanvas.
- `RVisualEditorRawEditor` accepts `initialImage` and calls `engine.loadImageDocument()` when there is no saved document, so plain images open in the raw editor with the image as the first object.
- Added a Figma-like free-style tool rail to `RVisualEditorRawEditor`: move, hand, frame, text, rectangle, ellipse, line, pen, and image. Drawing tools use a pointer overlay/marquee; text and image place at the clicked canvas point. Keyboard shortcuts are `V/H/F/T/R/O/L/P/I`; Escape returns to move. The frame tool creates a rectangle named `Frame` with `rcFrame`, which tells export to keep the full canvas.
- Added `RCanvasEditing` point-placement helpers (`addShapeAt`, `addTextAt`, `addLineAt`, `addImageAt`) and a `placeAt` helper. Image-tool uploads place at the clicked point; normal insert/drop still use the centered `addImage`.
- Added Figma-like floating zoom controls, frame label, tool hints, and dark stage styling. Tool labels were added to `en.json`/`km.json`.
- Image-document exports now crop to the original image frame by default. `RCanvasEngine` stores `originalFrame`/`originalBackground`, marks the base image with `rcBase`, and crops `exportBlob()` unless the canvas was resized, the background changed, content extends outside the frame, or a frame object was added. Saved documents keep the frame metadata so later edits still crop correctly.
- Targeted ESLint passes for `RVisualEditorRawEditor.vue`; `RCanvasEditing.js`/`RCanvasEngine.js` only report pre-existing project lint errors. `npm run dev:build` passes after the Figma tools and frame-crop changes.
- Extracted the engine/CSS coupling into `useRVisualEditorEngine.js`; `RVisualEditorRawEditor` no longer imports `RCanvasEngine` or `RCanvas.css` directly. The composable owns `createEngine`, canvas point conversion, and disposal.
- Added `RBtnExCol` collapse/expand toggles for both sidebars, positioned at the inner top corners (left sidebar: top-right; right sidebar: top-left). Collapsed panels become inert and expose a floating edge toggle at the stage corner. `RBtnExCol` now accepts `side` and `mirror` so the right-side toggle can mirror its icon and tooltip.
- Replaced native `title` tooltips in `RVisualEditorRawEditor` with `RTooltip`, using auto-width wrappers and `display: contents` wrappers for grid items.
- The tool rail now defaults to the bottom center and supports `toolsVisible`, `toolsPosition` (`top`/`bottom`/`left`/`right`), `toolsOrientation` (`auto`/`horizontal`/`vertical`), and `toolsOffset` props.
- Added `rve_collapse_*_sidebar` / `rve_expand_*_sidebar` keys to `en.json` and `km.json`. Targeted ESLint passes for the raw editor and composable; `npm run dev:build` passes.
- Fixed `RTooltip` not appearing in `RVisualEditorRawEditor`: the raw editor now explicitly imports `RTooltip` and `RBtnExCol` (matching `RVisualEditor`), `RBtnExCol` explicitly imports `RTooltip`, and `RTooltip`'s popover content is forced to `z-index: 10300` so it renders above the design-builder overlay (`z-index: 10000/10001`). Targeted ESLint passes for the raw editor.
- The Save changes modal now uses `FloatingInput.vue` for the Image options file-name field; focus/select still targets the inner input via the component root, and `--color-bg` is set on the wrapper so the floating label matches the modal surface.
- `RVisualEditorRawEditor` now zooms with a plain mouse wheel via `createEngine({ wheelZoom: true })`; `RCanvasEngine`'s wheel handler still supports Ctrl/Cmd-wheel for other editors. All raw-editor `UIcon` usages were replaced with `RIcon`.
- Dev environment note: `dist/module.mjs` was a stale stub pointing at the old `BZIN PROJECT/WEBAPP_NUXT_MODULE` path; `npm run dev:prepare` regenerated it to the current `ANGKOR-X` path before failing at the root `nuxt.config.ts` fake `defineNuxtConfig` function. The playground also still resolves the unrelated npm package `my-module`, so `npm run dev:build` does not validate this module's components.
- Added true frame containers: frames are top-level white `Rect`s with `rcFrame`; their children stay top-level and store `rcParent`. Each child gets an absolute-positioned `Rect` clipPath matching the frame center/size/angle/radius. Frame move translates children and clips, frame resize/rotate updates clips (rotation also rotates child centers/angles), deleting a frame cascades to children, and moving a child fully outside detaches it. New objects placed inside a frame auto-attach. Frame labels are HTML overlays inside `.rc-stage__page`, clicking selects the frame, and names are unique (`Frame 1`, `Frame 2`, ...). Engine adds `exportFrameBlob(id)` / `exportFrames()`. Smoke-tested with jsdom + Fabric: attach, move, serialization, cascade delete, and frame copy/paste remap pass.
- Added right-inspector image crop with aspect-ratio chips (`cropImage(ratio)` non-destructive source crop, `null` restores full source), image presets with an `RTooltip` info icon, rotate-left/right buttons, and a bottom File info panel (canvas/page/elements/zoom plus selected image name/type/source/crop sizes). `setImageFx` now accepts an object patch for presets. Smoke-tested crop/preset/reset via jsdom + Fabric; targeted ESLint reports no new errors.
- Reworked canvas presets into `PAGE_PRESET_GROUPS` (9 platform groups, 34 sizes) and made `PAGE_PRESETS` a derived flat list. The raw editor's Presets section now uses a styled native `<select>` with platform `<optgroup>`s, size sublabels, and size-matching selection; image-look presets were renamed Filters. `RSelect`'s `required` check now handles boolean props (`isNotEmpty(true)` was false under lodash), so required selects no longer inject the empty-value default-clear item. The old `RCanvasSidebar` page-size list is grouped by platform too. Targeted ESLint reports no new errors; `npm run dev:build` passes.
- `RTooltip` popper mode now supports `side` + `align` (`top`/`bottom`/`left`/`right` with `start`/`center`/`end`), accepts bare `is-popper`, and re-applies placement via `setOptions` when the teleported container mounts or `side`/`align` changes. The `v-if` moved inside `<Transition>` (inside `<Teleport>`) so leave animations run, and global `rt-tooltip-enter/leave-*` + `rt-tooltip-from/to-{side}` classes provide a smooth directional fade/translate/scale. The outer popper element transitions opacity, while the inner `.rt-tooltip-anim` wrapper handles the directional translate/scale transform, so the animation never clobbers Popper's inline positioning transform. The popper arrow class binding was fixed to apply `ui.arrow.*` values instead of object keys. `prevent` / `is-global` / `disabled` now also handle bare attributes. `npm run dev:build` passes; `RTooltip.vue` still has pre-existing project lint errors.
- Added `RCanvasPresetPicker.vue`, a grouped preset dropdown built on `RPopoverPanel` (trigger preview, sticky group headers, 2-column option grid, selected check, `v-model` + `select` emit). `RVisualEditorRawEditor` now uses it in place of the native `<select>`; `applyCanvasPreset(preset)` takes the preset object directly. Added `rve_no_presets` to `en.json`/`km.json`, removed the obsolete `rv-raw__preset-*` CSS, and verified JSON parsing, targeted ESLint (0 errors), and `npm run dev:build`.
- Fixed the preset dropdown not appearing: `RPopoverPanel` now uses a writable `v-model:open`, forces `portal="body"`, and sets `.rpp-content` to `z-index: 5555555 !important` so it sits above the design-builder overlay (`10000/10001`) like `RTooltip`. Also changed `.rpp-panel__body` from `flex: 1` to `flex: 1 1 auto`; the old zero flex-basis collapsed the scrollable body to 0 height, which hid the preset list even when the panel opened. Targeted ESLint and `npm run dev:build` pass.

## 2026-11-19 — RFileManager Add-Category Extension Selection

Status: implemented; targeted ESLint and prepack verified; manual browser QA pending.

### Goal

Match the CKBox-style Add-category modal from `file_manage_ui_13_setting_asset_categories_add-2.png`: selected extensions render as removable chips inside the input, and a full-width dropdown shows available extension chips. The user explicitly required a sample-selection style and rejected using `RSelect.vue` for this UI.

### Files

- `src/runtime/app/components/filemanager/RFileManagerContent.vue` — Add/Edit category modal and extension-selection UI.
- `src/runtime/app/components/input/RInputTags.vue` — local suggestion/tag input used as the sample-selection component.
- `src/runtime/app/components/RSelect.vue` — earlier additive `searchOnly`/panel work remains in the file, but this UI no longer imports or uses it.
- `src/runtime/app/assets/lang/en.json`, `src/runtime/app/assets/lang/km.json` — `rfm_*` modal and extension keys.
- `API_URL_DOC_NEW_REQUIRED.md` — required asset-category endpoints documentation.

### Implementation

- Replaced the `RSelect` extension field with `RInputTags` in local suggestion mode.
- Bound the tag input to `categoryDialog.extensions` via `:model-value` and `@update:data`.
- Added `selectedCategoryExtensions` computed to keep the model an array even if stale data is a string.
- Added `updateCategoryExtensions(values)` to normalize, deduplicate, and store extension values.
- Removed `categoryDialog.extensionInput`, `addCategoryExtension()`, and `filteredCategoryExtensions()`.
- Suggestions come from `categoryExtensionChoices`: static options, file-derived extensions, and currently selected extensions.
- The `#suggestion` slot renders each option as `.rfm__extension-chip`.
- Added CSS overrides for the tag input base, selected chips, full-width suggestion container, and chip-like suggestion items.
- Kept category persistence localStorage-backed under `rfm_categories`.

### Contracts / Decisions

- `categoryDialog.extensions` is always a `string[]`.
- All extension values pass through `normalizeCategoryExtension`: trimmed, lowercase, leading dots removed, unsupported characters stripped.
- `RInputTags` emits `update:data`; the parent owns normalization and the final array state.
- Selected tags are filtered out of the suggestion dropdown by `RInputTags`.
- `RSelect.vue` is not part of this UI; its earlier panel/search-only changes are additive and currently unused here.
- Backend asset-category endpoints are still not implemented; only documented.

### Verification

- `npx eslint "src/runtime/app/components/filemanager/RFileManagerContent.vue"` passes with no output.
- `npm run prepack` reports only the pre-existing `RFileUpload1.vue` TS4025 diagnostic.
- `git diff --check` reports only existing CRLF warnings.

### Caveats / Follow-ups

- Manual browser QA is still needed for dropdown opening on focus, chip removal, typed custom extensions, and exact visual match to `-2.png`.
- Pre-existing `RSelect.vue` lint errors remain unrelated to this change.
- Asset-category API endpoints in `API_URL_DOC_NEW_REQUIRED.md` still need backend implementation before localStorage can be replaced.

## 2026-11-19 — RTable Nuxt UI 4 / OCTable Parity Improvements

Status: implemented; SFC/style compile and `npm run dev:build` verified; manual browser QA pending.

### Goal

Improve `RTable.vue` to behave more like `OCTable.vue` while staying on Nuxt UI 4 `UTable`, and fix pagination for the installed Nuxt UI 4.9.0 API.

### Files

- `src/runtime/app/components/table/RTable.vue` — table parity features and fixes.
- `src/runtime/app/components/table/RPagination.vue` — rewritten Nuxt UI 4 pagination contract.
- `src/runtime/app/assets/lang/en.json`, `km.json`, `zh.json` — new table labels.

### Implementation

- Added `defineOptions({ name: 'RTable' })` and OCTable-compatible `haveBorder` / `hideGroupBtnSelect` props.
- Added loading slot support for `showTemplate`, table remount key, UTable dynamic cell/header slot forwarding, flattened row slot props, and `onSelect` row selection hook.
- Added normalized options for length menus, searching, page length, row select, row reorder, virtualization, order, and selection toolbar visibility.
- Added fixed/pinned column resolution into UTable `columnPinning`, supporting boolean, number, array, and left/right object forms.
- Added DataTables-style initial ordering resolution and multi-sort dropdowns for columns with `sortData`.
- Added row reorder column and `onRowReorder(event, diff, true)` emission; local row order updates emit `update:data` / `update:dataSrc` instead of mutating props.
- Added API URL normalization through `getUrl` for string and object `api` props.
- Added `keyTable` reset/remount handling and `refreshToken` reactivity for client-side refreshes.
- Restored viewport height synchronization using requestAnimationFrame and toolbar/footer/table observers without observing the root height style.
- Updated `RPagination.vue` to use `itemsPerPage`, `total`, computed page count, v4 `UPagination` slots, and no invalid `pageCount` / `max` props.
- Added i18n keys for empty states, selection actions, row selection, sorting, reorder, rows-per-page, loading, searching, collapse, and expand.

### Contracts / Decisions

- `UTable` dynamic slots remain `${column.id}-cell` and `${column.id}-header`; parent slots may be `slot`, `key`, or `key-cell`.
- Parent cell slots receive both legacy `{ rowData, value, index }` and flattened row fields plus `{ row, column, cell }`.
- `onSort` emits `{ column, direction, field, source }`; `onOrder` keeps the legacy `[orderBy, orderDir]` payload.
- `editorDesign`-style design work is unrelated; this entry applies only to table components and language files.
- Pagination now relies on `v-model:page` and optional `changePagination`; invalid Nuxt UI v3 pagination props were removed.

### Verification

- `@vue/compiler-sfc` parse, script, template, and SCSS style compilation pass for both modified SFCs.
- `npm run dev:build` passes.
- JSON parsing passes for `en.json`, `km.json`, and `zh.json`.
- Targeted ESLint runs but reports the project's pre-existing style-rule noise; `RPagination.vue` has no syntax errors in that output.

### Caveats / Follow-ups

- Manual browser QA is still needed for pinned columns, row drag, multi-sort dropdown, selection bar, pagination controls, and viewport row-height behavior.
- `npm run prepack` remains blocked by pre-existing `OCTable.vue` SCSS missing `datatables.net-dt`.
- `npm run test:types` remains blocked by the existing deprecated TypeScript `baseUrl` config error.
- `useRTableFilter` is not present in this module; local typechecking may still fail unless the host supplies it.

## 2026-11-19 — RTABLE_USING.md Parent Usage Guide

Status: implemented; documentation and repository checks verified.

### Goal

Create `RTABLE_USING.md` describing all parent-facing `RTable` usage cases, including props, slots, events, options, exposed methods, API contracts, and examples based on the current Nuxt UI 4 implementation.

### Files

- `RTABLE_USING.md` — new root documentation file.
- `.opencode/memory/implementations.md` — this log.

### Implementation

- Documented local/client data mode and server/API mode.
- Documented all declared props and both models (`selected`, `loading`).
- Documented accepted RTable and OCTable column shapes, column fields, slot-name resolution, header slots, and render fallback.
- Documented normalized options, including search, paging, length menu, sticky, virtualize, row select, row reorder, fixed columns, ordering, selection bar, and row callback.
- Added examples for basic local tables, API tables, request reshaping via `update:data`, custom cell/header/actions slots, toolbar slots, `showTemplate`, mobile cards, selection, server-side select-all, sorting/filtering, row reorder, fixed/collapsible/draggable columns, ref methods, and state persistence.
- Documented API request and response envelopes accepted by `getData()`.
- Documented all emitted parent events and the exposed ref API.
- Recorded current caveats for compatibility-only props/options and disabled header filter/export UI.

### Contracts / Decisions

- Documentation is written for the current source in `src/runtime/app/components/table/RTable.vue`, not for DataTables/OCTable internals.
- `update:data` is a mutable request payload event, not a row-data event.
- `update:dataSrc` emits the raw API response after `api.where` and before envelope unwrapping.
- `dt()` is documented as compatibility-only because `RTable` uses `UTable`.
- `filterState`, `minWidth`, and `clampLines` caveats are explicit because they are declared/read but not fully wired as parent inputs.
- Header column-filter and export menus are documented as currently commented out in `RTableHeader.vue`.

### Verification

- `git diff --check` reports only the existing CRLF warning for `.opencode/memory/implementations.md`; no new whitespace errors for `RTABLE_USING.md`.
- Markdown code fences are balanced: 42 fence markers.
- No `//` comments were left in documentation code examples.
- No application build was run because the change is documentation-only.

### Caveats / Follow-ups

- Manual review is still recommended to confirm wording against host auto-imports and future RTable changes.
- Existing unrelated workspace modifications and untracked files were left untouched.
