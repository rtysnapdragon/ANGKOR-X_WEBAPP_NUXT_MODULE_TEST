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
