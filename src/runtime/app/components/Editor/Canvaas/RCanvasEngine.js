// components/RCanvas/RCanvasEngine.js
// Fabric lifecycle for RCanvas: canvas, pages, history, zoom/pan, selection and
// layer state, export. Editing operations live in RCanvasEditing.js.
//
// `fabric` is imported dynamically so SSR never evaluates it (fabric's Node
// entry needs jsdom/canvas). It is the same package/classes you listed:
//   Canvas, Rect, Line (as FabricLine), FabricImage, Path
// plus a few more from 'fabric' that a Canva-style editor needs.

import { clamp, uid } from './RCanvasData'
import { installEditing } from './RCanvasEditing'

// Custom object props that must survive toObject()/loadFromJSON().
export const EXTRA_PROPS = ['id', 'name', 'rcLocked', 'rcFx', 'rcRadius']

export const CONTROL_STYLE = {
  cornerStyle: 'circle',
  cornerColor: '#ffffff',
  cornerStrokeColor: '#8c52ff',
  borderColor: '#8c52ff',
  transparentCorners: false,
  cornerSize: 11,
  touchCornerSize: 30,
  borderScaleFactor: 1.6,
  padding: 0,
}

const MAX_HISTORY = 100
const MIN_ZOOM = 0.05
const MAX_ZOOM = 4
const round = n => Math.round(n * 100) / 100

