<template>
  <div class="r-editor" :class="{ 'r-editor--disabled': isDisabled }" :aria-busy="!editorInstance">
    <!-- SSR / pre-mount placeholder. Rendered on the server and during the first
         client pass (editorInstance is null in both → no hydration mismatch),
         removed as soon as Tiptap is created. No <ClientOnly> needed. -->
    <div v-if="!editorInstance" class="r-editor__skeleton" aria-hidden="true">
      <div class="r-editor__skeleton-toolbar" />
      <div class="r-editor__skeleton-line" />
      <div class="r-editor__skeleton-line" />
      <div class="r-editor__skeleton-line r-editor__skeleton-line--short" />
    </div>

    <UEditor
      ref="editorRef"
      v-slot="{ editor, handlers }"
      v-model="content"
      :content-type="contentType"
      :editable="!isDisabled"
      :extensions="allExtensions"
      :handlers="allHandlers"
      :starter-kit="starterKit"
      :image="false"
      :placeholder="{ placeholder: placeholderText, includeChildren: true }"
      :ui="mergedUi"
      class="r-editor__root"
      @update:model-value="onContentUpdate"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
      <!-- ── Fixed toolbar ─────────────────────────────────────────────── -->
      <UEditorToolbar
        v-if="opts.toolbar"
        :editor="editor"
        :items="fixedToolbarItems"
        layout="fixed"
        class="r-editor__toolbar r-editor__toolbar--fixed"
      >
        <template v-if="opts.link" #link>
          <REditorLinkPopover :editor="editor" />
        </template>
        <template v-if="opts.textStyle" #color>
          <label class="r-editor__swatch" title="Text colour">
            <i class="i-lucide-baseline" :style="{ color: editor.getAttributes('textStyle').color || 'currentColor' }" />
            <input type="color" aria-label="Text colour" @input="editor.chain().focus().setColor($event.target.value).run()">
          </label>
        </template>
        <template v-if="opts.textStyle" #highlight>
          <label class="r-editor__swatch" title="Highlight colour">
            <i class="i-lucide-highlighter" />
            <input type="color" value="#fde047" aria-label="Highlight colour" @input="editor.chain().focus().setHighlight({ color: $event.target.value }).run()">
          </label>
        </template>
      </UEditorToolbar>

      <!-- ── Table toolbar (cursor inside a table) ─────────────────────── -->
      <UEditorToolbar
        v-if="opts.table"
        :editor="editor"
        :items="tableToolbarItems"
        layout="bubble"
        :should-show="tableShouldShow"
      />

      <!-- ── Bubble toolbar (text selection) ───────────────────────────── -->
      <UEditorToolbar
        v-if="opts.bubbleToolbar"
        :editor="editor"
        :items="bubbleToolbarItems"
        layout="bubble"
        :should-show="bubbleShouldShow"
      >
        <template v-if="opts.link" #link>
          <REditorLinkPopover :editor="editor" />
        </template>
      </UEditorToolbar>

      <!-- ── Media bubble toolbar (image / video / file selected) ──────── -->
      <UEditorToolbar
        v-if="hasMediaUpload"
        :editor="editor"
        :items="mediaToolbarItems(editor)"
        layout="bubble"
        :should-show="mediaShouldShow"
      />

      <UEditorSuggestionMenu v-if="opts.suggestionMenu" :editor="editor" :items="suggestionItems" />
      <UEditorMentionMenu v-if="opts.mentionMenu && mentionItems.length" :editor="editor" :items="mentionItems" />
      <UEditorEmojiMenu v-if="opts.emojiMenu" :editor="editor" :items="emojiItems" />

      <!-- ── Drag handle ───────────────────────────────────────────────── -->
      <UEditorDragHandle
        v-if="opts.dragHandle"
        v-slot="{ ui, onClick }"
        :editor="editor"
        @node-change="selectedNode = $event"
      >
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="sm"
          :class="ui.handle()"
          aria-label="Insert block"
          @click="(e) => insertBlockBelow(e, editor, handlers, onClick)"
        />
        <UDropdownMenu
          v-slot="{ open }"
          :modal="false"
          :items="turnIntoItems(editor)"
          :content="{ side: 'left' }"
          :ui="dropMenuUI"
          @update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
        >
          <UButton
            color="neutral"
            variant="ghost"
            active-variant="soft"
            size="sm"
            icon="i-lucide-grip-vertical"
            :active="open"
            :class="ui.handle()"
            aria-label="Block options"
          />
        </UDropdownMenu>
      </UEditorDragHandle>
    </UEditor>

    <!-- ── Media insert / replace picker ───────────────────────────────── -->
    <RModal v-model="pickerOpen" :title="pickerTitle">
      <div class="r-editor__picker">
        <RFileUpload
          :key="pickerKey"
          v-model="pickerFiles"
          :multiple="false"
          :accept="pickerCfg.accept"
          :crop="uploadCrop"
          :crop-shape="uploadCropShape"
          :crop-output-px="uploadCropOutputPx"
          :compress="uploadCompress"
          :compress-quality="uploadCompressQuality"
          :compress-max-px="uploadCompressMaxPx"
          :max-size="pickerCfg.maxSize"
          :max-width="uploadMaxWidth"
          :max-height="uploadMaxHeight"
          :min-width="uploadMinWidth"
          :min-height="uploadMinHeight"
          :upload-fn="handlePickerFile"
          :label="pickerLabel"
          :description="pickerDescription"
          @error="(payload) => emit('upload-error', payload)"
        />

        <!-- Insert an existing HTTPS URL without uploading anything -->
        <div v-if="opts.urlInsert" class="r-editor__url">
          <div class="r-editor__url-row">
            <UInput
              v-model="urlValue"
              class="r-editor__url-input"
              size="sm"
              icon="i-lucide-link"
              placeholder="https://example.com/file"
              @keydown.enter.prevent="submitUrl"
            />
            <UButton size="sm" :disabled="!urlValue.trim()" @click="submitUrl">
              {{ tBy({ en: 'Insert URL', km: 'បញ្ចូល URL' }) }}
            </UButton>
          </div>
          <p v-if="urlError" class="r-editor__url-error">{{ urlError }}</p>
        </div>
      </div>
    </RModal>

    <!-- ── Media library ───────────────────────────────────────────────── -->
    <RModal v-model="libraryOpen" :title="`${tBy({ en: 'Uploaded files', km: 'ឯកសារបានបង្ហោះ' })} (${fileList.length})`">
      <div class="r-editor__library">
        <div v-if="!fileList.length" class="r-editor__library-empty">
          {{ tBy({ en: 'No files uploaded in this session yet.', km: 'មិនទាន់មានឯកសារត្រូវបានបង្ហោះក្នុងវគ្គនេះទេ' }) }}
        </div>

        <div v-else class="r-editor__library-grid">
          <div v-for="f in fileList" :key="f.id" class="r-editor__library-item">
            <button type="button" class="r-editor__library-thumb" title="Insert at cursor" @click="insertLibraryFile(f)">
              <img v-if="f.kind === 'image'" :src="f.url" :alt="f.name">
              <span v-else class="r-editor__library-thumb-icon">
                <i :class="f.kind === 'video' ? 'i-lucide-video' : 'i-lucide-file-text'" />
              </span>
            </button>
            <span v-if="f.status !== 'uploaded'" class="r-editor__library-badge" :class="`is-${f.status}`">
              {{ STATUS_LABELS[f.status] ? tBy(STATUS_LABELS[f.status]) : f.status }}
            </span>
            <div class="r-editor__library-meta">
              <span class="r-editor__library-name" :title="f.name">{{ f.name }}</span>
              <span class="r-editor__library-size">{{ formatBytes(f.size) }}</span>
            </div>
            <button type="button" class="r-editor__library-delete" title="Delete" @click="deleteUploadedFile(f)">
              <i class="i-lucide-trash-2" />
            </button>
          </div>
        </div>
      </div>
    </RModal>

    <!-- ── Design canvas (fabric) — edits IN PLACE ──────────────────────────
         The canvas is drawn exactly over the image in the article (it follows
         scroll / resize). "Expand" switches to a full-screen workspace.
         Built into REditor; fabric loads on first use. -->
    <Teleport v-if="canvasEnabled" to="body">
      <div
        v-if="designOpen" ref="designRoot" class="r-design" :class="designUi.expanded ? 'is-full' : 'is-inplace'"
        :style="designFrameStyle" role="dialog" aria-label="Design canvas" tabindex="-1" @keydown="onDesignKey"
      >
        <div class="r-design__dock" :style="designDockStyle">
          <!-- Header -->
          <div class="r-design__bar">
            <strong class="r-design__title">{{ designPlaceholder ? 'New design' : 'Edit design' }}</strong>
            <button type="button" class="r-design__btn" title="Undo (Ctrl+Z)" :disabled="!designUi.canUndo" @click="undo"><i class="i-lucide-undo-2" /></button>
            <button type="button" class="r-design__btn" title="Redo (Ctrl+Shift+Z)" :disabled="!designUi.canRedo" @click="redo"><i class="i-lucide-redo-2" /></button>
            <select class="r-design__field" :value="designPage.preset" aria-label="Page size" @change="onPreset($event.target.value)">
              <option v-for="p in DESIGN_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
              <option value="custom" disabled>Custom</option>
            </select>
            <input class="r-design__field r-design__num" type="number" min="100" max="4000" :value="designPage.w" aria-label="Page width" @change="setPageSize($event.target.value, designPage.h)">
            <span>×</span>
            <input class="r-design__field r-design__num" type="number" min="100" max="4000" :value="designPage.h" aria-label="Page height" @change="setPageSize(designPage.w, $event.target.value)">
            <input class="r-design__color" type="color" :value="designPage.bg" title="Page background" aria-label="Page background" @input="setBackground($event.target.value)">
            <span class="r-design__grow" />
            <label class="r-design__check" title="Also insert the documents / videos you added as file blocks under the image">
              <input v-model="designUi.attach" type="checkbox"> Attach files
            </label>
            <button type="button" class="r-design__btn" :title="designUi.expanded ? 'Back to in-place' : 'Expand to full screen'" @click="designUi.expanded = !designUi.expanded">
              <i :class="designUi.expanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" />
            </button>
            <button type="button" class="r-design__btn r-design__btn--text" @click="closeDesign({ cancelled: true })">Cancel</button>
            <button type="button" class="r-design__btn r-design__btn--text r-design__btn--primary" :disabled="!designUi.ready || designUi.busy" @click="insertDesign">
              {{ designUi.busy ? 'Working…' : 'Done' }}
            </button>
          </div>

          <!-- Tools: add / align / arrange -->
          <div class="r-design__tools">
            <input ref="designFileInput" type="file" multiple hidden @change="onDesignPick">
            <button type="button" class="r-design__btn r-design__btn--text" @click="designFileInput?.click()"><i class="i-lucide-paperclip" /> Add files</button>
            <button type="button" class="r-design__btn" title="Text" @click="addText"><i class="i-lucide-type" /></button>
            <button type="button" class="r-design__btn" title="Rectangle" @click="addRect"><i class="i-lucide-square" /></button>
            <button type="button" class="r-design__btn" title="Line" @click="addLine"><i class="i-lucide-minus" /></button>
            <span class="r-design__sep" />
            <select v-model="designUi.alignTo" class="r-design__field" aria-label="Align relative to" title="Align relative to">
              <option value="page">To page</option>
              <option value="objects">To each other</option>
            </select>
            <button v-for="[mode, icon, label] in ALIGN_BUTTONS" :key="mode" type="button" class="r-design__btn" :title="label" :disabled="!designSel.n" @click="align(mode)"><i :class="icon" /></button>
            <button type="button" class="r-design__btn" title="Distribute horizontally" :disabled="designSel.n < 3" @click="distribute('x')"><i class="i-lucide-align-horizontal-distribute-center" /></button>
            <button type="button" class="r-design__btn" title="Distribute vertically" :disabled="designSel.n < 3" @click="distribute('y')"><i class="i-lucide-align-vertical-distribute-center" /></button>
            <span class="r-design__sep" />
            <button v-for="[op, icon, label] in ORDER_BUTTONS" :key="op" type="button" class="r-design__btn" :title="label" :disabled="!designSel.n" @click="arrange(op)"><i :class="icon" /></button>
            <button type="button" class="r-design__btn" title="Flip horizontally" :disabled="!designSel.n" @click="flip"><i class="i-lucide-flip-horizontal-2" /></button>
            <button type="button" class="r-design__btn" title="Duplicate (Ctrl+D)" :disabled="!designSel.n" @click="duplicate"><i class="i-lucide-copy" /></button>
            <button type="button" class="r-design__btn r-design__btn--danger" title="Delete" :disabled="!designSel.n" @click="removeSelected"><i class="i-lucide-trash-2" /></button>
            <span class="r-design__sep" />
            <label class="r-design__check"><input v-model="designUi.snap" type="checkbox"> Snap</label>
          </div>

          <!-- Properties of the selection -->
          <div v-if="designSel.n" class="r-design__props">
            <span class="r-design__kind">{{ designSel.n > 1 ? `${designSel.n} objects` : designSel.kind }}</span>
            <label>X <input class="r-design__field r-design__num" type="number" :value="designSel.x" @change="setPosition('x', $event.target.value)"></label>
            <label>Y <input class="r-design__field r-design__num" type="number" :value="designSel.y" @change="setPosition('y', $event.target.value)"></label>
            <label>W <input class="r-design__field r-design__num" type="number" min="1" :value="designSel.w" @change="setDimension('w', $event.target.value)"></label>
            <label>H <input class="r-design__field r-design__num" type="number" min="1" :value="designSel.h" @change="setDimension('h', $event.target.value)"></label>
            <label class="r-design__check"><input v-model="designSel.lock" type="checkbox"> Ratio</label>
            <label v-if="designSel.hasFill" class="r-design__check">Colour <input class="r-design__color" type="color" :value="designSel.fill" @input="setFill($event.target.value)"></label>
            <label class="r-design__check">Opacity
              <input type="range" min="5" max="100" :value="designSel.opacity" @input="setOpacity(Number($event.target.value))" @change="commit()">
            </label>
          </div>
          <p v-else class="r-design__hint">Drop or paste any file onto the canvas · drag corners to resize · Shift-click to select several, then align / distribute</p>
          <p v-if="designUi.msg" class="r-design__error" role="alert">{{ designUi.msg }}</p>
        </div>

        <div class="r-design__body">
          <div ref="designStage" class="r-design__stage" @dragover.prevent @drop.prevent="onDesignDrop">
            <div class="r-design__page"><canvas ref="designCanvasEl" /></div>
            <div v-if="!designUi.ready" class="r-design__loading" role="status">Loading canvas…</div>
          </div>
        </div>

        <footer v-if="designUi.expanded" class="r-design__foot">
          <span class="r-design__grow" />
          <button type="button" class="r-design__btn" title="Zoom out" @click="setZoom(designUi.zoom / 1.2)"><i class="i-lucide-zoom-out" /></button>
          <input type="range" min="5" max="300" :value="Math.round(designUi.zoom * 100)" aria-label="Zoom" @input="setZoom(Number($event.target.value) / 100)">
          <button type="button" class="r-design__btn" title="Zoom in" @click="setZoom(designUi.zoom * 1.2)"><i class="i-lucide-zoom-in" /></button>
          <span class="r-design__pct">{{ Math.round(designUi.zoom * 100) }}%</span>
          <button type="button" class="r-design__btn" title="Fit to screen" @click="fit"><i class="i-lucide-maximize" /></button>
        </footer>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, useTemplateRef, watch } from 'vue'
