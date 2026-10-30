<template>
  <div class="r-editor" :class="{ 'r-editor--disabled': isDisabled }">
    <!--
      ClientOnly: Tiptap/ProseMirror + our crop/compress/resize code all touch
      DOM-only APIs (document, Image, canvas, URL.createObjectURL). Rendering
      any of that during Nuxt SSR is what usually produces the "500 Internal
      Server Error" / prosemirror plugin-instance mismatch — see the note in
      EditorCompletionExtension.js for the other half of the fix.
    -->
    <ClientOnly>
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

        <!-- ── Media bubble toolbar (image / video / file selected) ──────── -->
        <UEditorToolbar
          v-if="opts.imageUpload || opts.videoUpload || opts.fileUpload || opts.canvasEditor"
          :editor="editor"
          :items="mediaToolbarItems(editor)"
          layout="bubble"
          :should-show="mediaShouldShow"
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

      <!-- ── Media insert / replace picker (RFileUpload in a modal) ───────── -->
      <RModal v-model="pickerOpen" :no-header="true">
        <div class="r-editor__picker">
          <div class="r-editor__picker-head">
            <span>{{ pickerTitle }}</span>
            <button type="button" class="r-editor__picker-close" aria-label="Close" @click="pickerOpen = false">
              <i class="i-lucide-x" />
            </button>
          </div>
          <RFileUpload
            :key="pickerKey"
            v-model="pickerFiles"
            :multiple="false"
            :accept="pickerAccept"
            :crop="uploadCrop"
            :crop-shape="uploadCropShape"
            :crop-output-px="uploadCropOutputPx"
            :compress="uploadCompress"
            :compress-quality="uploadCompressQuality"
            :compress-max-px="uploadCompressMaxPx"
            :max-size="pickerMaxSize"
            :max-width="uploadMaxWidth"
            :max-height="uploadMaxHeight"
            :min-width="uploadMinWidth"
            :min-height="uploadMinHeight"
            :upload-fn="handleUploadFn"
            :label="pickerLabel"
            :description="pickerDescription"
            @error="(payload) => emits('upload-error', payload)"
            @upload-error="(payload) => emits('upload-error', payload)"
          />
        </div>
      </RModal>

      <!-- ── Design editor (Canva-style canvas: photo / line / rectangle / icon) ─ -->
      <RModal v-model="designOpen" :no-header="true">
        <RCanvasEditor
          :key="designKey"
          :model-value="designInitialJson"
          :width="900"
          :height="560"
          @save="onDesignSave"
          @cancel="designOpen = false"
        />
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
                <img v-if="f.kind === 'image'" :src="f.url" :alt="f.name">
                <span v-else class="r-editor__library-thumb-icon">
                  <i :class="f.kind === 'video' ? 'i-lucide-video' : 'i-lucide-file-text'" />
                </span>
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

      <!-- ── SSR fallback (no Tiptap/DOM code runs on the server) ─────────── -->
      <template #fallback>
        <div class="r-editor__skeleton">
          <div class="r-editor__skeleton-toolbar" />
          <div class="r-editor__skeleton-line" />
          <div class="r-editor__skeleton-line" />
          <div class="r-editor__skeleton-line r-editor__skeleton-line--short" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, ref, h, defineComponent, useTemplateRef, resolveComponent } from 'vue'
import { mapEditorItems } from '@nuxt/ui/utils/editor'
import { Node, mergeAttributes } from '@tiptap/core'
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji'
import { TextAlign } from '@tiptap/extension-text-align'
import { Image } from '@tiptap/extension-image'
import { useEditorCompletion } from './EditorUseCompletion'
import RCanvasEditor from './RCanvasEditor.vue'

