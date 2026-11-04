// components/REditor/REditorMedia.js
// Media helpers + custom Tiptap nodes for REditor.
// Everything here is SSR-safe: no DOM access happens at module scope; DOM is
// only touched inside node views / event handlers, which run in the browser.

import { Node, Extension, mergeAttributes } from '@tiptap/core'
import { Image } from '@tiptap/extension-image'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// ─── Constants ───────────────────────────────────────────────────────────────
export const MEDIA_NODE_TYPES = ['image', 'videoBlock', 'fileBlock']
export const KIND_TO_NODE = { image: 'image', video: 'videoBlock', file: 'fileBlock' }
export const NODE_TO_KIND = { image: 'image', videoBlock: 'video', fileBlock: 'file' }

export const DEFAULT_ACCEPT = {
  image: 'image/*',
  video: 'video/*',
  file: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv',
}
export const DEFAULT_MAX_SIZE = {
  image: 8 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  file: 20 * 1024 * 1024,
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv|mkv)$/i

// ─── Pure helpers ────────────────────────────────────────────────────────────
export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function uid() {
  return globalThis.crypto?.randomUUID?.()
    ?? `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function isHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}

/** Returns the URL if its scheme is safe to put in href/src, else ''. */
export function safeUrl(value) {
  if (!value || typeof value !== 'string') return ''
  try {
    const { protocol } = new URL(value, 'https://placeholder.invalid')
    return ['http:', 'https:', 'blob:'].includes(protocol) ? value : ''
  } catch { return '' }
}

export function detectKind(mime = '', name = '') {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (!mime) {
    if (IMAGE_EXT.test(name)) return 'image'
    if (VIDEO_EXT.test(name)) return 'video'
  }
  return 'file'
}

export function nameFromUrl(url) {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop()
    return last ? decodeURIComponent(last) : 'file'
  } catch { return 'file' }
}

export function kindFromUrl(url) {
  try {
    const path = new URL(url).pathname
    if (IMAGE_EXT.test(path)) return 'image'
    if (VIDEO_EXT.test(path)) return 'video'
  } catch { /* fall through */ }
  return 'file'
}

/** Same matching rules as <input accept>: ".ext", "type/*", "type/subtype". */
export function matchesAccept(file, accept) {
  if (!accept) return true
  const name = (file.name || '').toLowerCase()
  const type = (file.type || '').toLowerCase()
  return accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some((token) => {
    if (token.startsWith('.')) return name.endsWith(token)
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1))
    return type === token
  })
}

/**
 * Light client-side image compression (used for dropped/pasted images; the
 * picker's RFileUpload does its own). Skips GIF/SVG, never returns a bigger file.
 */
export async function compressImageFile(file, { quality = 0.82, maxPx = 1920 } = {}) {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) return file
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * ratio)
  const h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  // JPEG stays JPEG; everything else → WebP (keeps alpha, unlike JPEG).
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp'
  const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality))
  if (!blob || (ratio === 1 && blob.size >= file.size)) return file
  const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[blob.type] ?? 'jpg'
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${ext}`, { type: blob.type, lastModified: Date.now() })
}

const escapeAttr = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// ─── ResizableImage ──────────────────────────────────────────────────────────
// Overrides the built-in `image` node. REditor passes :image="false" to UEditor
// so this is the ONLY extension named "image" (duplicate names were a bug).
export const ResizableImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const m = /width:\s*(\d+)px/.exec(el.getAttribute('style') || '')
          return m ? Number(m[1]) : null
        },
        renderHTML: attrs => (attrs.width ? { style: `width: ${attrs.width}px` } : {}),
      },
      // Links the node to a tracked file record. Not serialised to HTML.
      fileId: { default: null, rendered: false },
    }
  },

  addNodeView() {
    return ({ node: initialNode, editor, getPos }) => {
      let current = initialNode

      const dom = document.createElement('div')
      dom.className = 'r-editor__img-frame'
      const img = document.createElement('img')
      const handle = document.createElement('span')
      handle.className = 'r-editor__img-resize-handle'
      dom.append(img, handle)

      const apply = (n) => {
        const src = safeUrl(n.attrs.src)
        if (img.getAttribute('src') !== src) img.setAttribute('src', src)
        n.attrs.alt != null ? img.setAttribute('alt', n.attrs.alt) : img.removeAttribute('alt')
        n.attrs.title != null ? img.setAttribute('title', n.attrs.title) : img.removeAttribute('title')
        img.style.width = n.attrs.width ? `${n.attrs.width}px` : ''
      }
      apply(current)

      handle.addEventListener('pointerdown', (e) => {
        if (!editor.isEditable) return
        e.preventDefault()
        e.stopPropagation()
        handle.setPointerCapture(e.pointerId)
        const startX = e.clientX
        const startWidth = img.clientWidth
        const maxWidth = dom.parentElement?.clientWidth || Infinity

        const move = (ev) => {
          img.style.width = `${Math.min(maxWidth, Math.max(80, Math.round(startWidth + ev.clientX - startX)))}px`
        }
        const up = (ev) => {
          handle.removeEventListener('pointermove', move)
          handle.removeEventListener('pointerup', up)
          handle.removeEventListener('pointercancel', up)
          handle.releasePointerCapture?.(ev.pointerId)
          const pos = typeof getPos === 'function' ? getPos() : undefined
          if (typeof pos === 'number') {
            editor.view.dispatch(editor.view.state.tr.setNodeAttribute(pos, 'width', img.clientWidth))
          }
        }
        handle.addEventListener('pointermove', move)
        handle.addEventListener('pointerup', up)
        handle.addEventListener('pointercancel', up)
      })

      return {
        dom,
        stopEvent: e => e.target === handle,
        update(updated) {
          if (updated.type !== current.type) return false
          current = updated
          apply(updated)
          return true
        },
      }
    }
  },
})