import { mapEditorItems } from '@nuxt/ui/utils/editor'
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { useEditorCompletion } from '../../composables/EditorUseCompletion'
import REditorLinkPopover from './REditorLinkPopover.vue'
import {
  ResizableImage, VideoBlock, FileBlock, createFileHandlerExtension,
  MEDIA_NODE_TYPES, NODE_TO_KIND, formatBytes, safeUrl, compressImageFile, detectKind, uid,
} from './REditorMedia'
import { useEditorFiles } from './REditorFiles'


// ════════════════════════════════════════════════════════════════════════
// Props — same names as before; Boolean casting + defaults are now real
// (`<REditor disabled>` used to be ignored because array props don't cast).
// ════════════════════════════════════════════════════════════════════════
const props = defineProps({
  contentType: { type: String, default: 'markdown' },   // 'markdown' | 'html' | 'json'
  placeholder: { type: String, default: "Write, type '/' for commands..." },
  disabled: { type: Boolean, default: false },
  mentionItems: { type: Array, default: () => [] },
  extraExtensions: { type: Array, default: () => [] },
  extraHandlers: { type: Object, default: () => ({}) },
  options: { type: Object, default: () => ({}) },
  ui: { type: Object, default: () => ({}) },

  // ── Uploads ──────────────────────────────────────────────────────────
  api: { type: Object, default: null },                 // optional now
  uploadHandler: { type: Function, default: null },     // (file, onProgress, record) => Promise<{ url, id? }>
  uploadStrategy: { type: String, default: null },      // 'deferred' | 'immediate' (auto: immediate when api.url)
  initialFiles: { type: Array, default: () => [] },     // existing remote files for the library

  // ── Design (fabric canvas) ─────────────────────────────────────────────────
  designs: { type: Object, default: () => ({}) },       // { [imageUrl]: design } — lets "Edit design" reopen saved designs
  canvasOptions: { type: Object, default: () => ({}) }, // { width, height, background } — default page
  uploadCrop: { type: Boolean, default: true },
  uploadCropShape: { type: String, default: 'square' },
  uploadCropOutputPx: { type: Number, default: 1600 },
  uploadCompress: { type: Boolean, default: true },
  uploadCompressQuality: { type: Number, default: 0.82 },
  uploadCompressMaxPx: { type: Number, default: 1920 },
  uploadMaxImageSize: { type: Number, default: null },
  uploadMaxVideoSize: { type: Number, default: null },
  uploadMaxFileSize: { type: Number, default: null },
  uploadMaxWidth: { type: Number, default: null },
  uploadMaxHeight: { type: Number, default: null },
  uploadMinWidth: { type: Number, default: null },
  uploadMinHeight: { type: Number, default: null },

  // ── AI ───────────────────────────────────────────────────────────────
  aiApi: { type: String, default: '/api/completion' },
  aiLanguages: { type: Array, default: () => ['English', 'French', 'Spanish', 'German', 'Khmer', 'Chinese'] },
})

const emit = defineEmits([
  'change', 'focus', 'blur',
  'update:files',          // full tracked records[] whenever it changes
  'file-pending',          // record — local file inserted, awaiting upload
  'file-uploaded',         // record — file now has its final URL (upload, resolveFile or URL insert)
  'file-upload-progress',  // { record, percent }
  'file-changed',          // { old, next } — media replaced
  'file-deleted',          // record — media removed + tracking dropped
  'file-delete-error',     // { record, error }
  'design-saved',          // { record, design } — a design was inserted / updated as an image
  'upload-error',          // { file?, url?, record?, message, type, error? }
  'upload-complete',       // { uploaded, failed, ok } — after uploadPending()
  'ai-error',              // Error from the completion endpoint
])

// v-model — html / markdown / json depending on content-type. (The old code
// also listed update:modelValue in defineEmits and re-assigned the model in a
// handler, so parents received every update twice.)
const content = defineModel({ type: [String, Object], default: '' })

const editorRef = useTemplateRef('editorRef')
const editorInstance = computed(() => editorRef.value?.editor ?? null)
const selectedNode = ref(null)

// ─── Options ─────────────────────────────────────────────────────────────────
const OPTION_DEFAULTS = {
  toolbar: true, bubbleToolbar: true, dragHandle: true, suggestionMenu: true,
  mentionMenu: true, emojiMenu: true, textAlign: true, link: true,
  imageUpload: true, videoUpload: true, fileUpload: true, mediaLibrary: true,
  ai: true,
  fileDrop: true,   // accept files dropped / pasted straight into the editor
  urlInsert: true,  // "Insert URL" field in the picker
  canvas: true,     // Design button / slash item / "Edit design" (needs imageUpload)
  textStyle: true,  // font family / size / colour / highlight
  table: true,      // resizable tables + table toolbar
  // accept: { image, video, file }   — <input accept> strings per kind
  // maxSize: { image, video, file }  — bytes per kind
}
const opts = computed(() => ({ ...OPTION_DEFAULTS, ...(props.options || {}) }))

const isDisabled = computed(() => props.disabled)
const placeholderText = computed(() => props.placeholder)
const canvasEnabled = computed(() => opts.value.canvas !== false && opts.value.imageUpload !== false)
const hasMediaUpload = computed(() => opts.value.imageUpload || opts.value.videoUpload || opts.value.fileUpload)

// Tiptap v3 StarterKit option is `heading` (`headings` was silently ignored).
const starterKit = {
  heading: { levels: [1, 2, 3, 4] },
  dropcursor: { color: 'var(--ui-primary)', width: 2 },
  link: { openOnClick: false },
}

const mergedUi = computed(() => ({
  root: 'r-editor__prose',
  base: 'px-4 py-3 sm:px-6',
  ...props.ui,
}))

const emojiItems = gitHubEmojis.filter(e => !e.name.startsWith('regional_indicator_'))

// ════════════════════════════════════════════════════════════════════════
// Files
// ════════════════════════════════════════════════════════════════════════
const strategy = computed(() => props.uploadStrategy ?? (props.api?.url ? 'immediate' : 'deferred'))
const filesApi = useEditorFiles({ editorRef, props, emit, opts, strategy })
const fileList = filesApi.files

watch(() => props.initialFiles, list => filesApi.registerRemoteFiles(list), { immediate: true })

// ════════════════════════════════════════════════════════════════════════
// AI completion — created once per instance (when enabled), so the extension
// and its plugin key exist exactly once per editor.
// ════════════════════════════════════════════════════════════════════════
const ai = opts.value.ai !== false
  ? useEditorCompletion(editorRef, { api: () => props.aiApi, onError: error => emit('ai-error', error) })
  : null

// ─── Extensions — one stable array for the component's lifetime ─────────────
// Media nodes are ALWAYS registered (existing content must render even if a
// given upload type is switched off); `options` only toggles the UI.
const allExtensions = [
  ...(opts.value.emojiMenu ? [Emoji] : []),
  ...(opts.value.textAlign ? [TextAlign.configure({ types: ['heading', 'paragraph'] })] : []),
  ...(opts.value.textStyle ? [TextStyle, Color, FontFamily, FontSize, Highlight.configure({ multicolor: true })] : []),
  ...(opts.value.table ? [Table.configure({ resizable: true }), TableRow, TableHeader, TableCell] : []),
  ResizableImage,
  VideoBlock,
  FileBlock,
  createFileHandlerExtension({
    onFiles: (list, pos) => { filesApi.addFiles(list, { pos }) },
    isEnabled: () => opts.value.fileDrop && hasMediaUpload.value,
  }),
  ...(ai ? [ai.extension] : []),
  ...props.extraExtensions,
]

// ════════════════════════════════════════════════════════════════════════
// Picker (RFileUpload in a modal) + URL insert
// ════════════════════════════════════════════════════════════════════════
const pickerOpen = ref(false)
const pickerFiles = ref([])
const pickerMode = ref('insert')   // 'insert' | 'replace'
const pickerKind = ref('image')    // 'image' | 'video' | 'file'
const pickerKey = ref(0)
const replaceTarget = ref(null)    // { pos, src, fileId }
const urlValue = ref('')
const urlError = ref('')
const libraryOpen = ref(false)
const pickerRecordByFile = new WeakMap()   // File -> record id (so RFileUpload "retry" doesn't insert twice)

