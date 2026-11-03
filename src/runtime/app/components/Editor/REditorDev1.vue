<template>
  <div class="r-editor" :class="{ 'r-editor--disabled': isDisabled }">
    <UEditor
      ref="editorRef"
      v-slot="{ editor, handlers }"
      v-model="content"
      :content-type="contentType"
      :editable="!isDisabled"
      :extensions="allExtensions"
      :handlers="allHandlers"
      :starter-kit="starterKit"
      :placeholder="{ placeholder, includeChildren: true }"
      :ui="mergedUi"
      class="r-editor__root"
      @update:model-value="onContentUpdate"
      @focus="emits('focus', $event)"
      @blur="emits('blur', $event)"
    >
      <!-- ── Fixed toolbar (always visible above content) ─────────────── -->
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

      <!-- ── Bubble toolbar (appears on text selection) ────────────────── -->
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

      <!-- ── Image bubble toolbar (appears when an image is selected) ──── -->
      <UEditorToolbar
        v-if="opts.imageUpload"
        :editor="editor"
        :items="imageToolbarItems(editor)"
        layout="bubble"
        :should-show="imageShouldShow"
      />

      <!-- ── Slash-command suggestion menu ──────────────────────────────── -->
      <UEditorSuggestionMenu
        v-if="opts.suggestionMenu"
        :editor="editor"
        :items="suggestionItems"
      />

      <!-- ── @mention menu ──────────────────────────────────────────────── -->
      <UEditorMentionMenu
        v-if="opts.mentionMenu && mentionItems.length"
        :editor="editor"
        :items="mentionItems"
      />

      <!-- ── :emoji: menu ───────────────────────────────────────────────── -->
      <UEditorEmojiMenu
        v-if="opts.emojiMenu"
        :editor="editor"
        :items="emojiItems"
      />

      <!-- ── Drag handle (hover left edge of a block) ───────────────────── -->
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
          @click="(e) => {
            e.stopPropagation()
            const sel = onClick()
            handlers.suggestion?.execute(editor, { pos: sel?.pos }).run()
          }"
        />
        <UDropdownMenu
          v-slot="{ open }"
          :modal="false"
          :items="turnIntoItems(editor)"
          :content="{ side: 'left' }"
          :ui="{ content: 'w-48', label: 'text-xs' }"
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

    <!-- ── Image insert / replace picker (RFileUpload in a modal) ───────── -->
    <RModal v-model="pickerOpen" :no-header="true">
      <div class="r-editor__picker">
        <div class="r-editor__picker-head">
          <span>{{ pickerMode === 'replace' ? 'Replace image' : 'Insert image' }}</span>
          <button type="button" class="r-editor__picker-close" aria-label="Close" @click="pickerOpen = false">
            <i class="i-lucide-x" />
          </button>
        </div>
        <RFileUpload
          :key="pickerKey"
          v-model="pickerFiles"
          :multiple="false"
          accept="image/*"
          :crop="uploadCrop"
          :crop-shape="uploadCropShape"
          :crop-output-px="uploadCropOutputPx"
          :compress="uploadCompress"
          :compress-quality="uploadCompressQuality"
          :compress-max-px="uploadCompressMaxPx"
          :max-size="uploadMaxSize"
          :max-width="uploadMaxWidth"
          :max-height="uploadMaxHeight"
          :min-width="uploadMinWidth"
          :min-height="uploadMinHeight"
          :upload-fn="handleUploadFn"
          label="Drop an image here"
          description="PNG, JPG, GIF, WEBP"
          @error="(payload) => emits('upload-error', payload)"
          @upload-error="(payload) => emits('upload-error', payload)"
        />
      </div>
    </RModal>

    <!-- ── Media library (every file uploaded through this editor) ──────── -->
    <RModal v-model="libraryOpen" :no-header="true">
      <div class="r-editor__library">
        <div class="r-editor__picker-head">
          <span>Uploaded files ({{ uploadedFiles.length }})</span>
          <button type="button" class="r-editor__picker-close" aria-label="Close" @click="libraryOpen = false">
            <i class="i-lucide-x" />
          </button>
        </div>

        <div v-if="!uploadedFiles.length" class="r-editor__library-empty">
          No files uploaded in this session yet.
        </div>

        <div v-else class="r-editor__library-grid">
          <div v-for="f in uploadedFiles" :key="f.id" class="r-editor__library-item">
            <button type="button" class="r-editor__library-thumb" title="Insert at cursor" @click="insertLibraryFile(f)">
              <img :src="f.url" :alt="f.name">
            </button>
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
import { computed, ref, h, defineComponent, useTemplateRef, resolveComponent } from 'vue'
import { mapEditorItems } from '@nuxt/ui/utils/editor'
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji'
import { TextAlign } from '@tiptap/extension-text-align'
import { Image } from '@tiptap/extension-image'