// ════════════════════════════════════════════════════════════════════════
// MODULE-SCOPE HELPERS + CUSTOM NODES
// Defined once, outside the component instance, so they're stable across
// re-renders (feeding a freshly-constructed extension into UEditor's
// `:extensions` prop on every reactive recompute is what usually produces
// "Adding different instances of a keyed plugin").
// ════════════════════════════════════════════════════════════════════════

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// ── ResizableImage — base Image node + a drag handle to resize the frame ──
const ResizableImage = Image.extend({
  name: 'image',
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attrs => (attrs.width ? { style: `width: ${attrs.width}px` } : {}),
      },
    }
  },
  addNodeView() {
    return ({ node, editor, getPos, HTMLAttributes }) => {
      const dom = document.createElement('div')
      dom.className = 'r-editor__img-frame'

      const img = document.createElement('img')
      Object.entries(HTMLAttributes).forEach(([k, v]) => { if (v != null) img.setAttribute(k, v) })
      if (node.attrs.width) img.style.width = `${node.attrs.width}px`
      dom.appendChild(img)

      const handle = document.createElement('span')
      handle.className = 'r-editor__img-resize-handle'
      dom.appendChild(handle)

      let startX = 0
      let startWidth = 0

      function onPointerMove(e) {
        const next = Math.max(80, Math.round(startWidth + (e.clientX - startX)))
        img.style.width = `${next}px`
      }
      function onPointerUp() {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
        if (typeof getPos === 'function' && editor.isEditable) {
          const pos = getPos()
          editor.view.dispatch(editor.view.state.tr.setNodeAttribute(pos, 'width', img.clientWidth))
        }
      }
      handle.addEventListener('pointerdown', (e) => {
        if (!editor.isEditable) return
        e.preventDefault()
        e.stopPropagation()
        startX = e.clientX
        startWidth = img.clientWidth
        document.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerup', onPointerUp)
      })

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'image') return false
          if (updatedNode.attrs.src !== img.getAttribute('src')) img.setAttribute('src', updatedNode.attrs.src)
          if (updatedNode.attrs.width) img.style.width = `${updatedNode.attrs.width}px`
          return true
        },
      }
    }
  },
})

// ── VideoBlock — uploaded videos render as a native <video controls> ──────
const VideoBlock = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      name: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'video[data-type="video-block"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, {
      controls: 'true',
      'data-type': 'video-block',
      class: 'r-editor__video',
    })]
  },
})

// ── FileBlock — PDFs / docs render as a small downloadable file card ─────
const FileBlock = Node.create({
  name: 'fileBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      name: { default: null },
      size: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'a[data-type="file-block"]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['a', mergeAttributes(HTMLAttributes, {
      href: node.attrs.src,
      target: '_blank',
      rel: 'noopener noreferrer',
      'data-type': 'file-block',
      class: 'r-editor__file-card',
    })]
  },
  addNodeView() {
    return ({ node }) => {
      const a = document.createElement('a')
      a.href = node.attrs.src
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.className = 'r-editor__file-card'
      a.setAttribute('data-type', 'file-block')
      a.innerHTML = `<span class="r-editor__file-card-icon"><i class="i-lucide-file-text"></i></span>`
        + `<span class="r-editor__file-card-body">`
        + `<span class="r-editor__file-card-name">${escapeHtml(node.attrs.name || 'File')}</span>`
        + `<span class="r-editor__file-card-size">${node.attrs.size ? formatBytes(node.attrs.size) : ''}</span>`
        + `</span>`
      return { dom: a }
    }
  },
})

// ── CanvasBlock — flattened PNG from RCanvasEditor, design JSON kept for re-editing ─
const CanvasBlock = Node.create({
  name: 'canvasBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      design: { default: null },
      width: { default: null },
      height: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'img[data-type="canvas-block"]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, {
      src: node.attrs.src,
      'data-type': 'canvas-block',
      class: 'r-editor__canvas-block',
    })]
  },
})

const MEDIA_NODE_TYPES = ['image', 'videoBlock', 'fileBlock', 'canvasBlock']

// ════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════

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
  'uploadCrop',            // Boolean, default true (images only — RFileUpload skips non-images)
  'uploadCropShape',       // 'square' | 'circle', default 'square'
  'uploadCropOutputPx',    // Number, default 1600
  'uploadCompress',        // Boolean, default true (images only)
  'uploadCompressQuality', // 0-1, default 0.82
  'uploadCompressMaxPx',   // Number, default 1920
  'uploadMaxImageSize',    // bytes, image max-size
  'uploadMaxVideoSize',    // bytes, video max-size
  'uploadMaxFileSize',     // bytes, document max-size
  'uploadMaxWidth',
  'uploadMaxHeight',
  'uploadMinWidth',
  'uploadMinHeight',

  // ── AI (Vercel AI SDK) ────────────────────────────────────────────────
  'aiApi',        // completion endpoint, default '/api/completion'
  'aiLanguages',  // translate target languages
])