const pickerCfg = computed(() => filesApi.kindConfig(pickerKind.value))
const pickerTitle = computed(() => {
  const verb = pickerMode.value === 'replace' ? 'Replace' : 'Insert'
  const noun = { video: 'video', file: 'document', image: 'image' }[pickerKind.value]
  return `${verb} ${noun}`
})
const pickerLabel = computed(() => ({
  video: 'Drop a video here', file: 'Drop a document here', image: 'Drop an image here',
})[pickerKind.value])

function describeAccept(accept) {
  const tokens = accept.split(',').map(s => s.trim()).filter(Boolean)
  if (tokens.every(t => t.startsWith('.'))) return tokens.map(t => t.slice(1).toUpperCase()).join(', ')
  return { image: 'PNG, JPG, GIF, WEBP', video: 'MP4, WEBM, MOV' }[pickerKind.value] ?? tokens.join(', ')
}
const pickerDescription = computed(() =>
  `${describeAccept(pickerCfg.value.accept)} — max ${formatBytes(pickerCfg.value.maxSize)}`)

function openFilePicker(mode = 'insert', pos = null, kind = 'image') {
  pickerMode.value = mode
  pickerKind.value = kind
  replaceTarget.value = null
  if (mode === 'replace' && pos != null) {
    const node = editorInstance.value?.state.doc.nodeAt(pos)
    if (node) replaceTarget.value = { pos, src: node.attrs.src, fileId: node.attrs.fileId }
  }
  pickerFiles.value = []
  urlValue.value = ''
  urlError.value = ''
  pickerKey.value += 1
  pickerOpen.value = true
}

function openLibrary() {
  libraryOpen.value = true
}

// RFileUpload calls this with the FINAL file (cropped → compressed). We insert
// it immediately with a blob preview. Upload happens now ('immediate') or later
// via uploadPending() / the parent ('deferred').
async function handlePickerFile(file, onProgress) {
  let id = pickerRecordByFile.get(file)
  if (!id) {
    const problem = filesApi.validate(file, pickerKind.value)
    if (problem) throw new Error(problem.message)
    const record = filesApi.addLocalFile(file, {
      kind: pickerKind.value,
      replaceTarget: pickerMode.value === 'replace' ? replaceTarget.value : null,
    })
    if (!record) throw new Error('File was rejected')
    id = record.id
    pickerRecordByFile.set(file, id)
  }
  if (strategy.value === 'immediate') await filesApi.uploadRecord(id, { onProgress })
  onProgress?.(100)
  pickerOpen.value = false
}

function submitUrl() {
  const url = urlValue.value.trim()
  if (!url) return
  const message = filesApi.validateUrl(url, pickerKind.value)
  if (message) { urlError.value = message; return }
  const record = filesApi.addRemoteUrl(url, {
    kind: pickerKind.value,
    replaceTarget: pickerMode.value === 'replace' ? replaceTarget.value : null,
  })
  if (record) pickerOpen.value = false
}

watch(pickerOpen, (isOpen) => { if (!isOpen) { urlValue.value = ''; urlError.value = '' } })

const insertLibraryFile = filesApi.insertLibraryFile
const deleteUploadedFile = (record, { pos = null } = {}) => filesApi.deleteFile(record, { pos })

const STATUS_LABELS = {
  pending: { en: 'Pending', km: 'កំពុងរង់ចាំ' },
  uploading: { en: 'Uploading', km: 'កំពុងបង្ហោះ' },
  error: { en: 'Failed', km: 'បរាជ័យ' },
}

// ════════════════════════════════════════════════════════════════════════
// Design canvas — fabric, built into REditor (no separate component).
// Flow: add files (any type) → move / resize / align / distribute → Insert as an
// image. Non-image files appear as cards and can also be attached to the article.
// fabric is imported on first open, so it never touches SSR or the initial bundle.
// ════════════════════════════════════════════════════════════════════════
const DESIGN_PRESETS = [
  { id: 'article', label: 'Article 16:9', w: 1200, h: 675 },
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350 },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'a4', label: 'A4', w: 794, h: 1123 },
]
const ALIGN_BUTTONS = [
  ['left', 'i-lucide-align-start-vertical', 'Align left'],
  ['hcenter', 'i-lucide-align-center-vertical', 'Center horizontally'],
  ['right', 'i-lucide-align-end-vertical', 'Align right'],
  ['top', 'i-lucide-align-start-horizontal', 'Align top'],
  ['vcenter', 'i-lucide-align-center-horizontal', 'Center vertically'],
  ['bottom', 'i-lucide-align-end-horizontal', 'Align bottom'],
]
const ORDER_BUTTONS = [
  ['front', 'i-lucide-bring-to-front', 'Bring to front'],
  ['forward', 'i-lucide-arrow-up', 'Forward'],
  ['backward', 'i-lucide-arrow-down', 'Backward'],
  ['back', 'i-lucide-send-to-back', 'Send to back'],
]
const DESIGN_EXTRA = ['rcId', 'rcFileId', 'rcMeta']
const ORIGIN = { originX: 'left', originY: 'top' }   // explicit: fabric 6 and 7 differ on the default origin
const DESIGN_FONT = 'Inter, "Noto Sans Khmer", system-ui, sans-serif'
const EXT_COLORS = {
  PDF: '#ef4444', DOC: '#2563eb', DOCX: '#2563eb', XLS: '#16a34a', XLSX: '#16a34a', CSV: '#16a34a',
  PPT: '#f97316', PPTX: '#f97316', ZIP: '#a16207', RAR: '#a16207', MP4: '#7c3aed', MOV: '#7c3aed',
  WEBM: '#7c3aed', MP3: '#db2777', WAV: '#db2777', TXT: '#64748b',
}

const designOpen = ref(false)
const designDoc = ref(null)        // saved design to reopen
const designImage = ref('')        // or: an existing image to start from
const designTarget = ref(null)     // { pos, src, fileId } when editing an image already in the article
const designStage = ref(null)
const designCanvasEl = ref(null)
const designRoot = ref(null)
const designFileInput = ref(null)
const designPage = reactive({ w: 1200, h: 675, bg: '#ffffff', preset: 'article' })
const designUi = reactive({
  ready: false, busy: false, zoom: 1, canUndo: false, canRedo: false,
  alignTo: 'page', snap: true, attach: true, msg: '', expanded: false,
})
// Screen rectangle of the image being edited (the canvas is drawn exactly over it).
const designRect = reactive({ left: 0, top: 0, width: 0, height: 0 })
const designPlaceholder = ref(null)   // record of the blank PNG inserted for a brand-new design
let rafId = 0
const designSel = reactive({ n: 0, kind: '', x: 0, y: 0, w: 0, h: 0, fill: '#8c52ff', opacity: 100, lock: true, hasFill: false })

// Not reactive on purpose — fabric objects must stay out of Vue's proxies.
let fabricMod = null
let fc = null
let history = []
let historyAt = -1
let restoring = false
let commitTimer = null
const designFiles = new Map()      // rcFileId → File (documents / videos placed on the canvas)

const clampNum = (n, min, max) => Math.min(max, Math.max(min, n))
const objs = () => (fc ? fc.getObjects().filter(o => !o.rcGuide) : [])

// Scene-space bounding box (rotation-aware). getCoords() is absolute, also for objects inside a selection.
function box(o) {
  const pts = o.getCoords()
  const xs = pts.map(p => p.x)
  const ys = pts.map(p => p.y)
  const l = Math.min(...xs), r = Math.max(...xs), t = Math.min(...ys), b = Math.max(...ys)
  return { l, r, t, b, cx: (l + r) / 2, cy: (t + b) / 2, w: r - l, h: b - t }
}
function shift(o, dx, dy) {
  if (!dx && !dy) return
  o.set({ left: o.left + dx, top: o.top + dy })
  o.setCoords()
}
function selected() {
  const a = fc?.getActiveObject()
  if (!a) return []
  return a instanceof fabricMod.ActiveSelection ? [...a.getObjects()] : [a]
}
function reselect(list) {
  if (!list.length) return
  fc.setActiveObject(list.length > 1 ? new fabricMod.ActiveSelection(list, { canvas: fc }) : list[0])
  fc.requestRenderAll()
}

// ── Open / close ─────────────────────────────────────────────────────────
// The canvas opens IN PLACE: it is drawn exactly over the image in the article
// (follows scroll / resize). "Expand" switches to a full-screen workspace.
//   openDesign()          → new blank design: a placeholder image is inserted at the cursor
//   openDesign({ pos })   → edit the image at `pos` (its saved design, else the image itself)
function findPosByFileId(fileId) {
  let found = null
  editorInstance.value?.state.doc.descendants((n, p) => {
    if (found != null) return false
    if (n.type.name === 'image' && n.attrs.fileId === fileId) { found = p; return false }
    return true
  })
  return found
}

// Current document position of the image being edited (it can move while editing).
function resolveTargetPos() {
  const ed = editorInstance.value
  const t = designTarget.value
  if (!ed || !t) return null
  const hit = n => n?.type.name === 'image' && (t.fileId ? n.attrs.fileId === t.fileId : n.attrs.src === t.src)
  if (hit(ed.state.doc.nodeAt(t.pos))) return t.pos
  let found = null
  ed.state.doc.descendants((n, p) => {
    if (found != null) return false
    if (hit(n)) { found = p; return false }
    return true
  })
  if (found != null) t.pos = found
  return found
}

function blankPlaceholder(w, h, bg) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')
  x.fillStyle = bg
  x.fillRect(0, 0, w, h)
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      const file = new File([blob], 'design.png', { type: 'image/png', lastModified: Date.now() })
      resolve(filesApi.addLocalFile(file, { kind: 'image' }))
    }, 'image/png')
  })
}

async function openDesign({ pos = null } = {}) {
  if (!canvasEnabled.value || designOpen.value) return
  const editor = editorInstance.value
  if (!editor) return
  designTarget.value = null
  designDoc.value = null
  designImage.value = ''
  designPlaceholder.value = null
  Object.assign(designUi, { msg: '', ready: false, expanded: false })
  designFiles.clear()

  const o = props.canvasOptions
  designPage.w = o.width ?? 1200
  designPage.h = o.height ?? 675
  designPage.bg = o.background ?? '#ffffff'

  let node = pos != null ? editor.state.doc.nodeAt(pos) : null
  if (node?.type.name !== 'image') {
    // New design → insert a blank image first, then edit that image in place.
    const record = await blankPlaceholder(designPage.w, designPage.h, designPage.bg)
    if (!record) return
    designPlaceholder.value = record
    pos = findPosByFileId(record.id)
    node = pos != null ? editor.state.doc.nodeAt(pos) : null
    if (!node) return
  }
  else {
    designDoc.value = filesApi.designFor(node)
    if (!designDoc.value) designImage.value = node.attrs.src
    // A stretched image would not match the page's aspect ratio.
    if (node.attrs.height) editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, 'height', null))
  }
  designTarget.value = { pos, src: node.attrs.src, fileId: node.attrs.fileId }
  designPage.preset = DESIGN_PRESETS.find(p => p.w === designPage.w && p.h === designPage.h)?.id ?? 'custom'
  designOpen.value = true
  await nextTick()
  editor.view.nodeDOM(pos)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  trackRect()
  await initDesign()
}

