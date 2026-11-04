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
      </UEditorToolbar>

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
  </div>
</template>

<script setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import { mapEditorItems } from '@nuxt/ui/utils/editor'
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji'
import { TextAlign } from '@tiptap/extension-text-align'
import { useEditorCompletion } from '../../composables/EditorUseCompletion'
import REditorLinkPopover from './REditorLinkPopover.vue'
import {
  ResizableImage, VideoBlock, FileBlock, createFileHandlerExtension,
  MEDIA_NODE_TYPES, NODE_TO_KIND, formatBytes, safeUrl,
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
  // accept: { image, video, file }   — <input accept> strings per kind
  // maxSize: { image, video, file }  — bytes per kind
}
const opts = computed(() => ({ ...OPTION_DEFAULTS, ...(props.options || {}) }))

const isDisabled = computed(() => props.disabled)
const placeholderText = computed(() => props.placeholder)
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

  const insert = []
  if (o.link) insert.push({ slot: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } })
  if (o.imageUpload) insert.push({ kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: 'Image' } })
  if (o.videoUpload) insert.push({ kind: 'videoUpload', icon: 'i-lucide-video', tooltip: { text: 'Video' } })
  if (o.fileUpload) insert.push({ kind: 'fileUpload', icon: 'i-lucide-paperclip', tooltip: { text: 'File' } })
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

function mediaToolbarItems(editor) {
  return [
    [
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
// .r-editor__picker,
// .r-editor__library {
//   width: min(480px, 90vw);
// }
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

/* ─── Resizable image ─────────────────────────────────────────────────────── */
:deep(.r-editor__img-frame) {
  position: relative;
  display: inline-block;
  max-width: 100%;
}
:deep(.r-editor__img-frame img) {
  display: block;
  max-width: 100%;
  border-radius: 0.5rem;
}
:deep(.r-editor__img-resize-handle) {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 14px;
  height: 14px;
  border-radius: 0.25rem;
  background: var(--c-accent);
  border: 2px solid var(--c-surface);
  cursor: nwse-resize;
  touch-action: none;
  opacity: 0;
  transition: opacity 0.12s;
}
:deep(.r-editor__img-frame:hover .r-editor__img-resize-handle) { opacity: 1; }

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