const emits = defineEmits([
  'update:modelValue',
  'change',
  'focus',
  'blur',

  // ── File lifecycle (mirrors RFileUpload, scoped to what's in the doc) ─
  'update:files',        // full uploadedFiles[] every time it changes
  'file-uploaded',       // record — new image/video/file inserted
  'file-changed',        // { old, next } — media replaced
  'file-deleted',        // record — media + tracked file removed
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
  videoUpload: true,
  fileUpload: true,
  canvasEditor: true,
  mediaLibrary: true,
  ai: true,
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
const uploadMaxImageSize = computed(() => props.uploadMaxImageSize ?? 8 * 1024 * 1024)   // 8MB
const uploadMaxVideoSize = computed(() => props.uploadMaxVideoSize ?? 100 * 1024 * 1024) // 100MB
const uploadMaxFileSize = computed(() => props.uploadMaxFileSize ?? 20 * 1024 * 1024)    // 20MB
const uploadMaxWidth = computed(() => props.uploadMaxWidth ?? null)
const uploadMaxHeight = computed(() => props.uploadMaxHeight ?? null)
const uploadMinWidth = computed(() => props.uploadMinWidth ?? null)
const uploadMinHeight = computed(() => props.uploadMinHeight ?? null)

const aiLanguages = computed(() => props.aiLanguages ?? ['English', 'French', 'Spanish', 'German', 'Khmer', 'Chinese'])

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

// ════════════════════════════════════════════════════════════════════════
// AI COMPLETION (Vercel AI SDK) — composable is called once, unconditionally,
// so its Completion extension (and the PluginKey it registers) is created
// exactly once per REditor instance.
// ════════════════════════════════════════════════════════════════════════
const aiEnabled = computed(() => opts.value.ai !== false)

const {
  extension: completionExtension,
  handlers: aiHandlers,
  isLoading: aiLoading,
} = useEditorCompletion(editorRef, { api: props.aiApi ?? '/api/completion' })

// ─── Extensions — built ONCE as a plain array (not a computed). Keeping this
// reference stable for the component's lifetime is the other half of the fix
// for Tiptap's "Adding different instances of a keyed plugin" error (see
// EditorCompletionExtension.js for the Vite-config half). ──────────────────
function buildExtensions() {
  const list = []
  if (opts.value.emojiMenu) list.push(Emoji)
  if (opts.value.textAlign) list.push(TextAlign.configure({ types: ['heading', 'paragraph'] }))
  if (opts.value.imageUpload) list.push(ResizableImage)
  if (opts.value.videoUpload) list.push(VideoBlock)
  if (opts.value.fileUpload) list.push(FileBlock)
  if (opts.value.canvasEditor) list.push(CanvasBlock)
  if (aiEnabled.value && completionExtension) list.push(completionExtension)
  if (props.extraExtensions?.length) list.push(...props.extraExtensions)
  return list
}
const allExtensions = buildExtensions()

// ════════════════════════════════════════════════════════════════════════
// MEDIA UPLOAD — via RFileUpload, wired to `api` for insert / replace /
// delete, with a small in-session "media library" for change & delete.
// Handles images (crop + compress), videos, and PDF/doc attachments.
// ════════════════════════════════════════════════════════════════════════

const apiConfig = computed(() => props.api || null)

const uploadedFiles = ref([])   // [{ id, url, name, size, kind, uploadedAt }]

const pickerOpen  = ref(false)
const pickerFiles = ref([])
const pickerMode  = ref('insert')   // 'insert' | 'replace'
const pickerKind  = ref('image')    // 'image' | 'video' | 'file'
const pickerKey   = ref(0)
const replacePos  = ref(null)

const libraryOpen = ref(false)

// ── Canvas/Design editor (RCanvasEditor) state ──────────────────────────────
const designOpen = ref(false)
const designMode = ref('insert')     // 'insert' | 'replace'
const designPos = ref(null)
const designInitialJson = ref(null)
const designKey = ref(0)

function openDesignEditor(mode = 'insert', pos = null) {
  const editor = editorRef.value?.editor
  designMode.value = mode
  designPos.value = pos
  designInitialJson.value = (mode === 'replace' && pos != null)
    ? (editor?.state.doc.nodeAt(pos)?.attrs?.design ?? null)
    : null
  designKey.value += 1
  designOpen.value = true
}

async function onDesignSave({ dataUrl, json, width, height }) {
  const editor = editorRef.value?.editor
  let url = dataUrl
  let id = null

  if (apiConfig.value?.url) {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `design-${Date.now()}.png`, { type: 'image/png' })
      const result = await xhrUpload(file, () => {})
      url = result.url
      id = result.id
    } catch (error) {
      emits('upload-error', error)
    }
  }

  const attrs = { src: url, design: json, width, height }
  const record = { id: id ?? `local-${Date.now()}`, url, name: 'design.png', size: null, kind: 'design', uploadedAt: Date.now() }

  if (designMode.value === 'replace' && designPos.value != null && editor) {
    const node = editor.state.doc.nodeAt(designPos.value)
    const oldUrl = node?.attrs?.src
    if (node) {
      editor.chain().focus()
        .deleteRange({ from: designPos.value, to: designPos.value + node.nodeSize })
        .insertContentAt(designPos.value, { type: 'canvasBlock', attrs })
        .run()
    }
    const oldRecord = uploadedFiles.value.find(f => f.url === oldUrl)
    if (oldRecord) {
      uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== oldRecord.id)
      callDeleteApi(oldRecord)
    }
    emits('file-changed', { old: oldRecord ?? { url: oldUrl }, next: record })
  } else if (editor) {
    editor.chain().focus().insertContent({ type: 'canvasBlock', attrs }).run()
    emits('file-uploaded', record)
  }

  uploadedFiles.value = [...uploadedFiles.value, record]
  emits('update:files', uploadedFiles.value)
  designOpen.value = false
  designPos.value = null
}