// Keep the canvas glued to the image: follows scrolling, resizing and layout shifts.
function trackRect() {
  cancelAnimationFrame(rafId)
  const tick = () => {
    if (!designOpen.value) return
    if (!designUi.expanded) {
      const pos = resolveTargetPos()
      const box = pos != null ? editorInstance.value?.view.nodeDOM(pos)?.querySelector?.('.r-media__box') : null
      if (box) {
        const r = box.getBoundingClientRect()
        if (r.left !== designRect.left || r.top !== designRect.top || r.width !== designRect.width || r.height !== designRect.height) {
          Object.assign(designRect, { left: r.left, top: r.top, width: r.width, height: r.height })
        }
      }
      if (fc && designRect.width && Math.abs(designUi.zoom - designRect.width / designPage.w) > 0.001) setZoom(designRect.width / designPage.w)
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

// Dock (header + tools): above the image, or below it when there is no room.
const designDockStyle = computed(() => {
  if (designUi.expanded) return {}
  const below = designRect.top < 170
  const left = Math.max(8, Math.min(designRect.left, (typeof window === 'undefined' ? 1200 : window.innerWidth) - 760))
  return below
    ? { left: `${left}px`, top: `min(${Math.round(designRect.top + designRect.height + 8)}px, calc(100vh - 190px))` }
    : { left: `${left}px`, bottom: `${(typeof window === 'undefined' ? 0 : window.innerHeight) - Math.round(designRect.top) + 8}px` }
})
const designFrameStyle = computed(() => (designUi.expanded ? {} : {
  left: `${designRect.left}px`, top: `${designRect.top}px`, width: `${designRect.width}px`, height: `${designRect.height}px`,
}))

function closeDesign({ cancelled = false } = {}) {
  clearTimeout(commitTimer)
  cancelAnimationFrame(rafId)
  // Cancelled a brand-new design → remove the placeholder image again.
  if (cancelled && designPlaceholder.value) {
    const pos = resolveTargetPos()
    if (pos != null) filesApi.deleteFile(designPlaceholder.value, { pos })
  }
  designOpen.value = false
  designTarget.value = null
  designDoc.value = null
  designImage.value = ''
  designPlaceholder.value = null
  designUi.expanded = false
  disposeCanvas()
}

function disposeCanvas() {
  const c = fc
  fc = null
  history = []
  historyAt = -1
  if (c) Promise.resolve(c.dispose?.()).catch(() => {})
}

async function initDesign() {
  try {
    fabricMod ??= await import('fabric')
    if (!designOpen.value || !designCanvasEl.value) return
    const { Canvas } = fabricMod
    fc = new Canvas(designCanvasEl.value, {
      width: designPage.w, height: designPage.h, backgroundColor: designPage.bg,
      preserveObjectStacking: true, uniformScaling: true, selectionColor: 'rgba(140,82,255,.12)',
      selectionBorderColor: '#8c52ff', targetFindTolerance: 6,
    })
    fc.on('object:added', e => styleObject(e.target))
    fc.on('selection:created', syncSelection)
    fc.on('selection:updated', syncSelection)
    fc.on('selection:cleared', syncSelection)
    fc.on('object:moving', (e) => { snapMoving(e.target); syncSelection() })
    fc.on('object:scaling', syncSelection)
    fc.on('object:rotating', syncSelection)
    fc.on('object:modified', () => { syncSelection(); commit() })
    fc.on('text:changed', () => commitSoon())
    fc.on('mouse:up', clearGuides)

    const doc = designDoc.value
    if (doc?.json) {
      restoring = true
      Object.assign(designPage, { w: doc.w, h: doc.h, bg: doc.bg, preset: 'custom' })
      await fc.loadFromJSON(doc.json)
      restoring = false
    }
    else if (designImage.value) {
      try {
        const img = await fabricMod.FabricImage.fromURL(designImage.value, { crossOrigin: 'anonymous' })
        const k = Math.min(1, 2400 / Math.max(img.width, img.height))
        Object.assign(designPage, { w: Math.round(img.width * k), h: Math.round(img.height * k), preset: 'custom' })
        img.set({ ...ORIGIN, left: 0, top: 0, scaleX: k, scaleY: k })
        fc.add(img)
      }
      catch { designUi.msg = 'Could not load the image (it may block cross-origin access). Starting with a blank page.' }
    }
    applySize()
    fit()
    history = []
    historyAt = -1
    commit(true)
    designUi.ready = true
    designRoot.value?.focus({ preventScroll: true })
  }
  catch (e) {
    designUi.msg = e?.message || 'Could not start the canvas'
    emit('upload-error', { message: designUi.msg, type: 'design', error: e })
  }
}

function styleObject(o) {
  if (!o || o.rcGuide) return
  o.set({
    cornerStyle: 'circle', cornerSize: 11, transparentCorners: false, cornerColor: '#ffffff',
    cornerStrokeColor: '#8c52ff', borderColor: '#8c52ff', borderScaleFactor: 1.5,
  })
  // Images and file cards keep their ratio: corners only (like Canva).
  if (o instanceof fabricMod.FabricImage || o.rcMeta) o.setControlsVisibility?.({ mt: false, mb: false, ml: false, mr: false })
  o.rcId ??= uid()
}

// ── Page size / zoom ─────────────────────────────────────────────────────
function applySize() {
  if (!fc) return
  const z = designUi.zoom
  fc.setZoom(z)
  fc.setDimensions({ width: designPage.w * z, height: designPage.h * z })
  fc.set({ backgroundColor: designPage.bg })
  fc.requestRenderAll()
}
function setZoom(z) {
  designUi.zoom = clampNum(z, 0.05, 4)
  applySize()
}
function fit() {
  if (!designUi.expanded) {
    if (designRect.width) setZoom(designRect.width / designPage.w)
    return
  }
  const el = designStage.value
  if (!el) return
  setZoom(Math.min((el.clientWidth - 80) / designPage.w, (el.clientHeight - 80) / designPage.h, 1.5))
}
function setPageSize(w, h) {
  designPage.w = clampNum(Math.round(w) || designPage.w, 100, 4000)
  designPage.h = clampNum(Math.round(h) || designPage.h, 100, 4000)
  designPage.preset = DESIGN_PRESETS.find(p => p.w === designPage.w && p.h === designPage.h)?.id ?? 'custom'
  applySize()
  fit()
  commit()
}
function onPreset(id) {
  const p = DESIGN_PRESETS.find(x => x.id === id)
  if (p) setPageSize(p.w, p.h)
}
function setBackground(color) {
  designPage.bg = color
  applySize()
  commitSoon()
}
// Run `fn` with the viewport at 1:1, so exports are page-sized whatever the zoom.
function unzoomed(fn) {
  fc.setZoom(1)
  fc.setDimensions({ width: designPage.w, height: designPage.h })
  try { return fn() }
  finally { applySize() }
}

// ── History ──────────────────────────────────────────────────────────────
const snapshot = () => JSON.stringify({ w: designPage.w, h: designPage.h, bg: designPage.bg, c: fc.toObject(DESIGN_EXTRA) })
function commit(force = false) {
  clearTimeout(commitTimer)
  if (!fc || restoring) return
  const s = snapshot()
  if (!force && history[historyAt] === s) return
  history = history.slice(0, historyAt + 1)
  history.push(s)
  if (history.length > 60) history.shift()
  historyAt = history.length - 1
  syncHistory()
}
function commitSoon() {
  clearTimeout(commitTimer)
  commitTimer = setTimeout(commit, 400)
}
const syncHistory = () => {
  designUi.canUndo = historyAt > 0
  designUi.canRedo = historyAt < history.length - 1
}
async function restore(index) {
  if (!fc || index < 0 || index >= history.length) return
  restoring = true
  try {
    const s = JSON.parse(history[index])
    Object.assign(designPage, { w: s.w, h: s.h, bg: s.bg })
    designPage.preset = DESIGN_PRESETS.find(p => p.w === s.w && p.h === s.h)?.id ?? 'custom'
    await fc.loadFromJSON(s.c)
    historyAt = index
    applySize()
  }
  finally { restoring = false; syncHistory(); syncSelection() }
}
const undo = () => { clearTimeout(commitTimer); commit(); return restore(historyAt - 1) }
const redo = () => restore(historyAt + 1)

// ── Selection → side panel ───────────────────────────────────────────────
function kindOf(o) {
  const F = fabricMod
  if (o.rcMeta?.card) return 'file'
  if (o instanceof F.FabricImage) return 'image'
  if (o instanceof F.Textbox) return 'text'
  if (o instanceof F.Line) return 'line'
  if (o instanceof F.Rect) return 'shape'
  return 'object'
}
function syncSelection() {
  const list = selected()
  designSel.n = list.length
  if (!list.length) { designSel.kind = ''; return }
  const a = fc.getActiveObject()
  const b = box(a)
  designSel.kind = list.length > 1 ? 'multi' : kindOf(list[0])
  designSel.x = Math.round(b.l)
  designSel.y = Math.round(b.t)
  designSel.w = Math.round(b.w)
  designSel.h = Math.round(b.h)
  designSel.opacity = Math.round((a.opacity ?? 1) * 100)
  const first = list[0]
  const color = first instanceof fabricMod.Line ? first.stroke : first.fill
  designSel.hasFill = typeof color === 'string' && !(first instanceof fabricMod.FabricImage) && !first.rcMeta
  if (designSel.hasFill) designSel.fill = /^#[0-9a-f]{6}$/i.test(color) ? color : designSel.fill
}

// ── Snap guides (page edges / centre / other objects) ────────────────────
let guides = []
function clearGuides() {
  if (!fc || !guides.length) return
  guides.forEach(g => fc.remove(g))
  guides = []
  fc.requestRenderAll()
}
function snapMoving(o) {
  clearGuides()
  if (!designUi.snap || !o) return
  const th = 6 / fc.getZoom()
  const skip = new Set([o, ...(o.getObjects?.() ?? [])])
  const xs = [0, designPage.w / 2, designPage.w]
  const ys = [0, designPage.h / 2, designPage.h]
  for (const other of objs()) {
    if (skip.has(other) || other.visible === false) continue
    const q = box(other)
    xs.push(q.l, q.cx, q.r)
    ys.push(q.t, q.cy, q.b)
  }
  const b = box(o)
  const nearest = (mine, targets) => {
    let best = null
    for (const m of mine) for (const t of targets) {
      const d = t - m
      if (Math.abs(d) <= th && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, at: t }
    }
    return best
  }
  const sx = nearest([b.l, b.cx, b.r], xs)
  const sy = nearest([b.t, b.cy, b.b], ys)
  if (sx || sy) shift(o, sx?.d ?? 0, sy?.d ?? 0)
  const z = fc.getZoom()
  const line = (pts) => {
    const g = new fabricMod.Line(pts, {
      stroke: '#ff3b7f', strokeWidth: 1 / z, selectable: false, evented: false,
      excludeFromExport: true, rcGuide: true,
    })
    guides.push(g)
    fc.add(g)
  }
  if (sx) line([sx.at, 0, sx.at, designPage.h])
  if (sy) line([0, sy.at, designPage.w, sy.at])
}

// ── Align / distribute / size / position ─────────────────────────────────
function align(mode) {
  const list = selected()
  if (!list.length) return
  fc.discardActiveObject()   // work on absolute coordinates, then re-select
  const boxes = list.map(box)
  const U = {
    l: Math.min(...boxes.map(b => b.l)), r: Math.max(...boxes.map(b => b.r)),
    t: Math.min(...boxes.map(b => b.t)), b: Math.max(...boxes.map(b => b.b)),
  }
  U.cx = (U.l + U.r) / 2
  U.cy = (U.t + U.b) / 2
  const toObjects = list.length > 1 && designUi.alignTo === 'objects'
  const ref = toObjects ? U : { l: 0, r: designPage.w, t: 0, b: designPage.h, cx: designPage.w / 2, cy: designPage.h / 2 }
  list.forEach((o, i) => {
    const m = toObjects ? boxes[i] : U   // page mode moves the selection as one unit
    const dx = { left: ref.l - m.l, hcenter: ref.cx - m.cx, right: ref.r - m.r }[mode] ?? 0
    const dy = { top: ref.t - m.t, vcenter: ref.cy - m.cy, bottom: ref.b - m.b }[mode] ?? 0
    shift(o, dx, dy)
  })
  reselect(list)
  syncSelection()
  commit()
}
function distribute(axis) {
  const list = selected()
  if (list.length < 3) return
  fc.discardActiveObject()
  const x = axis === 'x'
  const items = list.map(o => ({ o, b: box(o) })).sort((a, b) => (x ? a.b.l - b.b.l : a.b.t - b.b.t))
  const start = x ? items[0].b.l : items[0].b.t
  const end = x ? items.at(-1).b.r : items.at(-1).b.b
  const total = items.reduce((s, i) => s + (x ? i.b.w : i.b.h), 0)
  const gap = (end - start - total) / (items.length - 1)
  let cursor = start
  for (const { o, b } of items) {
    shift(o, x ? cursor - b.l : 0, x ? 0 : cursor - b.t)
    cursor += (x ? b.w : b.h) + gap
  }
  reselect(list)
  syncSelection()
  commit()
}
function setDimension(axis, value) {
  const o = fc?.getActiveObject()
  const v = Number(value)
  if (!o || !(v > 0)) return
  if (designSel.lock) (axis === 'w' ? o.scaleToWidth(v) : o.scaleToHeight(v))
  else o.set(axis === 'w' ? 'scaleX' : 'scaleY', v / (axis === 'w' ? o.width : o.height))
  o.setCoords()
  fc.requestRenderAll()
  syncSelection()
  commit()
}
function setPosition(axis, value) {
  const o = fc?.getActiveObject()
  const v = Number(value)
  if (!o || Number.isNaN(v)) return
  const b = box(o)
  shift(o, axis === 'x' ? v - b.l : 0, axis === 'y' ? v - b.t : 0)
  fc.requestRenderAll()
  syncSelection()
  commit()
}
function nudge(dx, dy) {
  const o = fc?.getActiveObject()
  if (!o) return
  shift(o, dx, dy)
  fc.requestRenderAll()
  syncSelection()
  commitSoon()
}

// ── Style / arrange ──────────────────────────────────────────────────────
function setFill(color) {
  designSel.fill = color
  for (const o of selected()) {
    if (o instanceof fabricMod.FabricImage || o.rcMeta) continue
    o.set(o instanceof fabricMod.Line ? 'stroke' : 'fill', color)
  }
  fc.requestRenderAll()
  commitSoon()
}
function setOpacity(percent) {
  designSel.opacity = percent
  fc.getActiveObject()?.set('opacity', percent / 100)
  fc.requestRenderAll()
  commitSoon()
}
function flip() {
  for (const o of selected()) o.set('flipX', !o.flipX)
  fc.requestRenderAll()
  commit()
}
function arrange(op) {
  const list = selected()
  if (!list.length) return
  fc.discardActiveObject()
  const fn = { front: 'bringObjectToFront', back: 'sendObjectToBack', forward: 'bringObjectForward', backward: 'sendObjectBackwards' }[op]
  const ordered = [...list].sort((a, b) => fc.getObjects().indexOf(a) - fc.getObjects().indexOf(b))
  for (const o of (op === 'front' || op === 'forward' ? ordered : ordered.reverse())) fc[fn](o)
  reselect(list)
  commit()
}
async function duplicate() {
  const list = selected()
  if (!list.length) return
  fc.discardActiveObject()
  const copies = []
  for (const o of list) {
    const c = await o.clone(DESIGN_EXTRA)
    c.rcId = undefined
    shift(c, 24, 24)
    fc.add(c)
    copies.push(c)
  }
  reselect(copies)
  commit()
}
function removeSelected() {
  const list = selected()
  if (!list.length) return
  fc.discardActiveObject()
  list.forEach(o => fc.remove(o))
  fc.requestRenderAll()
  commit()
}
function selectAll() {
  fc.discardActiveObject()
  reselect(objs().filter(o => o.selectable !== false))
}

// ── Add content ──────────────────────────────────────────────────────────
// `fit`: fraction of the page an object may fill when first placed (0 = keep size).
function place(o, { fit: k = 0 } = {}) {
  const empty = objs().length === 0
  o.set({ ...ORIGIN })
  if (k) {
    const s = Math.min((designPage.w * (empty ? 1 : k)) / o.width, (designPage.h * (empty ? 1 : k)) / o.height, 1)
    o.set({ scaleX: s, scaleY: s })
  }
  o.setCoords()
  const b = box(o)
  const stagger = empty ? 0 : (objs().length % 6) * 18
  shift(o, designPage.w / 2 - b.cx + stagger, designPage.h / 2 - b.cy + stagger)
  fc.add(o)
  fc.setActiveObject(o)
  fc.requestRenderAll()
  syncSelection()
  commit()
}

const readAsDataURL = file => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(r.error)
  r.readAsDataURL(file)
})

function videoFrame(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    const finish = (fn, value) => { URL.revokeObjectURL(url); fn(value) }
    v.muted = true
    v.preload = 'metadata'
    v.onloadeddata = () => { v.currentTime = Math.min(0.1, (v.duration || 1) / 2) }
    v.onseeked = () => {
      try {
        const s = Math.min(1, 1280 / v.videoWidth)
        const c = document.createElement('canvas')
        c.width = Math.round(v.videoWidth * s)
        c.height = Math.round(v.videoHeight * s)
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
        finish(resolve, c.toDataURL('image/jpeg', 0.82))
      }
      catch (e) { finish(reject, e) }
    }
    v.onerror = () => finish(reject, new Error('Cannot read video'))
    setTimeout(() => finish(reject, new Error('Video timed out')), 8000)
    v.src = url
  })
}