export async function createEngine({ el, stage, state, width = 1080, height = 1080, onChange }) {
  const fabric = await import('fabric')
  const {
    Canvas, Rect, Line: FabricLine, FabricImage, Path,
    Textbox, Group, ActiveSelection, PencilBrush, Gradient, Shadow, Point, StaticCanvas, util, filters,
  } = fabric
  const K = { Rect, FabricLine, FabricImage, Path, Textbox, Group, ActiveSelection, PencilBrush, Gradient, Shadow, Point, StaticCanvas, util, filters }

  let W = width
  let H = height
  let pageIndex = 0
  let loading = false
  let suppress = false
  let disposed = false
  const pagesData = []                 // [{ id, name, json }]
  const histories = new Map()          // pageId -> { stack: string[], idx }

  const canvas = new Canvas(el, {
    width: W,
    height: H,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: true,
    stopContextMenu: true,
    fireRightClick: true,
    selectionColor: 'rgba(140, 82, 255, 0.08)',
    selectionBorderColor: '#8c52ff',
    selectionLineWidth: 1,
  })

  // ── Type helpers ──────────────────────────────────────────────────────────
  const isGuide = o => !!o?.rcGuide
  const isText = o => o instanceof Textbox
  const isImage = o => o instanceof FabricImage
  const kindOf = (o) => {
    if (o instanceof ActiveSelection) return 'multi'
    if (o instanceof Group) return 'group'
    if (o instanceof Textbox) return 'text'
    if (o instanceof FabricImage) return 'image'
    if (o instanceof FabricLine) return 'line'
    return 'shape'
  }
  const LABELS = { text: 'Text', image: 'Image', line: 'Line', shape: 'Shape', group: 'Group' }
  const nameOf = (o) => {
    if (o.name) return o.name
    if (isText(o)) return (o.text || 'Text').replace(/\s+/g, ' ').slice(0, 26)
    return LABELS[kindOf(o)] ?? 'Object'
  }

  function prepObject(o) {
    if (!o || isGuide(o)) return
    if (!o.id) o.id = uid()
    o.set(CONTROL_STYLE)
    if (isText(o)) {
      o.setControlsVisibility?.({ mt: false, mb: false })
      // Keep fabric's hidden <textarea> inside our DOM so a modal's focus trap
      // (e.g. REditor's RModal) cannot steal focus while typing.
      o.hiddenTextareaContainer = canvas.wrapperEl
    }
    ctx.applyLock?.(o)
  }

  // ── Serialization ─────────────────────────────────────────────────────────
  const blankJson = (bg = '#ffffff') => ({ version: 'rcanvas', objects: [], background: bg })
  const serializePage = () => canvas.toObject(EXTRA_PROPS)

  async function loadJSON(json) {
    loading = true
    try {
      canvas.discardActiveObject()
      await canvas.loadFromJSON(json ?? blankJson())
      canvas.getObjects().forEach(prepObject)
      applyBackgroundSize()
    }
    finally { loading = false }
    canvas.requestRenderAll()
    refreshNow()
  }

  // ── History (per page) ────────────────────────────────────────────────────
  const hist = () => {
    const id = pagesData[pageIndex].id
    let h = histories.get(id)
    if (!h) {
      h = { stack: [JSON.stringify(serializePage())], idx: 0 }
      histories.set(id, h)
    }
    return h
  }
  function flags() {
    const h = hist()
    state.canUndo = h.idx > 0
    state.canRedo = h.idx < h.stack.length - 1
  }
  function pushHistory() {
    const obj = serializePage()
    pagesData[pageIndex].json = obj
    const json = JSON.stringify(obj)
    const h = hist()
    if (h.stack[h.idx] === json) return
    h.stack.length = h.idx + 1
    h.stack.push(json)
    if (h.stack.length > MAX_HISTORY) h.stack.shift()
    h.idx = h.stack.length - 1
    flags()
  }

  let commitTimer = null
  function runCommit() {
    commitTimer = null
    if (disposed) return
    pushHistory()
    onChange?.()
    scheduleThumb()
  }
  function commit(immediate = false) {
    if (loading || suppress || disposed) return
    clearTimeout(commitTimer)
    if (immediate) runCommit()
    else commitTimer = setTimeout(runCommit, 150)
  }
  function flushCommit() {
    if (commitTimer) { clearTimeout(commitTimer); runCommit() }
  }
  function resetHistory() {
    histories.clear()
    hist()
    flags()
  }

  async function stepHistory(dir) {
    flushCommit()
    const h = hist()
    const next = h.idx + dir
    if (next < 0 || next >= h.stack.length) return
    h.idx = next
    await loadJSON(JSON.parse(h.stack[next]))
    pagesData[pageIndex].json = JSON.parse(h.stack[next])
    flags()
    onChange?.()
    scheduleThumb()
  }
  const undo = () => stepHistory(-1)
  const redo = () => stepHistory(1)

  // ── Zoom / pan ────────────────────────────────────────────────────────────
  function applyZoom(z) {
    z = clamp(z, MIN_ZOOM, MAX_ZOOM)
    canvas.setDimensions({ width: Math.round(W * z), height: Math.round(H * z) })
    canvas.setZoom(z)
    state.zoom = z
  }
  function fit() {
    const pad = 56
    const sw = Math.max(120, stage.clientWidth - pad * 2)
    const sh = Math.max(120, stage.clientHeight - pad * 2)
    state.autoFit = true
    applyZoom(Math.min(sw / W, sh / H, 2))
    stage.scrollLeft = 0
    stage.scrollTop = 0
  }
  function zoomAt(next, clientX, clientY) {
    next = clamp(next, MIN_ZOOM, MAX_ZOOM)
    const prev = canvas.getZoom()
    if (next === prev) return
    const rect = canvas.upperCanvasEl.getBoundingClientRect()
    const sr = stage.getBoundingClientRect()
    const cx = clientX ?? sr.left + sr.width / 2
    const cy = clientY ?? sr.top + sr.height / 2
    const sx = (cx - rect.left) / prev
    const sy = (cy - rect.top) / prev
    state.autoFit = false
    applyZoom(next)
    const r2 = canvas.upperCanvasEl.getBoundingClientRect()
    stage.scrollLeft += r2.left + sx * next - cx
    stage.scrollTop += r2.top + sy * next - cy
  }
  const zoomBy = (factor, cx, cy) => zoomAt(canvas.getZoom() * factor, cx, cy)
  const zoomTo = z => zoomAt(z)

  // Run `fn` with the viewport reset, so exports are at design size.
  function withUnzoomed(fn) {
    const z = canvas.getZoom()
    const vpt = canvas.viewportTransform.slice()
    const active = canvas.getActiveObjects()
    canvas.discardActiveObject()
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setDimensions({ width: W, height: H })
    try { return fn() }
    finally {
      canvas.setViewportTransform(vpt)
      canvas.setDimensions({ width: Math.round(W * z), height: Math.round(H * z) })
      if (active.length === 1) canvas.setActiveObject(active[0])
      canvas.requestRenderAll()
    }
  }

  // ── Background / size ─────────────────────────────────────────────────────
  function applyBackgroundSize() {
    const bg = canvas.backgroundColor
    if (bg && typeof bg === 'object' && bg.coords) bg.coords = { ...bg.coords, x1: 0, y1: 0, x2: W, y2: H }
  }
  function setBackground(v) {
    if (typeof v === 'string') canvas.backgroundColor = v
    else if (v?.gradient?.length > 1) {
      const stops = v.gradient
      canvas.backgroundColor = new Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: { x1: 0, y1: 0, x2: W, y2: H },
        colorStops: stops.map((color, i) => ({ offset: i / (stops.length - 1), color })),
      })
    }
    canvas.requestRenderAll()
    refresh()
    commit()
  }
  function setSize(w, h) {
    W = Math.round(clamp(w, 50, 8000))
    H = Math.round(clamp(h, 50, 8000))
    state.width = W
    state.height = H
    applyBackgroundSize()
    if (state.autoFit) fit()
    else applyZoom(canvas.getZoom())
    commit(true)
  }

  // ── State sync (rAF-coalesced) ────────────────────────────────────────────
  let raf = 0
  function refresh() {
    if (raf || disposed) return
    raf = requestAnimationFrame(() => { raf = 0; refreshNow() })
  }
  function refreshNow() {
    if (disposed) return
    syncSelection()
    syncLayers()
  }

  function syncLayers() {
    state.layers = canvas.getObjects().filter(o => !isGuide(o)).map(o => ({
      id: o.id, name: nameOf(o), kind: kindOf(o), visible: o.visible !== false, locked: !!o.rcLocked,
    })).reverse()
    state.selectedIds = canvas.getActiveObjects().map(o => o.id)
    const bg = canvas.backgroundColor
    state.bg = typeof bg === 'string' ? bg : '#gradient'
  }

  function syncSelection() {
    const active = canvas.getActiveObject()
    if (active && !active.__styled) { active.set(CONTROL_STYLE); active.__styled = true }
    const objs = canvas.getActiveObjects().filter(o => !isGuide(o))
    if (!objs.length) { state.sel = null; return }
    const o = objs[0]
    const t = objs.find(isText)
    const img = objs.find(isImage)
    const bb = active ? ctx.bbox(active) : null
    const bold = t && (t.fontWeight === 'bold' || Number(t.fontWeight) >= 600)
    state.sel = {
      count: objs.length,
      kind: objs.length > 1 ? 'multi' : kindOf(o),
      locked: objs.every(x => x.rcLocked),
      hasText: !!t,
      hasImage: !!img,
      fill: typeof o.fill === 'string' ? o.fill : null,
      stroke: typeof o.stroke === 'string' ? o.stroke : null,
      strokeWidth: o.strokeWidth ?? 0,
      opacity: o.opacity ?? 1,
      angle: Math.round(o.angle || 0),
      shadow: !!o.shadow,
      radius: o instanceof Rect ? (o.rx || 0) : (o.rcRadius || 0),
      isRect: objs.length === 1 && o instanceof Rect,
      fontFamily: t?.fontFamily ?? null,
      fontSize: t ? Math.round(t.fontSize) : null,
      bold: !!bold,
      italic: t?.fontStyle === 'italic',
      underline: !!t?.underline,
      linethrough: !!t?.linethrough,
      textAlign: t?.textAlign ?? 'left',
      lineHeight: t?.lineHeight ?? 1.16,
      charSpacing: t?.charSpacing ?? 0,
      fx: { brightness: 0, contrast: 0, saturation: 0, blur: 0, ...(img?.rcFx || {}) },
      rect: bb ? { x: Math.round(bb.l), y: Math.round(bb.t), w: Math.round(bb.r - bb.l), h: Math.round(bb.b - bb.t) } : null,
    }
  }

  // ── Pages / document ──────────────────────────────────────────────────────
  function syncPages() {
    const old = new Map(state.pages.map(p => [p.id, p.thumb]))
    state.pages = pagesData.map(p => ({ id: p.id, name: p.name, thumb: old.get(p.id) ?? '' }))
    state.pageIndex = pageIndex
  }
  function saveCurrent() {
    if (pagesData[pageIndex]) pagesData[pageIndex].json = serializePage()
  }

  async function renderThumb(json) {
    const sc = new StaticCanvas(document.createElement('canvas'), { width: W, height: H, renderOnAddRemove: false })
    try {
      await sc.loadFromJSON(json)
      sc.renderAll()
      return sc.toDataURL({ format: 'jpeg', quality: 0.6, multiplier: clamp(220 / Math.max(W, H), 0.02, 1) })
    }
    catch { return '' }   // tainted (CORS) images, etc.
    finally { sc.dispose() }
  }
  let thumbTimer = null
  function scheduleThumb() {
    clearTimeout(thumbTimer)
    thumbTimer = setTimeout(() => updateThumb(pageIndex), 600)
  }
  async function updateThumb(i) {
    const p = pagesData[i]
    if (!p || disposed) return
    const thumb = await renderThumb(p.json ?? blankJson())
    const entry = state.pages.find(x => x.id === p.id)
    if (entry && !disposed) entry.thumb = thumb
  }
  async function updateAllThumbs() {
    for (let i = 0; i < pagesData.length && !disposed; i++) await updateThumb(i)
  }

  async function goToPage(i) {
    if (i < 0 || i >= pagesData.length) return
    flushCommit()
    saveCurrent()
    pageIndex = i
    state.pageIndex = i
    await loadJSON(pagesData[i].json)
    hist()
    flags()
  }
  async function addPage({ json = null, name } = {}) {
    flushCommit()
    saveCurrent()
    const at = pageIndex + 1
    pagesData.splice(at, 0, { id: uid(), name: name ?? `Page ${pagesData.length + 1}`, json: json ?? blankJson() })
    syncPages()
    await goToPage(at)
    updateThumb(at)
    onChange?.()
  }
  async function duplicatePage(i = pageIndex) {
    flushCommit()
    saveCurrent()
    const src = pagesData[i]
    if (!src) return
    await addPage({ json: JSON.parse(JSON.stringify(src.json)), name: `${src.name} copy` })
  }
  async function deletePage(i = pageIndex) {
    if (pagesData.length <= 1) {
      await loadJSON(blankJson())
      pushHistory()
      onChange?.()
      scheduleThumb()
      return
    }
    flushCommit()
    const removedId = pagesData[i].id
    pagesData.splice(i, 1)
    histories.delete(removedId)
    pageIndex = clamp(i === pageIndex ? Math.min(i, pagesData.length - 1) : (i < pageIndex ? pageIndex - 1 : pageIndex), 0, pagesData.length - 1)
    syncPages()
    await loadJSON(pagesData[pageIndex].json)
    hist()
    flags()
    onChange?.()
  }
  function movePage(from, to) {
    if (from === to || to < 0 || to >= pagesData.length) return
    flushCommit()
    saveCurrent()
    const currentId = pagesData[pageIndex].id
    const [p] = pagesData.splice(from, 1)
    pagesData.splice(to, 0, p)
    pageIndex = pagesData.findIndex(x => x.id === currentId)
    syncPages()
    onChange?.()
  }
  function renamePage(i, name) {
    if (!pagesData[i]) return
    pagesData[i].name = name || pagesData[i].name
    syncPages()
    onChange?.()
  }

  function getDocument() {
    flushCommit()
    saveCurrent()
    return {
      version: 1,
      width: W,
      height: H,
      current: pageIndex,
      pages: pagesData.map(p => ({ id: p.id, name: p.name, json: p.json })),
    }
  }

  function normalizeDoc(input) {
    let d = input
    if (typeof d === 'string') { try { d = JSON.parse(d) } catch { d = null } }
    if (d?.pages?.length) {
      return {
        width: d.width || W,
        height: d.height || H,
        current: d.current || 0,
        pages: d.pages.map((p, i) => ({ id: p.id || uid(), name: p.name || `Page ${i + 1}`, json: p.json ?? blankJson() })),
      }
    }
    if (d?.objects) return { width: d.width || W, height: d.height || H, current: 0, pages: [{ id: uid(), name: 'Page 1', json: d }] }
    return { width: W, height: H, current: 0, pages: [{ id: uid(), name: 'Page 1', json: blankJson() }] }
  }

  async function loadDocument(input) {
    flushCommit()
    state.busy = true
    try {
      const d = normalizeDoc(input)
      W = d.width
      H = d.height
      state.width = W
      state.height = H
      pagesData.length = 0
      pagesData.push(...d.pages)
      histories.clear()
      pageIndex = clamp(d.current, 0, pagesData.length - 1)
      syncPages()
      await loadJSON(pagesData[pageIndex].json)
      hist()
      flags()
      fit()
      updateAllThumbs()
    }
    finally { state.busy = false }
  }

  // Start a new document from an image (size = image size, capped).
  async function loadImageDocument(url, { maxSide = 4096 } = {}) {
    state.busy = true
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
      const s = Math.min(1, maxSide / Math.max(img.width, img.height))
      await loadDocument({ width: Math.round(img.width * s), height: Math.round(img.height * s), pages: [{ name: 'Image', json: blankJson() }] })
      img.set({ left: 0, top: 0, scaleX: s, scaleY: s })
      canvas.add(img)
      canvas.setActiveObject(img)
      resetHistory()
      pushHistory()
      refreshNow()
      updateThumb(0)
    }
    finally { state.busy = false }
  }

  // ── Export ────────────────────────────────────────────────────────────────
  const MIME = { png: 'image/png', jpeg: 'image/jpeg', jpg: 'image/jpeg', webp: 'image/webp' }
  function exportBlob({ format = 'png', scale = 1, quality = 0.92 } = {}) {
    return new Promise((resolve, reject) => {
      try {
        const mime = MIME[format] ?? 'image/png'
        const out = withUnzoomed(() => canvas.toCanvasElement(scale))
        out.toBlob(b => (b ? resolve(b) : reject(new Error('Export failed'))), mime, quality)
      }
      catch (e) {
        reject(e?.name === 'SecurityError'
          ? new Error('An image on the canvas blocks export (CORS). Re-add it from an upload or a CORS-enabled URL.')
          : e)
      }
    })
  }
  const exportSVG = () => withUnzoomed(() => canvas.toSVG())
  const exportJSON = () => JSON.stringify(getDocument())

  async function exportPages(options = {}) {
    const start = pageIndex
    state.busy = true
    const out = []
    try {
      for (let i = 0; i < pagesData.length; i++) {
        await goToPage(i)
        out.push({ name: pagesData[i].name, blob: await exportBlob(options) })
      }
    }
    finally {
      await goToPage(start)
      state.busy = false
    }
    return out
  }

  // ── Tools ─────────────────────────────────────────────────────────────────
  function setTool(tool) {
    state.tool = tool
    canvas.isDrawingMode = tool === 'draw'
    if (tool === 'draw') {
      canvas.discardActiveObject()
      const brush = new PencilBrush(canvas)
      brush.color = state.pen.color
      brush.width = state.pen.width
      brush.strokeLineCap = 'round'
      brush.strokeLineJoin = 'round'
      canvas.freeDrawingBrush = brush
    }
    canvas.requestRenderAll()
    refresh()
  }
  function setPen(patch) {
    Object.assign(state.pen, patch)
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = state.pen.color
      canvas.freeDrawingBrush.width = state.pen.width
    }
  }

  // ── Context shared with the editing module ────────────────────────────────
  const ctx = {
    fabric, K, canvas, state, stage, EXTRA_PROPS, CONTROL_STYLE,
    isGuide, isText, isImage, kindOf, nameOf, prepObject,
    commit, flushCommit, refresh, refreshNow, resetHistory, pushHistory,
    setSize, setBackground, undo, redo,
    setSuppress: (v) => { suppress = v },
    size: () => ({ W, H }),
    zoom: () => canvas.getZoom(),
    zoomBy, fit,
    bbox(o) {
      o.setCoords()
      const c = o.getCoords()
      const xs = c.map(p => p.x)
      const ys = c.map(p => p.y)
      return { l: Math.min(...xs), t: Math.min(...ys), r: Math.max(...xs), b: Math.max(...ys) }
    },
  }
  const editing = installEditing(ctx)

  // ── Canvas events ─────────────────────────────────────────────────────────
  let lastCorner = null
  let spaceDown = false
  let panning = false
  let panStart = null
  const pt = e => e.touches?.[0] ?? e

  canvas.on('selection:created', refresh)
  canvas.on('selection:updated', refresh)
  canvas.on('selection:cleared', refresh)
  canvas.on('object:moving', refresh)
  canvas.on('object:scaling', refresh)
  canvas.on('object:rotating', refresh)

  canvas.on('object:added', ({ target }) => {
    if (isGuide(target)) return
    prepObject(target)
    refresh()
    commit()
  })
  canvas.on('object:removed', ({ target }) => {
    if (isGuide(target)) return
    refresh()
    commit()
  })
  canvas.on('object:modified', (e) => {
    if (isGuide(e.target)) return
    editing.normalizeScale(e.target, e.transform?.corner ?? lastCorner)
    refresh()
    commit()
  })
  canvas.on('text:changed', () => { refresh(); commit() })
  canvas.on('text:editing:exited', () => { refresh(); commit(true) })
  canvas.on('path:created', ({ path }) => {
    if (!path) return
    path.set({ strokeUniform: true, fill: null })
    prepObject(path)
    commit()
  })

  canvas.on('mouse:down', (opt) => {
    stage.focus?.({ preventScroll: true })
    lastCorner = opt.transform?.corner ?? null
    const e = opt.e
    if (spaceDown || e.button === 1) {
      panning = true
      const p = pt(e)
      panStart = { x: p.clientX, y: p.clientY, sl: stage.scrollLeft, st: stage.scrollTop }
      canvas.setCursor?.('grabbing')
      e.preventDefault?.()
    }
  })
  canvas.on('mouse:move', (opt) => {
    if (!panning || !panStart) return
    const p = pt(opt.e)
    stage.scrollLeft = panStart.sl - (p.clientX - panStart.x)
    stage.scrollTop = panStart.st - (p.clientY - panStart.y)
  })
  canvas.on('mouse:up', () => { panning = false; panStart = null })

  const onWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY)
  }
  stage.addEventListener('wheel', onWheel, { passive: false })

  const setSpace = (down) => {
    if (spaceDown === down) return
    spaceDown = down
    canvas.skipTargetFind = down
    canvas.selection = !down
    canvas.defaultCursor = down ? 'grab' : 'default'
    canvas.setCursor?.(down ? 'grab' : 'default')
  }

  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => { if (state.autoFit && !disposed) fit() })
    : null
  ro?.observe(stage)

  // ── Boot ──────────────────────────────────────────────────────────────────
  pagesData.push({ id: uid(), name: 'Page 1', json: blankJson() })
  syncPages()
  state.width = W
  state.height = H
  hist()
  flags()
  fit()
  refreshNow()

  function dispose() {
    disposed = true
    clearTimeout(commitTimer)
    clearTimeout(thumbTimer)
    cancelAnimationFrame(raf)
    ro?.disconnect()
    stage.removeEventListener('wheel', onWheel)
    canvas.dispose?.()
  }

  return {
    ...editing,
    canvas,
    fabric,
    K,
    // history / zoom
    undo, redo, fit, zoomBy, zoomTo, setSpace,
    // doc
    getDocument, loadDocument, loadImageDocument, setBackground, setSize,
    addPage, duplicatePage, deletePage, movePage, renamePage, goToPage,
    // export
    exportBlob, exportSVG, exportJSON, exportPages,
    // tools
    setTool, setPen,
    // internals the UI may need
    commit, refresh, kindOf,
    dispose,
  }
}