const pickerAccept = computed(() => {
  if (pickerKind.value === 'video') return 'video/*'
  if (pickerKind.value === 'file') return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'
  return 'image/*'
})
const pickerMaxSize = computed(() => {
  if (pickerKind.value === 'video') return uploadMaxVideoSize.value
  if (pickerKind.value === 'file') return uploadMaxFileSize.value
  return uploadMaxImageSize.value
})
const pickerTitle = computed(() => {
  const verb = pickerMode.value === 'replace' ? 'Replace' : 'Insert'
  const noun = pickerKind.value === 'video' ? 'video' : pickerKind.value === 'file' ? 'document' : 'image'
  return `${verb} ${noun}`
})
const pickerLabel = computed(() => {
  if (pickerKind.value === 'video') return 'Drop a video here'
  if (pickerKind.value === 'file') return 'Drop a document here'
  return 'Drop an image here'
})
const pickerDescription = computed(() => {
  if (pickerKind.value === 'video') return `MP4, WEBM, MOV — max ${formatBytes(uploadMaxVideoSize.value)}`
  if (pickerKind.value === 'file') return `PDF, DOC, XLS, PPT — max ${formatBytes(uploadMaxFileSize.value)}`
  return `PNG, JPG, GIF, WEBP — max ${formatBytes(uploadMaxImageSize.value)}`
})

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

function openFilePicker(mode = 'insert', pos = null, kind = 'image') {
  pickerMode.value = mode
  pickerKind.value = kind
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
  finalizeUpload({ url: result.url, id: result.id, name: file.name, size: file.size, mime: file.type })
}

function mediaNodeType(mime, kind) {
  if (kind === 'video' || mime?.startsWith('video/')) return 'videoBlock'
  if (kind === 'file' || (mime && !mime.startsWith('image/'))) return 'fileBlock'
  return 'image'
}

function buildNodeAttrs(type, { url, name, size }) {
  if (type === 'image') return { src: url, alt: name }
  if (type === 'videoBlock') return { src: url, name }
  return { src: url, name, size }
}

function finalizeUpload({ url, id, name, size, mime }) {
  const editor = editorRef.value?.editor
  const type = mediaNodeType(mime, pickerKind.value)
  const attrs = buildNodeAttrs(type, { url, name, size })
  const record = { id: id ?? `local-${Date.now()}`, url, name, size, kind: pickerKind.value, uploadedAt: Date.now() }

  if (pickerMode.value === 'replace' && replacePos.value != null && editor) {
    const node = editor.state.doc.nodeAt(replacePos.value)
    const oldUrl = node?.attrs?.src

    if (node) {
      editor.chain().focus()
        .deleteRange({ from: replacePos.value, to: replacePos.value + node.nodeSize })
        .insertContentAt(replacePos.value, { type, attrs })
        .run()
    }

    const oldRecord = uploadedFiles.value.find(f => f.url === oldUrl)
    if (oldRecord) {
      uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== oldRecord.id)
      callDeleteApi(oldRecord)
    }
    emits('file-changed', { old: oldRecord ?? { url: oldUrl }, next: record })
  } else if (editor) {
    if (type === 'image') editor.chain().focus().setImage(attrs).run()
    else editor.chain().focus().insertContent({ type, attrs }).run()
    emits('file-uploaded', record)
  }

  uploadedFiles.value = [...uploadedFiles.value, record]
  emits('update:files', uploadedFiles.value)

  pickerOpen.value = false
  replacePos.value = null
}

