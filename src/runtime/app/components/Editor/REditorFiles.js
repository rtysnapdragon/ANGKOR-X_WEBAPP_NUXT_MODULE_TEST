// components/REditor/REditorFiles.js
// File lifecycle for REditor: insert, replace, delete, track, retrieve, upload.
//
// Record shape (what `files`, `update:files` and every file-* event carry):
//   {
//     id,          // stable CLIENT id; also stored on the node as `fileId`
//     url,         // blob: URL while pending, final https URL once uploaded
//     name, size, mime,
//     kind,        // 'image' | 'video' | 'file'
//     source,      // 'local' (picked/dropped/pasted) | 'remote' (existing URL)
//     status,      // 'pending' | 'uploading' | 'uploaded' | 'error'
//     progress,    // 0-100
//     error,       // message | null
//     remoteId,    // server id returned by the upload (if any)
//     file,        // the File to upload (null once uploaded / for remote)
//     createdAt, uploadedAt?
//   }

import { shallowRef, computed, onBeforeUnmount } from 'vue'
import {
  MEDIA_NODE_TYPES, KIND_TO_NODE, NODE_TO_KIND, DEFAULT_ACCEPT, DEFAULT_MAX_SIZE,
  detectKind, kindFromUrl, nameFromUrl, matchesAccept, formatBytes,
  isHttpsUrl, safeUrl, uid, compressImageFile,
} from './REditorMedia'

const ENABLE_KEY = { image: 'imageUpload', video: 'videoUpload', file: 'fileUpload' }
const SIZE_PROP = { image: 'uploadMaxImageSize', video: 'uploadMaxVideoSize', file: 'uploadMaxFileSize' }

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

// XHR (not fetch) so we get real upload progress.
function xhrUpload(cfg, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append(cfg.fieldName || 'file', file, file.name)
    if (cfg.extraFields) Object.entries(cfg.extraFields).forEach(([k, v]) => form.append(k, v))

    xhr.open(cfg.method || 'POST', cfg.url, true)
    xhr.withCredentials = !!cfg.withCredentials
    if (cfg.headers) Object.entries(cfg.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(`Upload failed (${xhr.status})`))
      let json = {}
      try { json = xhr.responseText ? JSON.parse(xhr.responseText) : {} } catch { /* non-JSON body */ }
      const url = getPath(json, cfg.responseUrlKey || 'url')
      const id = getPath(json, cfg.responseIdKey || 'id')
      if (!url) return reject(new Error('Upload response is missing the file URL'))
      resolve({ url, id })
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload aborted'))
    xhr.send(form)
  })
}