// ─── Props ───────────────────────────────────────────────────────────────────
const props = defineProps([
  'contentType',        // 'markdown' | 'html' | 'json'
  'placeholder',
  'disabled',
  'mentionItems',       // [{ label, avatar? }]
  'extraExtensions',    // extra TipTap extensions to merge in
  'extraHandlers',      // extra EditorCustomHandlers to merge in
  'options',            // toggle which sub-features render, see `opts` below
  'ui',                 // passthrough to UEditor :ui

  // ── Upload API (RTable-style config object) ──────────────────────────
  // { url, method, fieldName, headers, extraFields,
  //   responseUrlKey, responseIdKey, deleteUrl, deleteMethod }
  'api',

  // ── RFileUpload passthrough for crop / compress / limits ─────────────
  'uploadCrop',          // Boolean, default true
  'uploadCropShape',     // 'square' | 'circle', default 'square'
  'uploadCropOutputPx',  // Number, default 1600
  'uploadCompress',      // Boolean, default true
  'uploadCompressQuality', // 0-1, default 0.82
  'uploadCompressMaxPx', // Number, default 1920
  'uploadMaxSize',       // bytes
  'uploadMaxWidth',
  'uploadMaxHeight',
  'uploadMinWidth',
  'uploadMinHeight',
])

const emits = defineEmits([
  'update:modelValue',
  'change',
  'focus',
  'blur',

  // ── File lifecycle (mirrors RFileUpload, scoped to what's in the doc) ─
  'update:files',        // full uploadedFiles[] every time it changes
  'file-uploaded',       // record — new image inserted
  'file-changed',        // { old, next } — image replaced
  'file-deleted',        // record — image + tracked file removed
  'file-delete-error',   // { record, error }
  'upload-error',        // passthrough from RFileUpload's error/upload-error
])

// v-model (content) — html / markdown / json string depending on content-type
const content = defineModel({ default: '' })

// ─── Refs ────────────────────────────────────────────────────────────────────
const editorRef = useTemplateRef('editorRef')
const selectedNode = ref(null)

// ─── Options / defaults ────────────────────────────────────────────────────
const opts = computed(() => ({
  toolbar: true,
  bubbleToolbar: true,
  dragHandle: true,
  suggestionMenu: true,
  mentionMenu: true,
  emojiMenu: true,
  textAlign: true,
  link: true,
  imageUpload: true,
  mediaLibrary: true,
  ...(props.options || {}),
}))

const contentType = computed(() => props.contentType ?? 'markdown')
const placeholder = computed(() => props.placeholder ?? "Write, type '/' for commands...")
const isDisabled = computed(() => props.disabled ?? false)
const mentionItems = computed(() => props.mentionItems ?? [])

const uploadCrop = computed(() => props.uploadCrop ?? true)
const uploadCropShape = computed(() => props.uploadCropShape ?? 'square')
const uploadCropOutputPx = computed(() => props.uploadCropOutputPx ?? 1600)
const uploadCompress = computed(() => props.uploadCompress ?? true)
const uploadCompressQuality = computed(() => props.uploadCompressQuality ?? 0.82)
const uploadCompressMaxPx = computed(() => props.uploadCompressMaxPx ?? 1920)
const uploadMaxSize = computed(() => props.uploadMaxSize ?? null)
const uploadMaxWidth = computed(() => props.uploadMaxWidth ?? null)
const uploadMaxHeight = computed(() => props.uploadMaxHeight ?? null)
const uploadMinWidth = computed(() => props.uploadMinWidth ?? null)
const uploadMinHeight = computed(() => props.uploadMinHeight ?? null)

const starterKit = computed(() => ({
  blockquote: true,
  headings: { levels: [1, 2, 3, 4] },
  dropcursor: { color: 'var(--ui-primary)', width: 2 },
  link: { openOnClick: false },
}))