// ─── VideoBlock ──────────────────────────────────────────────────────────────
export const VideoBlock = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: null },
      fileId: { default: null, rendered: false },
    }
  },
  parseHTML() {
    return [{ tag: 'video[data-type="video-block"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, {
      controls: 'true',
      preload: 'metadata',
      playsinline: 'true',
      'data-type': 'video-block',
      class: 'r-editor__video',
    })]
  },
  // Only used when contentType="markdown" (Tiptap v3 markdown). Markdown has no
  // video syntax, so we emit raw HTML. For lossless media use html/json.
  renderMarkdown(node) {
    return `<video src="${escapeAttr(node.attrs.src)}" controls preload="metadata" data-type="video-block"></video>`
  },
})

// ─── FileBlock ───────────────────────────────────────────────────────────────
export const FileBlock = Node.create({
  name: 'fileBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      // Explicit parse/render: an <a> has `href`, not `src`, so the default
      // attribute mapping silently lost the URL on HTML round-trips.
      src: {
        default: null,
        parseHTML: el => el.getAttribute('href'),
        renderHTML: attrs => (attrs.src ? { href: attrs.src } : {}),
      },
      name: {
        default: null,
        parseHTML: el => el.getAttribute('data-name'),
        renderHTML: attrs => (attrs.name ? { 'data-name': attrs.name } : {}),
      },
      size: {
        default: null,
        parseHTML: (el) => { const n = Number(el.getAttribute('data-size')); return n || null },
        renderHTML: attrs => (attrs.size ? { 'data-size': String(attrs.size) } : {}),
      },
      fileId: { default: null, rendered: false },
    }
  },
  parseHTML() {
    return [{ tag: 'a[data-type="file-block"]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['a', mergeAttributes(HTMLAttributes, {
      target: '_blank',
      rel: 'noopener noreferrer',
      'data-type': 'file-block',
      class: 'r-editor__file-card',
    }), node.attrs.name || 'File']
  },
  renderMarkdown(node) {
    return `[${(node.attrs.name || 'File').replace(/[[\]]/g, '')}](${node.attrs.src})`
  },

  addNodeView() {
    return ({ node: initialNode, editor }) => {
      const a = document.createElement('a')
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.className = 'r-editor__file-card'
      a.setAttribute('data-type', 'file-block')

      const icon = document.createElement('span')
      icon.className = 'r-editor__file-card-icon'
      const i = document.createElement('i')
      i.className = 'i-lucide-file-text'
      icon.append(i)

      const body = document.createElement('span')
      body.className = 'r-editor__file-card-body'
      const nameEl = document.createElement('span')
      nameEl.className = 'r-editor__file-card-name'
      const sizeEl = document.createElement('span')
      sizeEl.className = 'r-editor__file-card-size'
      body.append(nameEl, sizeEl)
      a.append(icon, body)

      // While editing, a click should select the node (so the media toolbar
      // appears) instead of navigating away.
      a.addEventListener('click', (e) => { if (editor.isEditable) e.preventDefault() })

      const apply = (n) => {
        a.href = safeUrl(n.attrs.src) || '#'
        nameEl.textContent = n.attrs.name || 'File'
        sizeEl.textContent = n.attrs.size ? formatBytes(n.attrs.size) : ''
      }
      apply(initialNode)

      return {
        dom: a,
        update(updated) {
          if (updated.type !== initialNode.type) return false
          apply(updated)
          return true
        },
      }
    }
  },
})

// ─── Drop / paste handler ────────────────────────────────────────────────────
// A tiny ProseMirror plugin that forwards dropped / pasted files to REditor.
// The plugin key is unique per editor instance (see EditorCompletionExtension.js
// for why that matters).
let handlerSeq = 0

export function createFileHandlerExtension({ onFiles, isEnabled = () => true }) {
  return Extension.create({
    name: 'rEditorFileHandler',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey(`rEditorFileHandler_${++handlerSeq}`),
          props: {
            handleDrop(view, event) {
              if (!view.editable || !isEnabled()) return false
              const files = Array.from(event.dataTransfer?.files ?? [])
              if (!files.length) return false
              event.preventDefault()
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? null
              onFiles(files, pos)
              return true
            },
            handlePaste(view, event) {
              if (!view.editable || !isEnabled()) return false
              const data = event.clipboardData
              const files = Array.from(data?.files ?? [])
              // If text is on the clipboard too (e.g. copied from Word), let the
              // default paste handle it.
              if (!files.length || data.getData('text/plain')) return false
              event.preventDefault()
              onFiles(files, null)
              return true
            },
          },
        }),
      ]
    },
  })
}