// Card for any non-image file: coloured type badge + name + size.
function fileCard(file) {
  const F = fabricMod
  const ext = (file.name.split('.').pop() || 'file').slice(0, 4).toUpperCase()
  const color = EXT_COLORS[ext] ?? '#6366f1'
  const name = file.name.length > 28 ? `${file.name.slice(0, 25)}…` : file.name
  const card = new F.Rect({ ...ORIGIN, left: 0, top: 0, width: 300, height: 92, rx: 14, ry: 14, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 })
  const badge = new F.Rect({ ...ORIGIN, left: 14, top: 14, width: 52, height: 64, rx: 8, ry: 8, fill: color })
  const glyph = new F.Path('M0 0h14l6 6v18H0z M14 0v6h6', {
    ...ORIGIN, left: 30, top: 20, fill: 'rgba(255,255,255,.92)', stroke: color, strokeWidth: 1,
  })
  const tag = new F.Textbox(ext, { ...ORIGIN, left: 14, top: 54, width: 52, fontSize: 13, fontWeight: 700, fill: '#ffffff', textAlign: 'center', fontFamily: DESIGN_FONT })
  const title = new F.Textbox(name, { ...ORIGIN, left: 82, top: 22, width: 200, fontSize: 16, fontWeight: 600, fill: '#111827', fontFamily: DESIGN_FONT })
  const sub = new F.Textbox(`${ext} · ${formatBytes(file.size)}`, { ...ORIGIN, left: 82, top: 52, width: 200, fontSize: 13, fill: '#6b7280', fontFamily: DESIGN_FONT })
  return new F.Group([card, badge, glyph, tag, title, sub], {
    ...ORIGIN, subTargetCheck: false, rcMeta: { card: true, name: file.name, size: file.size, type: file.type },
  })
}

async function addDesignFile(file) {
  if (!fc) return
  const kind = detectKind(file.type, file.name)
  try {
    if (kind === 'image') {
      const small = await compressImageFile(file, { quality: 0.86, maxPx: 2000 }).catch(() => file)
      const img = await fabricMod.FabricImage.fromURL(await readAsDataURL(small))
      img.set({ rcMeta: { name: file.name, size: file.size, type: file.type } })
      place(img, { fit: 0.6 })
      return
    }
    const id = uid()
    designFiles.set(id, file)
    let obj = null
    if (kind === 'video') {
      try {
        obj = await fabricMod.FabricImage.fromURL(await videoFrame(file))
        obj.set({ rcMeta: { name: file.name, size: file.size, type: file.type, video: true } })
        place(obj, { fit: 0.6 })
      }
      catch { obj = null }
    }
    if (!obj) { obj = fileCard(file); place(obj) }
    obj.set({ rcFileId: id })
    syncSelection()
  }
  catch (e) {
    designUi.msg = `${file.name}: ${e?.message || 'could not be added'}`
  }
}
async function addDesignFiles(list) {
  for (const f of Array.from(list)) await addDesignFile(f)
}
function onDesignPick(e) {
  addDesignFiles(e.target.files ?? [])
  e.target.value = ''
}
const onDesignDrop = e => addDesignFiles(e.dataTransfer?.files ?? [])
function onDesignPaste(e) {
  const list = Array.from(e.clipboardData?.files ?? [])
  if (!list.length) return
  e.preventDefault()
  addDesignFiles(list)
}

function addText() {
  const t = new fabricMod.Textbox('Double-click to edit', {
    ...ORIGIN, width: designPage.w * 0.5, fontSize: Math.round(designPage.w / 22), fill: '#111827', fontFamily: DESIGN_FONT, fontWeight: 600,
  })
  place(t)
}
function addRect() {
  place(new fabricMod.Rect({ ...ORIGIN, width: Math.round(designPage.w / 4), height: Math.round(designPage.h / 4), fill: '#8c52ff', rx: 12, ry: 12 }))
}
function addLine() {
  const w = Math.round(designPage.w / 3)
  place(new fabricMod.Line([0, 0, w, 0], { ...ORIGIN, stroke: '#111827', strokeWidth: 6, strokeLineCap: 'round' }))
}

// ── Keyboard ─────────────────────────────────────────────────────────────
function onDesignKey(e) {
  if (!fc) return
  const t = e.target
  if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
  if (fc.getActiveObject()?.isEditing) return
  const mod = e.ctrlKey || e.metaKey
  const k = e.key.toLowerCase()
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
  else if (mod && k === 'y') { e.preventDefault(); redo() }
  else if (mod && k === 'd') { e.preventDefault(); duplicate() }
  else if (mod && k === 'a') { e.preventDefault(); selectAll() }
  else if (k === 'delete' || k === 'backspace') { e.preventDefault(); removeSelected() }
  else if (k === 'escape') { fc.discardActiveObject(); fc.requestRenderAll() }
  else if (k.startsWith('arrow')) {
    e.preventDefault()
    const s = e.shiftKey ? 10 : 1
    nudge({ arrowleft: -s, arrowright: s }[k] ?? 0, { arrowup: -s, arrowdown: s }[k] ?? 0)
  }
}

// ── Insert into the article ──────────────────────────────────────────────
async function insertDesign() {
  if (!fc || designUi.busy) return
  designUi.busy = true
  designUi.msg = ''
  try {
    clearGuides()
    fc.discardActiveObject()
    const canvas = unzoomed(() => fc.toCanvasElement(1))
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png'))
    const file = new File([blob], `design-${Date.now()}.png`, { type: 'image/png', lastModified: Date.now() })
    const problem = filesApi.validate(file, 'image')
    if (problem) { designUi.msg = problem.message; return }

    const design = { version: 1, w: designPage.w, h: designPage.h, bg: designPage.bg, json: fc.toObject(DESIGN_EXTRA) }
    const onCanvas = new Set(objs().map(o => o.rcFileId).filter(Boolean))
    const attach = designUi.attach ? [...designFiles].filter(([id]) => onCanvas.has(id)).map(([, f]) => f) : []

    const target = designTarget.value && { ...designTarget.value, pos: resolveTargetPos() ?? designTarget.value.pos }
    const record = filesApi.addLocalFile(file, { kind: 'image', replaceTarget: target, design })
    if (!record) return
    if (strategy.value === 'immediate') filesApi.uploadRecord(record.id).catch(() => {})
    if (attach.length) await filesApi.addFiles(attach)   // documents / videos follow the image as file blocks
    emit('design-saved', { record, design })
    closeDesign()
  }
  catch (e) {
    designUi.msg = e?.name === 'SecurityError'
      ? 'An image on the canvas blocks cross-origin export (CORS). Re-add it from your computer or allow CORS on its server.'
      : (e?.message || 'Export failed')
  }
  finally { designUi.busy = false }
}

