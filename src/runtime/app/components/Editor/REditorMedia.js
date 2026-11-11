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

// ─── Word / Canva-style media nodes ──────────────────────────────────────────
// image, videoBlock and fileBlock share one node view:
//   • 8 resize handles on images (corners keep the ratio, sides stretch), corners on
//     video (ratio kept), left / right handles on file cards; live "W × H" badge,
//     snaps to the full column width (hold Alt to disable snapping)
//   • `layout` attribute = text alignment / wrapping:
//       left | center | right | float-left | float-right   (float = text wraps around it)
//   • width / height / layout are written into the saved HTML (inline style + data-layout),
//     so the layout survives outside the editor. (Markdown has no syntax for it → use html / json.)
export const MEDIA_LAYOUTS = ['left', 'center', 'right', 'float-left', 'float-right']

const LAYOUT_CSS = {
  left: 'display:block;margin-left:0;margin-right:auto',
  center: 'display:block;margin-left:auto;margin-right:auto',
  right: 'display:block;margin-left:auto;margin-right:0',
  'float-left': 'float:left;margin:0 1rem .5rem 0',
  'float-right': 'float:right;margin:0 0 .5rem 1rem',
}

const pxValue = (v) => {
  const s = String(v ?? '').trim()
  const n = parseFloat(s)
  return /px$/.test(s) && Number.isFinite(n) ? Math.round(n) : null
}

function sharedAttrs({ height = false } = {}) {
  return {
    width: {
      default: null,
      parseHTML: el => pxValue(el.style?.width) ?? (Number(el.getAttribute('width')) || null),
      renderHTML: a => (a.width ? { style: `width:${a.width}px;max-width:100%` } : {}),
    },
    ...(height
      ? {
          height: {
            default: null,
            parseHTML: el => pxValue(el.style?.height),
            renderHTML: a => (a.height ? { style: `height:${a.height}px;object-fit:fill` } : {}),
          },
        }
      : {}),
    layout: {
      default: null,
      parseHTML: el => (MEDIA_LAYOUTS.includes(el.getAttribute('data-layout')) ? el.getAttribute('data-layout') : null),
      renderHTML: a => (a.layout ? { 'data-layout': a.layout, style: LAYOUT_CSS[a.layout] } : {}),
    },
    // Links the node to a tracked file record. Not serialised to HTML.
    fileId: { default: null, rendered: false },
  }
}

const HANDLES = {
  image: ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'],
  video: ['nw', 'ne', 'se', 'sw', 'w', 'e'],
  file: ['w', 'e'],
}
const MIN_WIDTH = { image: 40, video: 160, file: 200 }