function insertLibraryFile(record) {
  const editor = editorRef.value?.editor
  if (!editor) return
  const type = record.kind === 'video' ? 'videoBlock' : record.kind === 'file' ? 'fileBlock' : 'image'
  const attrs = buildNodeAttrs(type, record)
  if (type === 'image') editor.chain().focus().setImage(attrs).run()
  else editor.chain().focus().insertContent({ type, attrs }).run()
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

// Removes the media from the doc (if still present) + the tracked file +
// calls the delete API (if configured) — used by both the media bubble
// toolbar and the media library.
async function deleteUploadedFile(record, { editor = null, pos = null } = {}) {
  const activeEditor = editor ?? editorRef.value?.editor
  if (activeEditor && pos != null) {
    const node = activeEditor.state.doc.nodeAt(pos)
    if (node && MEDIA_NODE_TYPES.includes(node.type.name)) {
      activeEditor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
    }
  } else if (activeEditor) {
    // Not called from a specific position (e.g. library) — strip every
    // occurrence of this file from the document too.
    activeEditor.state.doc.descendants((node, nodePos) => {
      if (MEDIA_NODE_TYPES.includes(node.type.name) && node.attrs.src === record.url) {
        activeEditor.chain().focus().deleteRange({ from: nodePos, to: nodePos + node.nodeSize }).run()
      }
    })
  }

  uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== record.id)
  emits('update:files', uploadedFiles.value)
  emits('file-deleted', record)
  await callDeleteApi(record)
}

// ─── Custom handlers (kind: 'imageUpload' | 'videoUpload' | 'fileUpload') ──
const allHandlers = computed(() => ({
  imageUpload: {
    canExecute: editor => !!editor?.isEditable,
    execute: (editor) => { openFilePicker('insert', null, 'image'); return editor.chain().focus() },
    isActive: editor => editor.isActive('image'),
    isDisabled: undefined,
  },
  videoUpload: {
    canExecute: editor => !!editor?.isEditable,
    execute: (editor) => { openFilePicker('insert', null, 'video'); return editor.chain().focus() },
    isActive: editor => editor.isActive('videoBlock'),
    isDisabled: undefined,
  },
  fileUpload: {
    canExecute: editor => !!editor?.isEditable,
    execute: (editor) => { openFilePicker('insert', null, 'file'); return editor.chain().focus() },
    isActive: editor => editor.isActive('fileBlock'),
    isDisabled: undefined,
  },
  designEditor: {
    canExecute: editor => !!editor?.isEditable,
    execute: (editor) => { openDesignEditor('insert'); return editor.chain().focus() },
    isActive: editor => editor.isActive('canvasBlock'),
    isDisabled: undefined,
  },
  ...(aiEnabled.value ? aiHandlers : {}),
  ...(props.extraHandlers || {}),
}))

// ─── AI "Improve" dropdown — shared by fixed + bubble toolbars ─────────────
function buildAiGroup() {
  if (!aiEnabled.value || !completionExtension) return []
  return [[{
    icon: 'i-lucide-sparkles',
    label: 'Improve',
    variant: 'soft',
    loading: aiLoading.value,
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
        children: aiLanguages.value.map(language => ({ kind: 'aiTranslate', language, label: language })),
      },
    ],
  }]]
}