// ─── Theme bridge (maps Sarika design tokens onto NuxtUI theme vars) ───────
const mergedUi = computed(() => ({
  root: 'r-editor__prose',
  base: 'px-4 py-3 sm:px-6',
  ...(props.ui || {}),
}))

// ─── Extensions ─────────────────────────────────────────────────────────────
const allExtensions = computed(() => [
  ...(opts.value.emojiMenu ? [Emoji] : []),
  ...(opts.value.textAlign ? [TextAlign.configure({ types: ['heading', 'paragraph'] })] : []),
  ...(opts.value.imageUpload ? [Image] : []),
  ...(props.extraExtensions || []),
])

// ════════════════════════════════════════════════════════════════════════
// IMAGE UPLOAD — via RFileUpload, wired to `api` for insert / replace /
// delete, with a small in-session "media library" for change & delete.
// ════════════════════════════════════════════════════════════════════════

const apiConfig = computed(() => props.api || null)

const uploadedFiles = ref([])   // [{ id, url, name, size, uploadedAt }]

const pickerOpen  = ref(false)
const pickerFiles = ref([])
const pickerMode  = ref('insert')   // 'insert' | 'replace'
const pickerKey   = ref(0)
const replacePos  = ref(null)

const libraryOpen = ref(false)

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

function openImagePicker(mode = 'insert', pos = null) {
  pickerMode.value = mode
  replacePos.value = pos
  pickerFiles.value = []
  pickerKey.value += 1
  pickerOpen.value = true
}

function openLibrary() {
  pickerKey.value += 1
  libraryOpen.value = true
}

// Real upload, over XHR so we get true progress + the server's response
// (RFileUpload's own emits don't carry the response back — we capture it
// here and use it to finish the job: insert/replace + track the file).
function xhrUpload(file, onProgress) {
  const cfg = apiConfig.value
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append(cfg.fieldName || 'file', file)
    if (cfg.extraFields) {
      Object.entries(cfg.extraFields).forEach(([k, v]) => form.append(k, v))
    }

    xhr.open(cfg.method || 'POST', cfg.url, true)
    if (cfg.headers) {
      Object.entries(cfg.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let json = {}
        try { json = xhr.responseText ? JSON.parse(xhr.responseText) : {} } catch { /* non-JSON response */ }
        const url = getPath(json, cfg.responseUrlKey || 'url')
        const id  = getPath(json, cfg.responseIdKey || 'id')
        if (!url) { reject(new Error('Upload response is missing the file URL')); return }
        resolve({ url, id })
      } else {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(form)
  })
}

// Passed to RFileUpload as its `upload-fn` prop: async (file, onProgress) => void
async function handleUploadFn(file, onProgress) {
  let result
  if (!apiConfig.value?.url) {
    // No backend configured yet — keep the editor usable locally.
    onProgress(100)
    result = { url: URL.createObjectURL(file), id: null }
  } else {
    result = await xhrUpload(file, onProgress)
  }
  finalizeUpload({ url: result.url, id: result.id, name: file.name, size: file.size })
}

function finalizeUpload({ url, id, name, size }) {
  const editor = editorRef.value?.editor
  const record = { id: id ?? `local-${Date.now()}`, url, name, size, uploadedAt: Date.now() }

  if (pickerMode.value === 'replace' && replacePos.value != null && editor) {
    const node = editor.state.doc.nodeAt(replacePos.value)
    const oldUrl = node?.attrs?.src
    if (node && node.type.name === 'image') {
      editor.chain().focus()
        .deleteRange({ from: replacePos.value, to: replacePos.value + node.nodeSize })
        .insertContentAt(replacePos.value, { type: 'image', attrs: { src: url, alt: name } })
        .run()
    }
    const oldRecord = uploadedFiles.value.find(f => f.url === oldUrl)
    if (oldRecord) {
      uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== oldRecord.id)
      callDeleteApi(oldRecord)
    }
    emits('file-changed', { old: oldRecord ?? { url: oldUrl }, next: record })
  } else {
    editor?.chain().focus().setImage({ src: url, alt: name }).run()
    emits('file-uploaded', record)
  }

  uploadedFiles.value = [...uploadedFiles.value, record]
  emits('update:files', uploadedFiles.value)

  pickerOpen.value = false
  replacePos.value = null
}