export function useEditorFiles({ editorRef, props, emit, opts, strategy }) {
  const files = shallowRef([])
  const blobUrls = new Set()
  const inflight = new Map()
  let healTimer = null

  const isUploading = computed(() => files.value.some(f => f.status === 'uploading'))
  const getEditor = () => editorRef.value?.editor ?? null

  // ── Config per kind ───────────────────────────────────────────────────────
  function kindConfig(kind) {
    const o = opts.value
    return {
      accept: o.accept?.[kind] ?? DEFAULT_ACCEPT[kind],
      maxSize: o.maxSize?.[kind] ?? props[SIZE_PROP[kind]] ?? DEFAULT_MAX_SIZE[kind],
      enabled: o[ENABLE_KEY[kind]] !== false,
    }
  }

  // ── Record bookkeeping ────────────────────────────────────────────────────
  const get = id => files.value.find(f => f.id === id) ?? null
  const emitFiles = () => emit('update:files', files.value)

  function patch(id, changes, { notify = false } = {}) {
    let updated = null
    files.value = files.value.map((f) => {
      if (f.id !== id) return f
      updated = { ...f, ...changes }
      return updated
    })
    if (notify) emitFiles()
    return updated
  }

  function untrackedRecord(node) {
    return {
      id: null,
      url: node.attrs.src,
      name: node.attrs.name || node.attrs.alt || nameFromUrl(node.attrs.src || ''),
      size: node.attrs.size || 0,
      kind: NODE_TO_KIND[node.type.name],
      source: 'remote',
      status: 'uploaded',
    }
  }

  // ── Document scanning ─────────────────────────────────────────────────────
  function docMedia(editor = getEditor()) {
    const out = []
    editor?.state.doc.descendants((node, pos) => {
      if (MEDIA_NODE_TYPES.includes(node.type.name)) {
        out.push({ pos, node })
        return false
      }
      return true
    })
    return out
  }

  const recordForNode = node =>
    files.value.find(f => f.id === node.attrs.fileId)
    ?? files.value.find(f => f.url === node.attrs.src)
    ?? null

  function locate(editor, { pos, src, fileId } = {}) {
    if (pos != null) {
      const n = editor.state.doc.nodeAt(pos)
      if (n && MEDIA_NODE_TYPES.includes(n.type.name) && (!src || n.attrs.src === src)) return { pos, node: n }
    }
    return docMedia(editor).find(m =>
      (fileId && m.node.attrs.fileId === fileId) || (src && m.node.attrs.src === src)) ?? null
  }

  const nodeMatches = (m, rec) =>
    (rec.id && m.node.attrs.fileId === rec.id) || (rec.url && m.node.attrs.src === rec.url)

  // ── Node construction / insertion ─────────────────────────────────────────
  function nodeSpec(record) {
    const type = KIND_TO_NODE[record.kind]
    const base = { fileId: record.id, src: record.url }
    if (type === 'image') return { type, attrs: { ...base, alt: record.name } }
    if (type === 'videoBlock') return { type, attrs: { ...base, name: record.name } }
    return { type, attrs: { ...base, name: record.name, size: record.size } }
  }

  function insertNode(record, pos = null) {
    const editor = getEditor()
    if (!editor) return false
    const chain = editor.chain().focus()
    if (pos == null) chain.insertContent(nodeSpec(record)).run()
    else chain.insertContentAt(pos, nodeSpec(record)).run()
    return true
  }

  // Replaces the node at `target`; returns the node that was replaced.
  function replaceNode(target, record) {
    const editor = getEditor()
    if (!editor) return null
    const hit = locate(editor, target)
    if (!hit) { insertNode(record); return null }
    const spec = nodeSpec(record)
    const nodeType = editor.schema.nodes[spec.type]
    editor.chain().focus().command(({ tr }) => {
      tr.replaceWith(hit.pos, hit.pos + hit.node.nodeSize, nodeType.create(spec.attrs))
      return true
    }).run()
    return hit.node
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(file, kind = detectKind(file.type, file.name)) {
    const cfg = kindConfig(kind)
    if (!cfg.enabled) return { type: 'type', message: `Inserting ${kind} files is disabled` }
    if (!matchesAccept(file, cfg.accept)) return { type: 'type', message: `Unsupported file type: ${file.name}` }
    if (cfg.maxSize && file.size > cfg.maxSize) {
      return { type: 'size', message: `${file.name} is too large (max ${formatBytes(cfg.maxSize)})` }
    }
    return null
  }

  function validateUrl(url, kind) {
    if (!isHttpsUrl(url)) return 'Only HTTPS URLs can be inserted'
    if (!kindConfig(kind ?? kindFromUrl(url)).enabled) return 'This file type is disabled'
    return null
  }

  // ── Insert: local File (instant blob preview, upload deferred) ────────────
  function addLocalFile(file, { kind, pos = null, replaceTarget = null } = {}) {
    kind ??= detectKind(file.type, file.name)
    const error = validate(file, kind)
    if (error) { emit('upload-error', { file, ...error }); return null }

    const url = URL.createObjectURL(file)
    blobUrls.add(url)
    const record = {
      id: uid(), url, name: file.name, size: file.size, mime: file.type, kind,
      source: 'local', status: 'pending', progress: 0, error: null,
      remoteId: null, file, createdAt: Date.now(),
    }
    files.value = [...files.value, record]

    const replaced = replaceTarget ? replaceNode(replaceTarget, record) : (insertNode(record, pos), null)
    emit('file-pending', record)
    emitFiles()
    if (replaceTarget) finishReplace(replaced, record)
    return record
  }

  // ── Insert: existing HTTPS URL (no upload) ────────────────────────────────
  function addRemoteUrl(url, { name, kind, size, mime, id: remoteId, pos = null, replaceTarget = null } = {}) {
    kind ??= kindFromUrl(url)
    const message = validateUrl(url, kind)
    if (message) { emit('upload-error', { url, message, type: 'url' }); return null }

    let record = files.value.find(f => f.url === url) ?? null
    if (!record) {
      record = {
        id: uid(), url, name: name ?? nameFromUrl(url), size: size ?? 0, mime: mime ?? '', kind,
        source: 'remote', status: 'uploaded', progress: 100, error: null,
        remoteId: remoteId ?? null, file: null, createdAt: Date.now(), uploadedAt: Date.now(),
      }
      files.value = [...files.value, record]
    }

    const replaced = replaceTarget ? replaceNode(replaceTarget, record) : (insertNode(record, pos), null)
    emit('file-uploaded', record)
    emitFiles()
    if (replaceTarget) finishReplace(replaced, record)
    return record
  }

  // Pre-register existing remote files (library only — nothing inserted).
  function registerRemoteFiles(list = []) {
    const known = new Set(files.value.map(f => f.url))
    const added = []
    for (const item of list) {
      const url = typeof item === 'string' ? item : item?.url
      if (!url || known.has(url) || !safeUrl(url)) continue
      known.add(url)
      added.push({
        id: uid(), url,
        name: item.name ?? nameFromUrl(url), size: item.size ?? 0, mime: item.mime ?? '',
        kind: item.kind ?? kindFromUrl(url),
        source: 'remote', status: 'uploaded', progress: 100, error: null,
        remoteId: item.id ?? null, file: null, createdAt: Date.now(), uploadedAt: Date.now(),
      })
    }
    if (added.length) { files.value = [...files.value, ...added]; emitFiles() }
  }

  // ── Insert: several Files at once (drop / paste / parent call) ────────────
  async function addFiles(list, { pos = null } = {}) {
    let at = pos
    const added = []
    for (let file of Array.from(list)) {
      const kind = detectKind(file.type, file.name)
      const error = validate(file, kind)
      if (error) { emit('upload-error', { file, ...error }); continue }
      if (kind === 'image' && props.uploadCompress) {
        try {
          file = await compressImageFile(file, { quality: props.uploadCompressQuality, maxPx: props.uploadCompressMaxPx })
        } catch { /* keep the original */ }
      }
      const record = addLocalFile(file, { kind, pos: at })
      if (!record) continue
      at = null // later files follow the selection (which moves past the previous node)
      added.push(record)
      if (strategy.value === 'immediate') uploadRecord(record.id).catch(() => {})
    }
    return added
  }

  // ── Replace bookkeeping ───────────────────────────────────────────────────
  function finishReplace(oldNode, next) {
    const old = oldNode ? (recordForNode(oldNode) ?? untrackedRecord(oldNode)) : null
    if (!old || old.id === next.id) return
    const stillUsed = docMedia().some(m => nodeMatches(m, old))
    emit('file-changed', { old, next })
    if (!stillUsed) retire(old)
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  async function runUpload(record, onProgress) {
    if (typeof props.uploadHandler === 'function') {
      return props.uploadHandler(record.file, onProgress, record)
    }
    if (props.api?.url) return xhrUpload(props.api, record.file, onProgress)
    throw new Error('No upload handler configured. Pass `uploadHandler` or `api`, or upload yourself and call resolveFile().')
  }

  function uploadRecord(id, { onProgress } = {}) {
    const existing = inflight.get(id)
    if (existing) return existing
    const record = get(id)
    if (!record || record.status === 'uploaded' || !record.file) return Promise.resolve(record)

    const job = (async () => {
      patch(id, { status: 'uploading', progress: 0, error: null }, { notify: true })
      const report = (pct) => {
        const percent = Math.min(99, Math.max(0, pct))
        patch(id, { progress: percent })
        onProgress?.(percent)
        emit('file-upload-progress', { record: get(id), percent })
      }
      try {
        const result = await runUpload(record, report)
        if (!result?.url) throw new Error('Upload must resolve with { url }')
        return resolveFile(id, result)
      } catch (error) {
        const next = patch(id, { status: 'error', error: error?.message ?? 'Upload failed' }, { notify: true })
        emit('upload-error', { file: record.file, record: next, message: next?.error, type: 'upload', error })
        throw error
      } finally {
        inflight.delete(id)
      }
    })()
    inflight.set(id, job)
    return job
  }

  // Upload every pending file that is still in the document.
  async function uploadPending({ concurrency = 3, onlyInDocument = true } = {}) {
    const queue = [...getPendingFiles({ onlyInDocument })]
    const uploaded = []
    const failed = []
    const worker = async () => {
      while (queue.length) {
        const rec = queue.shift()
        try { uploaded.push(await uploadRecord(rec.id)) } catch (error) { failed.push({ record: get(rec.id), error }) }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
    const result = { uploaded, failed, ok: failed.length === 0 }
    emit('upload-complete', result)
    return result
  }

  // Parent-controlled flow: the parent uploaded the File itself and now
  // hands back the final URL; blob: URLs in the document are swapped for it.
  function resolveFile(id, { url, id: remoteId, name, size } = {}) {
    const record = get(id)
    if (!record) throw new Error(`Unknown file id: ${id}`)
    if (!safeUrl(url) || url.startsWith('blob:')) throw new Error('resolveFile needs a final http(s) or relative URL')

    const next = patch(id, {
      url, status: 'uploaded', progress: 100, error: null, file: null,
      remoteId: remoteId ?? record.remoteId,
      name: name ?? record.name, size: size ?? record.size, uploadedAt: Date.now(),
    })
    swapSrc(id, url)
    emit('file-uploaded', next)
    emitFiles()
    return next
  }

  // History-neutral src swap (so Undo never resurrects a blob: URL).
  function swapSrc(fileId, url) {
    const editor = getEditor()
    if (!editor) return
    const tr = editor.state.tr
    let changed = false
    docMedia(editor).forEach(({ pos, node }) => {
      if (node.attrs.fileId === fileId && node.attrs.src !== url) {
        tr.setNodeAttribute(pos, 'src', url)
        changed = true
      }
    })
    if (changed) editor.view.dispatch(tr.setMeta('addToHistory', false))
  }

  // Undo of a delete can bring back a node with an old blob: src for a file
  // that has since been uploaded — heal those after the fact.
  function healDoc() {
    healTimer = null
    const editor = getEditor()
    if (!editor || editor.isDestroyed) return
    const tr = editor.state.tr
    let changed = false
    docMedia(editor).forEach(({ pos, node }) => {
      const rec = node.attrs.fileId ? get(node.attrs.fileId) : null
      if (rec?.status === 'uploaded' && rec.url && node.attrs.src !== rec.url) {
        tr.setNodeAttribute(pos, 'src', rec.url)
        changed = true
      }
    })
    if (changed) editor.view.dispatch(tr.setMeta('addToHistory', false))
  }

  function scheduleHeal() {
    if (!files.value.some(f => f.status === 'uploaded' && f.source === 'local')) return
    clearTimeout(healTimer)
    healTimer = setTimeout(healDoc, 150)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function callDeleteApi(record) {
    const cfg = props.api
    if (!cfg?.deleteUrl || record?.remoteId == null || record.source !== 'local') return
    try {
      const res = await fetch(`${cfg.deleteUrl}/${encodeURIComponent(record.remoteId)}`, {
        method: cfg.deleteMethod || 'DELETE',
        headers: cfg.headers || {},
        credentials: cfg.withCredentials ? 'include' : 'same-origin',
      })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
    } catch (error) {
      emit('file-delete-error', { record, error })
    }
  }

  async function retire(record) {
    if (record.id && files.value.some(f => f.id === record.id)) {
      files.value = files.value.filter(f => f.id !== record.id)
      emitFiles()
    }
    emit('file-deleted', record)
    await callDeleteApi(record)
  }

  // Removes the node(s) from the document and stops tracking the file.
  // Pass `pos` to remove one specific node (bubble toolbar); omit it to
  // strip every occurrence (library).
  async function deleteFile(target, { pos = null } = {}) {
    const editor = getEditor()
    const record = typeof target === 'string' ? get(target) : target
    if (!record) return

    if (editor) {
      const ranges = []
      if (pos != null) {
        const n = editor.state.doc.nodeAt(pos)
        if (n && MEDIA_NODE_TYPES.includes(n.type.name)) ranges.push([pos, pos + n.nodeSize])
      } else {
        docMedia(editor).forEach((m) => { if (nodeMatches(m, record)) ranges.push([m.pos, m.pos + m.node.nodeSize]) })
      }
      if (ranges.length) {
        // One transaction, deleted back-to-front so positions stay valid.
        editor.chain().focus().command(({ tr }) => {
          ranges.sort((a, b) => b[0] - a[0]).forEach(([from, to]) => tr.delete(from, to))
          return true
        }).run()
      }
      if (docMedia(editor).some(m => nodeMatches(m, record))) return // still used elsewhere
    }
    await retire(record)
  }

  // ── Retrieval ─────────────────────────────────────────────────────────────
  function getPendingFiles({ includeErrors = true, onlyInDocument = true } = {}) {
    const editor = getEditor()
    const inDoc = editor ? new Set(docMedia(editor).map(m => m.node.attrs.fileId).filter(Boolean)) : null
    return files.value.filter(f =>
      f.file
      && (f.status === 'pending' || (includeErrors && f.status === 'error'))
      && (!onlyInDocument || !inDoc || inDoc.has(f.id)))
  }

  function getUnusedFiles() {
    const editor = getEditor()
    if (!editor) return []
    const inDoc = new Set(docMedia(editor).map(m => m.node.attrs.fileId).filter(Boolean))
    return files.value.filter(f => !inDoc.has(f.id))
  }

  function getDocumentMedia() {
    return docMedia().map(({ pos, node }) => ({
      pos,
      kind: NODE_TO_KIND[node.type.name],
      src: node.attrs.src,
      name: node.attrs.name || node.attrs.alt || '',
      fileId: node.attrs.fileId ?? null,
      record: recordForNode(node),
    }))
  }

  function insertLibraryFile(target) {
    const record = typeof target === 'string' ? get(target) : target
    if (record) insertNode(record)
  }

  onBeforeUnmount(() => {
    clearTimeout(healTimer)
    blobUrls.forEach(url => URL.revokeObjectURL(url))
    blobUrls.clear()
  })

  return {
    files, isUploading, kindConfig, validate, validateUrl,
    addLocalFile, addRemoteUrl, addFiles, registerRemoteFiles,
    uploadRecord, uploadPending, resolveFile,
    deleteFile, insertLibraryFile, recordForNode, untrackedRecord, scheduleHeal,
    getPendingFiles, getUnusedFiles, getDocumentMedia, get,
  }
}