// ─── Fixed toolbar ──────────────────────────────────────────────────────────
const fixedToolbarItems = computed(() => {
  const groups = []

  groups.push(...buildAiGroup())

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
  if (opts.value.videoUpload) insertGroup.push({ kind: 'videoUpload', icon: 'i-lucide-video', tooltip: { text: 'Video' } })
  if (opts.value.fileUpload) insertGroup.push({ kind: 'fileUpload', icon: 'i-lucide-paperclip', tooltip: { text: 'File' } })
  if (opts.value.canvasEditor) insertGroup.push({ kind: 'designEditor', icon: 'i-lucide-palette', tooltip: { text: 'Design' } })
  if ((opts.value.imageUpload || opts.value.videoUpload || opts.value.fileUpload) && opts.value.mediaLibrary) {
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

  groups.push(...buildAiGroup())

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
  if (MEDIA_NODE_TYPES.some(t => editor.isActive(t))) return false
  const { selection } = state
  return view.hasFocus() && !selection.empty
}

// ─── Media-specific bubble toolbar (image / video / file: replace / delete) ─
const mediaToolbarItems = (editor) => {
  const pos = editor.state.selection.from
  const node = editor.state.doc.nodeAt(pos)
  const src = node?.attrs?.src
  const replaceKind = node?.type.name === 'videoBlock' ? 'video' : node?.type.name === 'fileBlock' ? 'file' : 'image'
  const isDesign = node?.type.name === 'canvasBlock'

  return [
    [
      { icon: 'i-lucide-download', to: src, download: true, tooltip: { text: 'Download' } },
      ...(isDesign
        ? [{
            icon: 'i-lucide-pencil-ruler',
            tooltip: { text: 'Edit design' },
            onClick: () => openDesignEditor('replace', pos),
          }]
        : [{
            icon: 'i-lucide-refresh-cw',
            tooltip: { text: 'Replace' },
            onClick: () => {
              const n = editor.state.doc.nodeAt(pos)
              if (n && MEDIA_NODE_TYPES.includes(n.type.name)) openFilePicker('replace', pos, replaceKind)
            },
          }]),
    ],
    [
      {
        icon: 'i-lucide-trash',
        tooltip: { text: 'Delete' },
        onClick: () => {
          const n = editor.state.doc.nodeAt(pos)
          if (!n || !MEDIA_NODE_TYPES.includes(n.type.name)) return
          const record = uploadedFiles.value.find(f => f.url === n.attrs.src)
            ?? { id: `untracked-${pos}`, url: n.attrs.src, name: n.attrs.name || n.attrs.alt || 'file', size: 0 }
          deleteUploadedFile(record, { editor, pos })
        },
      },
    ],
  ]
}

const mediaShouldShow = ({ editor, view }) => MEDIA_NODE_TYPES.some(t => editor.isActive(t)) && view.hasFocus()

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
  if (opts.value.videoUpload) insert.push({ kind: 'videoUpload', label: 'Video', icon: 'i-lucide-video' })
  if (opts.value.fileUpload) insert.push({ kind: 'fileUpload', label: 'File / Document', icon: 'i-lucide-paperclip' })
  if (opts.value.canvasEditor) insert.push({ kind: 'designEditor', label: 'Design (canvas)', icon: 'i-lucide-palette' })
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
  openFilePicker,
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

/* ─── SSR / hydration skeleton ─────────────────────────────────────────────── */
.r-editor__skeleton {
  padding: 0.75rem;
}
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
.r-editor__library-thumb-icon {
  font-size: 1.75rem;
  color: var(--c-muted);
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

:deep(.tiptap .completion-suggestion) {
  color: var(--c-muted) !important;
}

/* ─── Resizable image frame ────────────────────────────────────────────────── */
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
  opacity: 0;
  transition: opacity 0.12s;
}
:deep(.r-editor__img-frame:hover .r-editor__img-resize-handle) {
  opacity: 1;
}

/* ─── Canvas design block ──────────────────────────────────────────────────── */
:deep(.r-editor__canvas-block) {
  display: block;
  max-width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--c-border);
}

/* ─── Video block ──────────────────────────────────────────────────────────── */
:deep(.r-editor__video) {
  display: block;
  width: 100%;
  max-width: 100%;
  border-radius: 0.5rem;
  background: #000;
}

/* ─── File / document card ─────────────────────────────────────────────────── */
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
:deep(.r-editor__file-card-icon) {
  font-size: 1.25rem;
  color: var(--c-accent);
  flex-shrink: 0;
}
:deep(.r-editor__file-card-body) {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
:deep(.r-editor__file-card-name) {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.r-editor__file-card-size) {
  font-size: 0.75rem;
  color: var(--c-muted);
}

:deep(.tiptap p.is-editor-empty:first-child::before) {
  color: var(--c-muted);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