function insertLibraryFile(record) {
  editorRef.value?.editor?.chain().focus().setImage({ src: record.url, alt: record.name }).run()
}

async function callDeleteApi(record) {
  const cfg = apiConfig.value
  if (!cfg?.deleteUrl || !record?.id) return
  try {
    await fetch(`${cfg.deleteUrl}/${record.id}`, {
      method: cfg.deleteMethod || 'DELETE',
      headers: cfg.headers || {},
    })
  } catch (error) {
    emits('file-delete-error', { record, error })
  }
}

// Removes the image from the doc (if still present) + the tracked file +
// calls the delete API (if configured) — used by both the image bubble
// toolbar and the media library.
async function deleteUploadedFile(record, { editor = null, pos = null } = {}) {
  const activeEditor = editor ?? editorRef.value?.editor
  if (activeEditor && pos != null) {
    const node = activeEditor.state.doc.nodeAt(pos)
    if (node && node.type.name === 'image') {
      activeEditor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
    }
  } else if (activeEditor) {
    // Not called from a specific position (e.g. library) — strip every
    // occurrence of this image from the document too.
    activeEditor.state.doc.descendants((node, nodePos) => {
      if (node.type.name === 'image' && node.attrs.src === record.url) {
        activeEditor.chain().focus().deleteRange({ from: nodePos, to: nodePos + node.nodeSize }).run()
      }
    })
  }

  uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== record.id)
  emits('update:files', uploadedFiles.value)
  emits('file-deleted', record)
  await callDeleteApi(record)
}

// ─── Custom handlers (kind: 'imageUpload') ─────────────────────────────────
const allHandlers = computed(() => ({
  imageUpload: {
    canExecute: (editor) => !!editor?.isEditable,
    execute: (editor) => {
      openImagePicker('insert')
      return editor.chain().focus()
    },
    isActive: (editor) => editor.isActive('image'),
    isDisabled: undefined,
  },
  ...(props.extraHandlers || {}),
}))