// Paste / resize listeners only while open (page scroll stays free: the canvas follows the image).
const onWindowResize = () => fit()
watch(() => designUi.expanded, async (full) => {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = full ? 'hidden' : ''
  await nextTick()
  fit()
})
watch(designOpen, (open) => {
  if (typeof document === 'undefined') return
  if (!open) document.documentElement.style.overflow = ''
  const method = open ? 'addEventListener' : 'removeEventListener'
  window[method]('paste', onDesignPaste)
  window[method]('resize', onWindowResize)
})
onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = ''
  window.removeEventListener('paste', onDesignPaste)
  window.removeEventListener('resize', onWindowResize)
  clearTimeout(commitTimer)
  cancelAnimationFrame(rafId)
  disposeCanvas()
})

// ─── Custom handlers ────────────────────────────────────────────────────────
const uploadHandler = (kind, nodeName) => ({
  canExecute: editor => !!editor?.isEditable,
  execute: (editor) => { openFilePicker('insert', null, kind); return editor.chain().focus() },
  isActive: editor => editor.isActive(nodeName),
})
const allHandlers = computed(() => ({
  imageUpload: uploadHandler('image', 'image'),
  videoUpload: uploadHandler('video', 'videoBlock'),
  fileUpload: uploadHandler('file', 'fileBlock'),
  design: {
    canExecute: editor => !!editor?.isEditable && canvasEnabled.value,
    execute: (editor) => { openDesign(); return editor.chain().focus() },
    isActive: () => false,
  },
  ...(ai?.handlers ?? {}),
  ...props.extraHandlers,
}))

