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

    <!-- Hidden native input used by the image-upload handler -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="r-editor__file-input"
      @change="onFileSelected"
    >
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
  'contentType',      // 'markdown' | 'html' | 'json'
  'placeholder',
  'disabled',
  'mentionItems',     // [{ label, avatar? }]
  'extraExtensions',  // extra TipTap extensions to merge in
  'extraHandlers',    // extra EditorCustomHandlers to merge in
  'options',          // toggle which sub-features render, see `opts` below
  'ui',               // passthrough to UEditor :ui
])

const emits = defineEmits([
  'update:modelValue',
  'change',
  'focus',
  'blur',
  'imageUploaded',
])

// v-model (content) — html / markdown / json string depending on content-type
const content = defineModel({ default: '' })

// ─── Refs ────────────────────────────────────────────────────────────────────
const editorRef = useTemplateRef('editorRef')
const fileInputRef = ref(null)
const selectedNode = ref(null)
let pendingUploadEditor = null

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
  ...(props.options || {}),
}))

const contentType = computed(() => props.contentType ?? 'markdown')
const placeholder = computed(() => props.placeholder ?? "Write, type '/' for commands...")
const isDisabled = computed(() => props.disabled ?? false)
const mentionItems = computed(() => props.mentionItems ?? [])

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

// ─── Image upload (base64, no backend required) ────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function triggerImageUpload(editor) {
  pendingUploadEditor = editor
  fileInputRef.value?.click()
}

async function onFileSelected(e) {
  const file = e.target?.files?.[0]
  e.target.value = ''
  if (!file || !pendingUploadEditor) return

  const src = await fileToBase64(file)
  pendingUploadEditor.chain().focus().setImage({ src, alt: file.name }).run()
  emits('imageUploaded', { file, src })
  pendingUploadEditor = null
}

// ─── Custom handlers (kind: 'imageUpload') ─────────────────────────────────
const allHandlers = computed(() => ({
  imageUpload: {
    canExecute: (editor) => !!editor?.isEditable,
    execute: (editor) => {
      triggerImageUpload(editor)
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

// ─── Image-specific bubble toolbar ──────────────────────────────────────────
const imageToolbarItems = (editor) => {
  const node = editor.state.doc.nodeAt(editor.state.selection.from)
  return [
    [
      { icon: 'i-lucide-download', to: node?.attrs?.src, download: true, tooltip: { text: 'Download' } },
      {
        icon: 'i-lucide-refresh-cw',
        tooltip: { text: 'Replace' },
        onClick: () => {
          const { state } = editor
          const pos = state.selection.from
          const n = state.doc.nodeAt(pos)
          if (n && n.type.name === 'image') triggerImageUpload(editor)
        },
      },
    ],
    [
      {
        icon: 'i-lucide-trash',
        tooltip: { text: 'Delete' },
        onClick: () => {
          const { state } = editor
          const pos = state.selection.from
          const n = state.doc.nodeAt(pos)
          if (n && n.type.name === 'image') {
            editor.chain().focus().deleteRange({ from: pos, to: pos + n.nodeSize }).run()
          }
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
})
</script>

<style lang="scss" scoped>
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

.r-editor__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