// ─── Fixed toolbar ──────────────────────────────────────────────────────────
const fixedToolbarItems = computed(() => {
  const groups = []

  groups.push([
    { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Undo' } },
    { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Redo' } },
  ])

  groups.push([
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Headings' },
      content: { align: 'start' },
      items: [
        { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Heading 1' },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Heading 2' },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Heading 3' },
        { kind: 'heading', level: 4, icon: 'i-lucide-heading-4', label: 'Heading 4' },
      ],
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

  groups.push([
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Code' } },
  ])

  const insertGroup = []
  if (opts.value.link) insertGroup.push({ slot: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } })
  if (opts.value.imageUpload) insertGroup.push({ kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: 'Image' } })
  if (opts.value.imageUpload && opts.value.mediaLibrary) {
    insertGroup.push({ icon: 'i-lucide-images', tooltip: { text: 'Uploaded files' }, onClick: () => openLibrary() })
  }
  if (insertGroup.length) groups.push(insertGroup)

  if (opts.value.textAlign) {
    groups.push([{
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
  }

  return groups
})

// ─── Bubble toolbar (shown when text is selected) ──────────────────────────
const bubbleToolbarItems = computed(() => {
  const groups = []

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
      { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Heading 1' },
      { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Heading 2' },
      { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Heading 3' },
      { kind: 'bulletList', icon: 'i-lucide-list', label: 'Bullet List' },
      { kind: 'orderedList', icon: 'i-lucide-list-ordered', label: 'Ordered List' },
      { kind: 'blockquote', icon: 'i-lucide-text-quote', label: 'Blockquote' },
      { kind: 'codeBlock', icon: 'i-lucide-square-code', label: 'Code Block' },
    ],
  }])

  groups.push([
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Code' } },
  ])

  const insertGroup = []
  if (opts.value.link) insertGroup.push({ slot: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } })
  if (opts.value.imageUpload) insertGroup.push({ kind: 'imageUpload', icon: 'i-lucide-image', tooltip: { text: 'Image' } })
  if (insertGroup.length) groups.push(insertGroup)

  return groups
})

const bubbleShouldShow = ({ editor, view, state }) => {
  if (editor.isActive('imageUpload') || editor.isActive('image')) return false
  const { selection } = state
  return view.hasFocus() && !selection.empty
}

// ─── Image-specific bubble toolbar (replace / delete route through RFileUpload) ─
const imageToolbarItems = (editor) => {
  const node = editor.state.doc.nodeAt(editor.state.selection.from)
  const pos = editor.state.selection.from
  const src = node?.attrs?.src

  return [
    [
      { icon: 'i-lucide-download', to: src, download: true, tooltip: { text: 'Download' } },
      {
        icon: 'i-lucide-refresh-cw',
        tooltip: { text: 'Replace' },
        onClick: () => {
          const n = editor.state.doc.nodeAt(pos)
          if (n && n.type.name === 'image') openImagePicker('replace', pos)
        },
      },
    ],
    [
      {
        icon: 'i-lucide-trash',
        tooltip: { text: 'Delete' },
        onClick: () => {
          const n = editor.state.doc.nodeAt(pos)
          if (!n || n.type.name !== 'image') return
          const record = uploadedFiles.value.find(f => f.url === n.attrs.src)
            ?? { id: `untracked-${pos}`, url: n.attrs.src, name: n.attrs.alt || 'image', size: 0 }
          deleteUploadedFile(record, { editor, pos })
        },
      },
    ],
  ]
}

const imageShouldShow = ({ editor, view }) => editor.isActive('image') && view.hasFocus()

// ─── Slash suggestion menu ──────────────────────────────────────────────────
const suggestionItems = computed(() => {
  const groups = [[
    { type: 'label', label: 'Style' },
    { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
    { kind: 'heading', level: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
    { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
    { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
    { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
    { kind: 'orderedList', label: 'Numbered List', icon: 'i-lucide-list-ordered' },
    { kind: 'blockquote', label: 'Blockquote', icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' },
  ]]

  const insert = [{ type: 'label', label: 'Insert' }]
  if (opts.value.mentionMenu) insert.push({ kind: 'mention', label: 'Mention', icon: 'i-lucide-at-sign' })
  if (opts.value.emojiMenu) insert.push({ kind: 'emoji', label: 'Emoji', icon: 'i-lucide-smile-plus' })
  if (opts.value.imageUpload) insert.push({ kind: 'imageUpload', label: 'Image', icon: 'i-lucide-image' })
  insert.push({ kind: 'horizontalRule', label: 'Divider', icon: 'i-lucide-separator-horizontal' })
  groups.push(insert)

  return groups
})

// ─── Emoji menu ─────────────────────────────────────────────────────────────
const emojiItems = gitHubEmojis.filter(e => !e.name.startsWith('regional_indicator_'))

// ─── Drag handle → "turn into" dropdown ─────────────────────────────────────
const turnIntoItems = (editor) => {
  if (!selectedNode.value?.node?.type) return []
  const label = selectedNode.value.node.type.charAt(0).toUpperCase() + selectedNode.value.node.type.slice(1)

  return mapEditorItems(editor, [
    [
      { type: 'label', label },
      {
        label: 'Turn into',
        icon: 'i-lucide-repeat-2',
        children: [
          { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
          { kind: 'heading', level: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
          { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
          { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
          { kind: 'heading', level: 4, label: 'Heading 4', icon: 'i-lucide-heading-4' },
          { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
          { kind: 'orderedList', label: 'Ordered List', icon: 'i-lucide-list-ordered' },
          { kind: 'blockquote', label: 'Blockquote', icon: 'i-lucide-text-quote' },
          { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' },
        ],
      },
      { kind: 'clearFormatting', pos: selectedNode.value?.pos, label: 'Reset formatting', icon: 'i-lucide-rotate-ccw' },
    ],
    [
      { kind: 'duplicate', pos: selectedNode.value?.pos, label: 'Duplicate', icon: 'i-lucide-copy' },
    ],
    [
      { kind: 'moveUp', pos: selectedNode.value?.pos, label: 'Move up', icon: 'i-lucide-arrow-up' },
      { kind: 'moveDown', pos: selectedNode.value?.pos, label: 'Move down', icon: 'i-lucide-arrow-down' },
    ],
    [
      { kind: 'delete', pos: selectedNode.value?.pos, label: 'Delete', icon: 'i-lucide-trash' },
    ],
  ], allHandlers.value)
}

// ─── v-model / change plumbing ──────────────────────────────────────────────
function onContentUpdate(v) {
  content.value = v
  emits('change', v)
}

// ─── Link popover (local sub-component; needs the editor instance) ─────────
const REditorLinkPopover = defineComponent({
  props: { editor: { type: Object, required: true } },
  setup(p) {
    const open = ref(false)
    const url = ref('')

    const hasLink = computed(() => p.editor.isActive('link'))

    function onOpen(v) {
      open.value = v
      if (v) url.value = p.editor.getAttributes('link').href || ''
    }

    function applyLink() {
      const chain = p.editor.chain().focus().extendMarkRange('link')
      if (url.value) chain.setLink({ href: url.value }).run()
      else chain.unsetLink().run()
      open.value = false
    }

    function removeLink() {
      p.editor.chain().focus().extendMarkRange('link').unsetLink().run()
      open.value = false
    }

    return () => h(
      resolveComponent('UPopover'),
      { open: open.value, 'onUpdate:open': onOpen },
      {
        default: () => h(resolveComponent('UButton'), {
          icon: 'i-lucide-link',
          color: 'neutral',
          variant: hasLink.value ? 'soft' : 'ghost',
          size: 'sm',
          'aria-label': 'Link',
        }),
        content: () => h('div', { class: 'r-editor__link-popover' }, [
          h(resolveComponent('UInput'), {
            modelValue: url.value,
            'onUpdate:modelValue': (v) => (url.value = v),
            placeholder: 'https://example.com',
            icon: 'i-lucide-link',
            size: 'sm',
            autofocus: true,
            onKeydown: (e) => { if (e.key === 'Enter') applyLink() },
          }),
          h('div', { class: 'r-editor__link-popover-actions' }, [
            hasLink.value
              ? h(resolveComponent('UButton'), { size: 'xs', color: 'error', variant: 'soft', onClick: removeLink }, () => 'Remove')
              : null,
            h(resolveComponent('UButton'), { size: 'xs', onClick: applyLink }, () => 'Apply'),
          ]),
        ]),
      },
    )
  },
})

// ─── Expose (parent ref API) ─────────────────────────────────────────────────
defineExpose({
  getEditor: () => editorRef.value?.editor,
  focus: () => editorRef.value?.editor?.chain().focus().run(),
  clear: () => editorRef.value?.editor?.chain().focus().clearContent(true).run(),
  getHTML: () => editorRef.value?.editor?.getHTML(),
  getJSON: () => editorRef.value?.editor?.getJSON(),
  getText: () => editorRef.value?.editor?.getText(),
  setContent: (v, emitUpdate = false) => editorRef.value?.editor?.commands.setContent(v, emitUpdate),
  insertContent: (v) => editorRef.value?.editor?.chain().focus().insertContent(v).run(),

  // ── File management ───────────────────────────────────────────────────
  getUploadedFiles: () => uploadedFiles.value,
  openImagePicker,
  openLibrary,
  insertLibraryFile,
  deleteUploadedFile,
})
</script>

<style scoped>
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

/* ─── Link popover content ────────────────────────────────────────────────── */
:deep(.r-editor__link-popover) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  width: 260px;
}

:deep(.r-editor__link-popover-actions) {
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
}

/* ─── Image picker / media library modal content ──────────────────────────── */
.r-editor__picker,
.r-editor__library {
  width: min(480px, 90vw);
  padding: 1rem;
}

.r-editor__picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: 0.75rem;
}

.r-editor__picker-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
}
.r-editor__picker-close:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

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
  display: block;
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
.r-editor__library-size {
  font-size: 0.7rem;
  color: var(--c-muted);
}

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
}
.r-editor__library-delete:hover {
  background: var(--c-danger);
}

/* ─── Prose content styling ───────────────────────────────────────────────── */
:deep(.r-editor__prose) {
  color: var(--c-text);
}

:deep(.tiptap) {
  color: var(--c-text);
  min-height: 160px;
}

:deep(.tiptap h1),
:deep(.tiptap h2),
:deep(.tiptap h3),
:deep(.tiptap h4) {
  color: var(--c-text);
  font-weight: 700;
}

:deep(.tiptap a) {
  color: var(--c-accent);
  text-decoration: underline;
}

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

:deep(.tiptap img) {
  border-radius: 0.5rem;
  max-width: 100%;
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  color: var(--c-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>