// ════════════════════════════════════════════════════════════════════════
// Toolbars
// ════════════════════════════════════════════════════════════════════════
const marksGroup = () => ([
  { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
  { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
  { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
  { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
  { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Code' } },
])

const alignGroup = () => ([{
  icon: 'i-lucide-align-justify',
  tooltip: { text: 'Text Align' },
  content: { align: 'end' },
  items: [
    { kind: 'textAlign', align: 'left', icon: 'i-lucide-align-left', label: 'Align Left' },
    { kind: 'textAlign', align: 'center', icon: 'i-lucide-align-center', label: 'Align Center' },
    { kind: 'textAlign', align: 'right', icon: 'i-lucide-align-right', label: 'Align Right' },
    { kind: 'textAlign', align: 'justify', icon: 'i-lucide-align-justify', label: 'Align Justify' },
  ],
}])

function buildAiGroup() {
  if (!ai) return []
  return [[{
    icon: 'i-lucide-sparkles',
    label: 'Improve',
    variant: 'soft',
    loading: ai.isLoading.value,
    content: { align: 'start' },
    items: [
      { kind: 'aiFix', icon: 'i-lucide-spell-check', label: 'Fix spelling & grammar' },
      { kind: 'aiExtend', icon: 'i-lucide-unfold-vertical', label: 'Extend text' },
      { kind: 'aiReduce', icon: 'i-lucide-fold-vertical', label: 'Reduce text' },
      { kind: 'aiSimplify', icon: 'i-lucide-lightbulb', label: 'Simplify text' },
      { kind: 'aiContinue', icon: 'i-lucide-text', label: 'Continue sentence' },
      { kind: 'aiSummarize', icon: 'i-lucide-list', label: 'Summarize' },
      {
        icon: 'i-lucide-languages',
        label: 'Translate',
        children: props.aiLanguages.map(language => ({ kind: 'aiTranslate', language, label: language })),
      },
    ],
  }]]
}

// ─── Word-style text tools ──────────────────────────────────────────────────
const run = fn => fn(ed().chain().focus()).run()
const FONT_FAMILIES = [
  ['Default', null],
  ['Sans (Inter)', 'Inter, system-ui, sans-serif'],
  ['Serif (Georgia)', 'Georgia, "Times New Roman", serif'],
  ['Mono', 'ui-monospace, "SF Mono", Menlo, monospace'],
  ['Khmer (Noto Sans Khmer)', '"Noto Sans Khmer", "Khmer OS", sans-serif'],
  ['Khmer (Battambang)', 'Battambang, "Noto Sans Khmer", sans-serif'],
]
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 30, 36, 48, 64]
const textStyleGroup = () => ([
  {
    icon: 'i-lucide-a-large-small',
    tooltip: { text: 'Font' },
    content: { align: 'start' },
    items: FONT_FAMILIES.map(([label, value]) => ({
      label,
      onSelect: () => run(c => (value ? c.setFontFamily(value) : c.unsetFontFamily())),
    })),
  },
  {
    icon: 'i-lucide-text-cursor-input',
    tooltip: { text: 'Font size' },
    content: { align: 'start' },
    items: [
      ...FONT_SIZES.map(n => ({ label: `${n}`, onSelect: () => run(c => c.setFontSize(`${n}px`)) })),
      { label: 'Default size', onSelect: () => run(c => c.unsetFontSize()) },
    ],
  },
  { slot: 'color', tooltip: { text: 'Text colour' } },
  { slot: 'highlight', tooltip: { text: 'Highlight' } },
])

// ─── Tables ─────────────────────────────────────────────────────────────────
const tableInsertItem = {
  icon: 'i-lucide-table',
  tooltip: { text: 'Table' },
  content: { align: 'start' },
  items: [
    { label: 'Insert 3 × 3 table', icon: 'i-lucide-table', onSelect: () => run(c => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true })) },
    { label: 'Insert 5 × 4 table', icon: 'i-lucide-table-2', onSelect: () => run(c => c.insertTable({ rows: 5, cols: 4, withHeaderRow: true })) },
  ],
}
const tableToolbarItems = [
  [
    { icon: 'i-lucide-between-horizontal-start', tooltip: { text: 'Row above' }, onClick: () => run(c => c.addRowBefore()) },
    { icon: 'i-lucide-between-horizontal-end', tooltip: { text: 'Row below' }, onClick: () => run(c => c.addRowAfter()) },
    { icon: 'i-lucide-between-vertical-start', tooltip: { text: 'Column left' }, onClick: () => run(c => c.addColumnBefore()) },
    { icon: 'i-lucide-between-vertical-end', tooltip: { text: 'Column right' }, onClick: () => run(c => c.addColumnAfter()) },
  ],
  [
    { icon: 'i-lucide-table-cells-merge', tooltip: { text: 'Merge cells' }, onClick: () => run(c => c.mergeCells()) },
    { icon: 'i-lucide-table-cells-split', tooltip: { text: 'Split cell' }, onClick: () => run(c => c.splitCell()) },
    { icon: 'i-lucide-table-properties', tooltip: { text: 'Header row' }, onClick: () => run(c => c.toggleHeaderRow()) },
  ],
  [
    { icon: 'i-lucide-rows-3', label: '−', tooltip: { text: 'Delete row' }, onClick: () => run(c => c.deleteRow()) },
    { icon: 'i-lucide-columns-3', label: '−', tooltip: { text: 'Delete column' }, onClick: () => run(c => c.deleteColumn()) },
    { icon: 'i-lucide-trash', tooltip: { text: 'Delete table' }, onClick: () => run(c => c.deleteTable()) },
  ],
]
const isCellSelection = state => state.selection?.constructor?.name === 'CellSelection'
const tableShouldShow = ({ editor, view, state }) =>
  editor.isEditable && editor.isActive('table') && view.hasFocus() && (state.selection.empty || isCellSelection(state))

const fixedToolbarItems = computed(() => {
  const o = opts.value
  const groups = [...buildAiGroup()]

  groups.push([
    { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Undo' } },
    { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Redo' } },
  ])

  groups.push([
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Headings' },
      content: { align: 'start' },
      items: [1, 2, 3, 4].map(level => ({ kind: 'heading', level, icon: `i-lucide-heading-${level}`, label: `Heading ${level}` })),
    },
    {
      icon: 'i-lucide-list',
      tooltip: { text: 'Lists' },
      content: { align: 'start' },
      items: [
        { kind: 'bulletList', icon: 'i-lucide-list', label: 'Bullet List' },
        { kind: 'orderedList', icon: 'i-lucide-list-ordered', label: 'Ordered List' },
      ],
    },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Blockquote' } },
    { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Code Block' } },
  ])

  groups.push(marksGroup())
  if (o.textStyle) groups.push(textStyleGroup())

  const insert = []
  if (o.link) insert.push({ slot: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } })
  if (o.imageUpload) insert.push({ kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: 'Image' } })
  if (o.videoUpload) insert.push({ kind: 'videoUpload', icon: 'i-lucide-video', tooltip: { text: 'Video' } })
  if (o.fileUpload) insert.push({ kind: 'fileUpload', icon: 'i-lucide-paperclip', tooltip: { text: 'File' } })
  if (canvasEnabled.value) insert.push({ kind: 'design', icon: 'i-lucide-palette', tooltip: { text: 'Design' } })
  if (o.table) insert.push(tableInsertItem)
  if (hasMediaUpload.value && o.mediaLibrary) {
    insert.push({ icon: 'i-lucide-images', tooltip: { text: 'Uploaded files' }, onClick: openLibrary })
  }
  if (insert.length) groups.push(insert)

  if (o.textAlign) groups.push(alignGroup())
  return groups
})

const bubbleToolbarItems = computed(() => {
  const o = opts.value
  const groups = [...buildAiGroup()]

  groups.push([{
    label: 'Turn into',
    trailingIcon: 'i-lucide-chevron-down',
    activeColor: 'neutral',
    activeVariant: 'ghost',
    tooltip: { text: 'Turn into' },
    content: { align: 'start' },
    ui: { label: 'text-xs' },
    items: [
      { type: 'label', label: 'Turn into' },
      { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
      ...[1, 2, 3].map(level => ({ kind: 'heading', level, icon: `i-lucide-heading-${level}`, label: `Heading ${level}` })),
      { kind: 'bulletList', icon: 'i-lucide-list', label: 'Bullet List' },
      { kind: 'orderedList', icon: 'i-lucide-list-ordered', label: 'Ordered List' },
      { kind: 'blockquote', icon: 'i-lucide-text-quote', label: 'Blockquote' },
      { kind: 'codeBlock', icon: 'i-lucide-square-code', label: 'Code Block' },
    ],
  }])

  groups.push(marksGroup())

  const insert = []
  if (o.link) insert.push({ slot: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } })
  if (o.imageUpload) insert.push({ kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: 'Image' } })
  if (insert.length) groups.push(insert)

  if (o.textAlign) groups.push(alignGroup())
  return groups
})

const bubbleShouldShow = ({ editor, view, state }) => {
  if (!editor.isEditable) return false
  if (MEDIA_NODE_TYPES.some(t => editor.isActive(t))) return false
  if (isCellSelection(state)) return false
  return view.hasFocus() && !state.selection.empty
}

// ─── Media bubble toolbar ───────────────────────────────────────────────────
// Everything is resolved lazily at click time. The old version captured the
// selection position while *rendering* the items, so Replace/Delete could act
// on a stale position.
function selectedMedia(editor) {
  const sel = editor.state.selection
  const node = sel.node
  return node && MEDIA_NODE_TYPES.includes(node.type.name) ? { node, pos: sel.from } : null
}

// Layout / size helpers — all resolve the selected node at click time.
const LAYOUT_BUTTONS = [
  ['left', 'i-lucide-align-left', 'Align left'],
  ['center', 'i-lucide-align-center', 'Align centre'],
  ['right', 'i-lucide-align-right', 'Align right'],
  ['float-left', 'i-lucide-panel-left', 'Wrap text — media on the left'],
  ['float-right', 'i-lucide-panel-right', 'Wrap text — media on the right'],
]
function setMediaAttrs(editor, attrs) {
  const media = selectedMedia(editor)
  if (!media) return
  editor.chain().focus().updateAttributes(media.node.type.name, attrs).run()
}
function mediaColumnWidth(editor) {
  const media = selectedMedia(editor)
  const dom = media ? editor.view.nodeDOM(media.pos) : null
  return dom?.parentElement?.clientWidth || editor.view.dom.clientWidth || 600
}
function setMediaPercent(editor, percent) {
  setMediaAttrs(editor, { width: Math.round(mediaColumnWidth(editor) * percent / 100), height: null })
}
function setMediaOriginal(editor) {
  const media = selectedMedia(editor)
  const el = media ? editor.view.nodeDOM(media.pos)?.querySelector('img, video') : null
  const natural = el?.naturalWidth || el?.videoWidth
  setMediaAttrs(editor, { width: natural ? Math.min(natural, mediaColumnWidth(editor)) : null, height: null })
}

function mediaToolbarItems(editor) {
  // Items are static on purpose: this bubble renders before the selection is known,
  // so everything is resolved (and guarded) at click time instead.
  return [
    LAYOUT_BUTTONS.map(([value, icon, text]) => ({
      icon,
      tooltip: { text },
      onClick: () => setMediaAttrs(editor, { layout: value }),
    })),
    [
      {
        icon: 'i-lucide-scaling',
        tooltip: { text: 'Size' },
        content: { align: 'start' },
        items: [
          ...[25, 50, 75, 100].map(p => ({ label: `${p}% of column`, onSelect: () => setMediaPercent(editor, p) })),
          { label: 'Original size', onSelect: () => setMediaOriginal(editor) },
          { label: 'Reset size', onSelect: () => setMediaAttrs(editor, { width: null, height: null }) },
        ],
      },
      ...(canvasEnabled.value ? [{
        icon: 'i-lucide-palette',
        tooltip: { text: 'Edit design (images)' },
        onClick: () => {
          const media = selectedMedia(editor)
          if (media?.node.type.name === 'image') openDesign({ pos: media.pos })
        },
      }] : []),
      {
        icon: 'i-lucide-download',
        tooltip: { text: 'Download' },
        onClick: () => {
          const media = selectedMedia(editor)
          const src = media && safeUrl(media.node.attrs.src)
          if (!src) return
          const a = document.createElement('a')
          a.href = src
          a.download = media.node.attrs.name || media.node.attrs.alt || ''
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          a.click()
        },
      },
      {
        icon: 'i-lucide-refresh-cw',
        tooltip: { text: 'Replace' },
        onClick: () => {
          const media = selectedMedia(editor)
          if (media) openFilePicker('replace', media.pos, NODE_TO_KIND[media.node.type.name])
        },
      },
    ],
    [
      {
        icon: 'i-lucide-trash',
        tooltip: { text: 'Delete' },
        onClick: () => {
          const media = selectedMedia(editor)
          if (!media) return
          const record = filesApi.recordForNode(media.node) ?? filesApi.untrackedRecord(media.node)
          filesApi.deleteFile(record, { pos: media.pos })
        },
      },
    ],
  ]
}

const mediaShouldShow = ({ editor, view }) =>
  editor.isEditable && MEDIA_NODE_TYPES.some(t => editor.isActive(t)) && view.hasFocus()

// ─── Slash menu ─────────────────────────────────────────────────────────────
const suggestionItems = computed(() => {
  const o = opts.value
  const insert = [{ type: 'label', label: 'Insert' }]
  if (o.mentionMenu) insert.push({ kind: 'mention', label: 'Mention', icon: 'i-lucide-at-sign' })
  if (o.emojiMenu) insert.push({ kind: 'emoji', label: 'Emoji', icon: 'i-lucide-smile-plus' })
  if (o.imageUpload) insert.push({ kind: 'imageUpload', label: 'Image', icon: 'i-lucide-image' })
  if (o.videoUpload) insert.push({ kind: 'videoUpload', label: 'Video', icon: 'i-lucide-video' })
  if (o.fileUpload) insert.push({ kind: 'fileUpload', label: 'File / Document', icon: 'i-lucide-paperclip' })
  if (canvasEnabled.value) insert.push({ kind: 'design', label: 'Design (canvas)', icon: 'i-lucide-palette' })
  insert.push({ kind: 'horizontalRule', label: 'Divider', icon: 'i-lucide-separator-horizontal' })

  return [[
    { type: 'label', label: 'Style' },
    { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
    ...[1, 2, 3].map(level => ({ kind: 'heading', level, label: `Heading ${level}`, icon: `i-lucide-heading-${level}` })),
    { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
    { kind: 'orderedList', label: 'Numbered List', icon: 'i-lucide-list-ordered' },
    { kind: 'blockquote', label: 'Blockquote', icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' },
  ], insert]
})

// ─── Drag handle ────────────────────────────────────────────────────────────
function insertBlockBelow(e, editor, handlers, onClick) {
  e.stopPropagation()
  const sel = onClick()
  handlers.suggestion?.execute(editor, { pos: sel?.pos }).run()
}

const turnIntoItems = (editor) => {
  const type = selectedNode.value?.node?.type
  if (!type) return []
  const pos = selectedNode.value?.pos
  const label = type.charAt(0).toUpperCase() + type.slice(1)

  return mapEditorItems(editor, [
    [
      { type: 'label', label },
      {
        label: 'Turn into',
        icon: 'i-lucide-repeat-2',
        children: [
          { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
          ...[1, 2, 3, 4].map(level => ({ kind: 'heading', level, label: `Heading ${level}`, icon: `i-lucide-heading-${level}` })),
          { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
          { kind: 'orderedList', label: 'Ordered List', icon: 'i-lucide-list-ordered' },
          { kind: 'blockquote', label: 'Blockquote', icon: 'i-lucide-text-quote' },
          { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' },
        ],
      },
      { kind: 'clearFormatting', pos, label: 'Reset formatting', icon: 'i-lucide-rotate-ccw' },
    ],
    [{ kind: 'duplicate', pos, label: 'Duplicate', icon: 'i-lucide-copy' }],
    [
      { kind: 'moveUp', pos, label: 'Move up', icon: 'i-lucide-arrow-up' },
      { kind: 'moveDown', pos, label: 'Move down', icon: 'i-lucide-arrow-down' },
    ],
    [{ kind: 'delete', pos, label: 'Delete', icon: 'i-lucide-trash' }],
  ], allHandlers.value)
}

// Class names are applied inside teleported menus → styled in the unscoped
// <style> block at the bottom (scoped / :deep styles can't reach a teleport).
const dropMenuUI = {
  content: 'w-48 max-h-80 overflow-y-auto r-editor-scrollbar',
  label: 'text-xs',
  viewport: 'w-48 max-h-80 overflow-y-auto r-editor-scrollbar',
}

// ─── Change plumbing ────────────────────────────────────────────────────────
function onContentUpdate(value) {
  emit('change', value)
  filesApi.scheduleHeal()
}

// ════════════════════════════════════════════════════════════════════════
// Expose (parent ref API)
// ════════════════════════════════════════════════════════════════════════
const ed = () => editorRef.value?.editor
const mdOptions = () => (props.contentType === 'markdown' ? { contentType: 'markdown' } : {})

defineExpose({
  // ── Original API (unchanged signatures, bugs fixed) ───────────────────
  getEditor: ed,
  focus: () => ed()?.chain().focus().run(),
  clear: () => ed()?.chain().focus().clearContent({ emitUpdate: true }).run(),
  clearContent: () => ed()?.commands.clearContent({ emitUpdate: true }),
  getHTML: () => ed()?.getHTML(),
  getJSON: () => ed()?.getJSON(),
  getText: () => ed()?.getText(),
  getMarkdown: () => ed()?.getMarkdown?.() ?? '',
  setContent: (value, emitUpdate = false) => ed()?.commands.setContent(value, { emitUpdate, ...mdOptions() }),
  insertContent: (value, options) => ed()?.chain().focus().insertContent(value, options).run(),
  getUploadedFiles: () => fileList.value,
  openFilePicker,
  openLibrary,
  insertLibraryFile,
  deleteUploadedFile,

  // ── New: design canvas ─────────────────────────────────────────────
  openDesign,
  closeDesign,
  getDesigns: filesApi.getDesigns,

  // ── New: retrieve ─────────────────────────────────────────────────────
  getFiles: () => fileList.value,
  getPendingFiles: filesApi.getPendingFiles,
  getUnusedFiles: filesApi.getUnusedFiles,
  getDocumentMedia: filesApi.getDocumentMedia,
  hasPendingFiles: () => filesApi.getPendingFiles().length > 0,
  isUploading: filesApi.isUploading,

  // ── New: insert ───────────────────────────────────────────────────────
  insertFiles: (list, options) => filesApi.addFiles(list, options),
  insertFileUrl: (url, options) => filesApi.addRemoteUrl(url, options),
  insertFileUrls: list => list
    .map(item => (typeof item === 'string' ? filesApi.addRemoteUrl(item) : filesApi.addRemoteUrl(item.url, item)))
    .filter(Boolean),

  // ── New: upload ───────────────────────────────────────────────────────
  uploadPending: filesApi.uploadPending,
  uploadFile: id => filesApi.uploadRecord(id),
  resolveFile: filesApi.resolveFile,
  deleteFile: (target, options) => filesApi.deleteFile(target, options),
})
</script>

<style scoped lang="scss">
/* ─── Theme bridge: map Sarika design tokens onto NuxtUI theme vars ─────── */
.r-editor {
  --ui-primary: var(--c-accent);
  --ui-bg: var(--c-surface);
  --ui-bg-elevated: var(--c-bg);
  --ui-bg-muted: var(--bg-tertiary);
  --ui-bg-accented: color-mix(in srgb, var(--c-accent) 12%, var(--c-surface));
  --ui-border: var(--c-border);
  --ui-border-muted: var(--c-border);
  --ui-border-accented: var(--c-accent);
  --ui-text: var(--c-text);
  --ui-text-muted: var(--c-muted);
  --ui-text-dimmed: var(--c-muted);
  --ui-text-highlighted: var(--c-text);

  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  overflow: hidden;
}

/* ─── Design canvas — in place over the image, or expanded full screen ─────── */
.r-design {
  --d-accent: var(--c-accent, #8c52ff);
  --d-bg: var(--c-surface, #ffffff);
  --d-soft: var(--bg-tertiary, #f3f4f6);
  --d-border: var(--c-border, #e5e7eb);
  --d-text: var(--c-text, #1f2937);
  --d-muted: var(--c-muted, #6b7280);
  color: var(--d-text);
  font-size: 13px;
  outline: none;
}
.r-design *, .r-design *::before, .r-design *::after { box-sizing: border-box; }
.r-design.is-inplace { position: fixed; z-index: 1500; }
.r-design.is-full { position: fixed; inset: 0; z-index: 2000; display: flex; flex-direction: column; background: var(--d-bg); }

.r-design__dock {
  display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; background: var(--d-bg);
  border: 1px solid var(--d-border); border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}
.is-inplace .r-design__dock { position: fixed; z-index: 1600; width: min(752px, calc(100vw - 16px)); }
.is-full .r-design__dock { border: 0; border-bottom: 1px solid var(--d-border); border-radius: 0; box-shadow: none; }
.r-design__bar, .r-design__tools, .r-design__props, .r-design__foot { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.r-design__foot { padding: 6px 12px; border-top: 1px solid var(--d-border); }
.r-design__title { margin-right: 6px; }
.r-design__grow { flex: 1; }
.r-design__sep { width: 1px; height: 22px; background: var(--d-border); margin: 0 2px; }
.r-design__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 30px; height: 30px;
  padding: 0 7px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: inherit;
  font: inherit; cursor: pointer; white-space: nowrap;
}
.r-design__btn i { width: 17px; height: 17px; }
.r-design__btn:hover:not(:disabled) { background: var(--d-soft); }
.r-design__btn:disabled { opacity: 0.35; cursor: not-allowed; }
.r-design__btn--text { padding: 0 12px; border-color: var(--d-border); }
.r-design__btn--primary { background: var(--d-accent); border-color: var(--d-accent); color: #fff; font-weight: 600; }
.r-design__btn--primary:hover:not(:disabled) { background: var(--d-accent); filter: brightness(1.08); }
.r-design__btn--danger:hover:not(:disabled) { color: #dc2626; }
.r-design__btn:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 1px; }
.r-design__field {
  height: 30px; min-width: 0; padding: 0 6px; border: 1px solid var(--d-border); border-radius: 8px;
  background: var(--d-bg); color: inherit; font: inherit;
}
.r-design__field:focus { outline: 2px solid var(--d-accent); outline-offset: -1px; }
.r-design__num { width: 68px; }
.r-design__color { width: 30px; height: 28px; padding: 0; border: none; background: none; cursor: pointer; }
.r-design__check { display: inline-flex; align-items: center; gap: 6px; color: var(--d-muted); cursor: pointer; }
.r-design__props label { display: inline-flex; align-items: center; gap: 4px; color: var(--d-muted); }
.r-design__kind { min-width: 60px; text-transform: capitalize; font-weight: 600; }
.r-design__hint { margin: 0; color: var(--d-muted); font-size: 12px; }
.r-design__error { margin: 0; padding: 6px 10px; border-radius: 8px; background: #dc2626; color: #fff; }
.r-design input[type='range'] { accent-color: var(--d-accent); }

.is-inplace .r-design__body { position: absolute; inset: 0; }
.is-full .r-design__body { flex: 1; min-height: 0; display: flex; }
.r-design__stage { position: relative; flex: 1; min-width: 0; }
.is-inplace .r-design__stage { width: 100%; height: 100%; }
.is-inplace .r-design__page { box-shadow: 0 0 0 2px var(--d-accent); }
.is-full .r-design__stage { overflow: auto; display: flex; background: color-mix(in srgb, var(--d-text) 7%, var(--d-bg)); }
.is-full .r-design__page { margin: auto; padding: 40px; }
.r-design__page :deep(.canvas-container) { box-shadow: 0 6px 28px rgba(0, 0, 0, 0.22); }
.r-design__loading {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--d-bg) 70%, transparent); color: var(--d-muted);
}
.r-design__pct { width: 40px; text-align: right; color: var(--d-muted); font-variant-numeric: tabular-nums; }

.r-editor--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.r-editor__root {
  width: 100%;
  color: var(--c-text);
}

.r-editor__toolbar--fixed {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
}

/* ─── SSR / pre-mount skeleton ─────────────────────────────────────────────── */
.r-editor__skeleton { padding: 0.75rem; }
.r-editor__skeleton-toolbar {
  height: 32px;
  border-radius: 0.5rem;
  background: var(--bg-tertiary);
  margin-bottom: 1rem;
}
.r-editor__skeleton-line {
  height: 14px;
  border-radius: 0.375rem;
  background: var(--bg-tertiary);
  margin-bottom: 0.625rem;
}
.r-editor__skeleton-line--short { width: 60%; }

/* ─── Picker + URL insert ─────────────────────────────────────────────────── */
.r-editor__picker,
.r-editor__library {
  width: min(480px, 90vw);
}
.r-editor__url { margin-top: 0.75rem; }
.r-editor__url-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.r-editor__url-input { flex: 1; min-width: 0; }
.r-editor__url-error {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--c-danger);
}

/* ─── Media library ───────────────────────────────────────────────────────── */
.r-editor__library-empty {
  padding: 2rem 0;
  text-align: center;
  color: var(--c-muted);
  font-size: 0.875rem;
}
.r-editor__library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  max-height: 420px;
  overflow-y: auto;
}
.r-editor__library-item {
  position: relative;
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--c-bg);
}
.r-editor__library-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: none;
  background: var(--bg-tertiary);
  cursor: pointer;
}
.r-editor__library-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.r-editor__library-thumb-icon { font-size: 1.75rem; color: var(--c-muted); }
.r-editor__library-badge {
  position: absolute;
  left: 0.375rem;
  top: 0.375rem;
  padding: 0.05rem 0.4rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  &.is-error { background: var(--c-danger); }
}
.r-editor__library-meta {
  display: flex;
  flex-direction: column;
  padding: 0.375rem 0.5rem;
  gap: 0.125rem;
}
.r-editor__library-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--c-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-editor__library-size { font-size: 0.7rem; color: var(--c-muted); }
.r-editor__library-delete {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 0.375rem;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  &:hover { background: var(--c-danger); }
}

/* ─── Prose content ───────────────────────────────────────────────────────── */
:deep(.r-editor__prose) { color: var(--c-text); }
:deep(.tiptap) { color: var(--c-text); min-height: 160px; }
:deep(.tiptap h1),
:deep(.tiptap h2),
:deep(.tiptap h3),
:deep(.tiptap h4) { color: var(--c-text); font-weight: 700; }
:deep(.tiptap a) { color: var(--c-accent); text-decoration: underline; }
:deep(.tiptap blockquote) {
  border-left: 3px solid var(--c-accent);
  color: var(--c-muted);
  padding-left: 0.75rem;
}
:deep(.tiptap code) {
  background: var(--bg-tertiary);
  color: var(--c-accent);
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
}
:deep(.tiptap pre) {
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  padding: 0.75rem;
}
:deep(.tiptap .completion-suggestion) { color: var(--c-muted) !important; }
:deep(.tiptap p.is-editor-empty:first-child::before) {
  color: var(--c-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
:deep(.tiptap .ProseMirror-selectednode) {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
  border-radius: 0.5rem;
}

/* ─── Media nodes (image / video / file): resize handles + layout ───────────── */
:deep(.r-media) { position: relative; margin: 0.5rem 0; line-height: 0; text-align: left; }
:deep(.r-media[data-layout='center']) { text-align: center; }
:deep(.r-media[data-layout='right']) { text-align: right; }
:deep(.r-media[data-layout='float-left']) { float: left; margin: 0.25rem 1rem 0.5rem 0; max-width: 60%; }
:deep(.r-media[data-layout='float-right']) { float: right; margin: 0.25rem 0 0.5rem 1rem; max-width: 60%; }
:deep(.r-media__box) { position: relative; display: inline-block; max-width: 100%; vertical-align: top; text-align: left; line-height: normal; }
:deep(.r-media[data-kind='video'] .r-media__box) { width: 100%; }
:deep(.r-media[data-kind='file'] .r-media__box) { width: min(100%, 420px); }
:deep(.r-media img),
:deep(.r-media video) { display: block; width: 100%; height: auto; border-radius: 0.5rem; }
:deep(.r-media.is-selected .r-media__box) { outline: 2px solid var(--c-accent); }
:deep(.r-media.ProseMirror-selectednode) { outline: none; }
:deep(.r-media__handle) {
  position: absolute; z-index: 3; display: none; width: 12px; height: 12px; box-sizing: border-box;
  border: 2px solid var(--c-accent); border-radius: 50%; background: #fff; touch-action: none;
}
:deep(.r-media.is-selected .r-media__handle),
:deep(.r-media.is-resizing .r-media__handle),
:deep(.r-media:hover .r-media__handle) { display: block; }
:deep(.r-media__handle--nw) { top: -6px; left: -6px; cursor: nwse-resize; }
:deep(.r-media__handle--n) { top: -6px; left: calc(50% - 6px); cursor: ns-resize; }
:deep(.r-media__handle--ne) { top: -6px; right: -6px; cursor: nesw-resize; }
:deep(.r-media__handle--e) { top: calc(50% - 6px); right: -6px; cursor: ew-resize; }
:deep(.r-media__handle--se) { bottom: -6px; right: -6px; cursor: nwse-resize; }
:deep(.r-media__handle--s) { bottom: -6px; left: calc(50% - 6px); cursor: ns-resize; }
:deep(.r-media__handle--sw) { bottom: -6px; left: -6px; cursor: nesw-resize; }
:deep(.r-media__handle--w) { top: calc(50% - 6px); left: -6px; cursor: ew-resize; }
:deep(.r-media__badge) {
  position: absolute; bottom: 8px; left: 50%; z-index: 4; display: none; transform: translateX(-50%);
  padding: 2px 8px; border-radius: 6px; background: rgba(17, 24, 39, 0.85); color: #fff; font-size: 12px; line-height: 1.5; white-space: nowrap; pointer-events: none;
}
:deep(.r-media.is-resizing .r-media__badge) { display: block; }

/* ─── Toolbar colour swatches ──────────────────────────────────────────────── */
.r-editor__swatch { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }
.r-editor__swatch:hover { background: var(--bg-tertiary); }
.r-editor__swatch i { width: 16px; height: 16px; pointer-events: none; }
.r-editor__swatch input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }

/* ─── Tables ───────────────────────────────────────────────────────────────── */
:deep(.tiptap table) { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1rem 0; overflow: hidden; }
:deep(.tiptap td),
:deep(.tiptap th) { position: relative; min-width: 3rem; padding: 0.5rem 0.625rem; border: 1px solid var(--c-border); vertical-align: top; box-sizing: border-box; }
:deep(.tiptap th) { background: var(--bg-tertiary); font-weight: 600; text-align: left; }
:deep(.tiptap .selectedCell::after) { content: ''; position: absolute; inset: 0; background: color-mix(in srgb, var(--c-accent) 18%, transparent); pointer-events: none; }
:deep(.tiptap .column-resize-handle) { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background: var(--c-accent); pointer-events: none; }
:deep(.tiptap .tableWrapper) { overflow-x: auto; }
:deep(.tiptap.resize-cursor) { cursor: col-resize; }
:deep(.tiptap mark) { border-radius: 0.2rem; padding: 0 0.1rem; }

/* ─── Video + file card ───────────────────────────────────────────────────── */
:deep(.r-editor__video) {
  display: block;
  width: 100%;
  max-width: 100%;
  border-radius: 0.5rem;
  background: #000;
}
:deep(.r-editor__file-card) {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--c-border);
  border-radius: 0.625rem;
  background: var(--c-bg);
  text-decoration: none;
  color: var(--c-text);
}
:deep(.r-editor__file-card-icon) { font-size: 1.25rem; color: var(--c-accent); flex-shrink: 0; }
:deep(.r-editor__file-card-body) { display: flex; flex-direction: column; min-width: 0; }
:deep(.r-editor__file-card-name) {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.r-editor__file-card-size) { font-size: 0.75rem; color: var(--c-muted); }
</style>

<!-- Unscoped: dropdown menus are teleported to <body>, outside this component's
     scope id, so scoped / :deep rules never matched them (the old `::deep`
     typo and `width: 50px` scrollbar were dead/wrong code anyway). -->
<style lang="scss">
.r-editor-scrollbar {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #9ca3af transparent;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 9999px; }
  &::-webkit-scrollbar-thumb:hover { background: #6b7280; }
}
</style>