// create(): the inner element (img / video / a). apply(node, el): sync attrs → element.
function mediaNodeView(kind, { create, apply, allowHeight = false }) {
  return ({ node: initial, editor, getPos }) => {
    let node = initial

    const dom = document.createElement('div')
    dom.className = 'r-media'
    dom.dataset.kind = kind
    const box = document.createElement('div')
    box.className = 'r-media__box'
    const media = create(editor)
    const badge = document.createElement('span')
    badge.className = 'r-media__badge'
    box.append(media, badge)
    for (const dir of HANDLES[kind]) {
      const h = document.createElement('span')
      h.className = `r-media__handle r-media__handle--${dir}`
      h.dataset.dir = dir
      h.draggable = false
      box.append(h)
    }
    dom.append(box)

    const sync = (n) => {
      dom.dataset.layout = n.attrs.layout || 'left'
      box.style.width = n.attrs.width ? `${n.attrs.width}px` : ''
      if (allowHeight) media.style.height = n.attrs.height ? `${n.attrs.height}px` : ''
      apply(n, media)
    }
    sync(node)

    function startResize(e, dir) {
      if (!editor.isEditable) return
      e.preventDefault()
      e.stopPropagation()
      const start = box.getBoundingClientRect()
      const ratio = start.width / (start.height || 1)
      const maxW = dom.parentElement?.clientWidth || Infinity
      const minW = MIN_WIDTH[kind]
      const west = dir.includes('w')
      const north = dir.includes('n')
      const horizontal = dir.includes('w') || dir.includes('e')
      const vertical = dir.includes('n') || dir.includes('s')
      const corner = horizontal && vertical
      const stretch = allowHeight && !corner   // side handle on an image = free stretch
      let w = start.width
      let h = start.height

      const move = (ev) => {
        const dx = (ev.clientX - e.clientX) * (west ? -1 : 1)
        const dy = (ev.clientY - e.clientY) * (north ? -1 : 1)
        if (stretch) {
          if (horizontal) w = Math.min(maxW, Math.max(minW, start.width + dx))
          if (vertical) h = Math.max(24, start.height + dy)
        }
        else {
          const target = horizontal ? start.width + dx : (start.height + dy) * ratio
          w = Math.min(maxW, Math.max(minW, target))
          if (!ev.altKey && Math.abs(w - maxW) < 10) w = maxW
          h = w / ratio
        }
        box.style.width = `${Math.round(w)}px`
        if (allowHeight) media.style.height = stretch ? `${Math.round(h)}px` : ''
        badge.textContent = `${Math.round(w)} × ${Math.round(h)}`
        dom.classList.add('is-resizing')
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        dom.classList.remove('is-resizing')
        const pos = typeof getPos === 'function' ? getPos() : undefined
        if (typeof pos !== 'number') return
        const tr = editor.view.state.tr.setNodeAttribute(pos, 'width', Math.round(w))
        if (allowHeight) tr.setNodeAttribute(pos, 'height', stretch ? Math.round(h) : null)
        editor.view.dispatch(tr)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }

    box.addEventListener('pointerdown', (e) => {
      const handle = e.target instanceof Element ? e.target.closest('.r-media__handle') : null
      if (handle) startResize(e, handle.dataset.dir)
    })

    return {
      dom,
      stopEvent: e => (e.target instanceof Element && !!e.target.closest('.r-media__handle')),
      ignoreMutation: () => true,
      selectNode() { dom.classList.add('is-selected', 'ProseMirror-selectednode') },
      deselectNode() { dom.classList.remove('is-selected', 'ProseMirror-selectednode') },
      update(updated) {
        if (updated.type !== node.type) return false
        node = updated
        sync(updated)
        return true
      },
    }
  }
}

// ─── Image ───────────────────────────────────────────────────────────────────
// Overrides the built-in `image` node. REditor passes :image="false" to UEditor
// so this is the ONLY extension named "image" (duplicate names were a bug).
export const ResizableImage = Image.extend({
  name: 'image',
  draggable: true,

  addAttributes() {
    return { ...this.parent?.(), ...sharedAttrs({ height: true }) }
  },

  addNodeView() {
    return mediaNodeView('image', {
      allowHeight: true,
      create: () => {
        const img = document.createElement('img')
        img.draggable = false
        return img
      },
      apply: (n, img) => {
        const src = safeUrl(n.attrs.src)
        if (img.getAttribute('src') !== src) img.setAttribute('src', src)
        n.attrs.alt != null ? img.setAttribute('alt', n.attrs.alt) : img.removeAttribute('alt')
        n.attrs.title != null ? img.setAttribute('title', n.attrs.title) : img.removeAttribute('title')
      },
    })
  },
})

// ─── VideoBlock ──────────────────────────────────────────────────────────────
export const VideoBlock = Node.create({
  name: 'videoBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null }, name: { default: null }, ...sharedAttrs() }
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
    const { src, width, layout } = node.attrs
    const style = [width ? `width:${width}px;max-width:100%` : '', LAYOUT_CSS[layout] ?? ''].filter(Boolean).join(';')
    return `<video src="${escapeAttr(src)}" controls preload="metadata" data-type="video-block"${layout ? ` data-layout="${layout}"` : ''}${style ? ` style="${style}"` : ''}></video>`
  },
  addNodeView() {
    return mediaNodeView('video', {
      create: () => {
        const v = document.createElement('video')
        v.className = 'r-editor__video'
        v.controls = true
        v.preload = 'metadata'
        v.playsInline = true
        return v
      },
      apply: (n, v) => {
        const src = safeUrl(n.attrs.src)
        if (v.getAttribute('src') !== src) v.setAttribute('src', src)
      },
    })
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
      ...sharedAttrs(),
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
    return mediaNodeView('file', {
      create: (editor) => {
        const a = document.createElement('a')
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.className = 'r-editor__file-card'
        a.setAttribute('data-type', 'file-block')
        a.draggable = false

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
        a._parts = { nameEl, sizeEl }
        return a
      },
      apply: (n, a) => {
        a.href = safeUrl(n.attrs.src) || '#'
        a._parts.nameEl.textContent = n.attrs.name || 'File'
        a._parts.sizeEl.textContent = n.attrs.size ? formatBytes(n.attrs.size) : ''
      },
    })
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