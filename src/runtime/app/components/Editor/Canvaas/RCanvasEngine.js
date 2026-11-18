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
export const EXTRA_PROPS = ['id', 'name', 'rcLocked', 'rcFx', 'rcRadius', 'rcBase', 'rcFrame', 'rcParent']

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

export async function createEngine({ el, stage, state, width = 1080, height = 1080, onChange, wheelZoom = false }) {
  const fabric = await import('fabric')
  const {
    Canvas, Rect, Line: FabricLine, FabricImage, Path,
    Textbox, Group, ActiveSelection, PencilBrush, Gradient, Shadow, Point, StaticCanvas, util, filters,
  } = fabric
  const K = { Rect, FabricLine, FabricImage, Path, Textbox, Group, ActiveSelection, PencilBrush, Gradient, Shadow, Point, StaticCanvas, util, filters }

  let W = width
  let H = height
  let pageIndex = 0
  let originalFrame = null
  let originalBackground = null
  let loading = false

  function cloneData(value) {
    if (value == null || typeof value === 'string') return value
    try {
      return JSON.parse(JSON.stringify(value))
    }
    catch {
      return value
    }
  }
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
  const isFrame = o => !!o?.rcFrame
  const kindOf = (o) => {
    if (o instanceof ActiveSelection) return 'multi'
    if (isFrame(o)) return 'frame'
    if (o instanceof Group) return 'group'
    if (o instanceof Textbox) return 'text'
    if (o instanceof FabricImage) return 'image'
    if (o instanceof FabricLine) return 'line'
    return 'shape'
  }
  const LABELS = { text: 'Text', image: 'Image', line: 'Line', shape: 'Shape', group: 'Group', frame: 'Frame' }
  const nameOf = (o) => {
    if (o.name) return o.name
    if (isText(o)) return (o.text || 'Text').replace(/\s+/g, ' ').slice(0, 26)
    return LABELS[kindOf(o)] ?? 'Object'
  }

  function imageNaturalSize(o) {
    const el = o?._originalElement || o?._element || o?.getElement?.()
    const w = Number(el?.naturalWidth || el?.videoWidth || el?.width || o?.width || 0)
    const h = Number(el?.naturalHeight || el?.videoHeight || el?.height || o?.height || 0)
    return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) }
  }

  function imageFileInfo(o) {
    const src = o?.getSrc?.() || ''
    const mime = /^data:([^;,]+)/i.exec(src)?.[1] || ''
    const ext = /\.([a-z0-9]+)(?:[?#]|$)/i.exec(src)?.[1] || ''
    const type = (mime ? mime.split('/').pop() : ext || 'image').toUpperCase()
    let name = 'Image'
    if (src && !src.startsWith('data:')) {
      try {
        const clean = src.split('?')[0].split('#')[0]
        name = decodeURIComponent(clean.split('/').pop() || 'Image')
      }
      catch { name = 'Image' }
    }
    else if (mime) {
      name = `Image.${mime.split('/').pop() || 'png'}`
    }
    return { name, type }
  }

  // ── Frames ────────────────────────────────────────────────────────────────
  const frames = () => canvas.getObjects().filter(o => isFrame(o) && !isGuide(o))
  const frameById = id => frames().find(o => o.id === id) || null
  const childrenOf = (frame) => {
    const id = typeof frame === 'string' ? frame : frame?.id
    return id ? canvas.getObjects().filter(o => o.rcParent === id) : []
  }

  function rotatePoint(p, c, deg) {
    const a = (deg * Math.PI) / 180
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const dx = p.x - c.x
    const dy = p.y - c.y
    return new Point(c.x + dx * cos - dy * sin, c.y + dx * sin + dy * cos)
  }

  function frameClipRect(frame) {
    const c = frame.getCenterPoint()
    return new Rect({
      left: c.x,
      top: c.y,
      width: Math.abs(frame.getScaledWidth()),
      height: Math.abs(frame.getScaledHeight()),
      originX: 'center',
      originY: 'center',
      angle: frame.angle || 0,
      rx: frame.rx || 0,
      ry: frame.ry || 0,
      absolutePositioned: true,
      fill: '#000',
      strokeWidth: 0,
      selectable: false,
      evented: false,
      objectCaching: false,
      rcFrameClip: true,
    })
  }

  function unassignFromFrame(o) {
    if (!o) return
    o.rcParent = null
    if (o.clipPath?.rcFrameClip) o.set('clipPath', null)
    o.dirty = true
  }

  function syncFrameClip(o, frame = null) {
    if (!o || isGuide(o) || isFrame(o)) return
    const f = frame || (o.rcParent ? frameById(o.rcParent) : null)
    if (!f) {
      unassignFromFrame(o)
      return
    }
    o.rcParent = f.id
    const c = f.getCenterPoint()
    const clip = o.clipPath
    if (clip?.rcFrameClip) {
      clip.set({
        left: c.x,
        top: c.y,
        width: Math.abs(f.getScaledWidth()),
        height: Math.abs(f.getScaledHeight()),
        angle: f.angle || 0,
        rx: f.rx || 0,
        ry: f.ry || 0,
      })
      clip.setCoords?.()
    }
    else {
      o.set('clipPath', frameClipRect(f))
    }
    o.dirty = true
  }

  function syncFrameClips(frame) {
    if (frame) childrenOf(frame).forEach(o => syncFrameClip(o, frame))
  }

  function syncAllFrameClips() {
    const ids = new Set(frames().map(o => o.id))
    canvas.getObjects().forEach((o) => {
      if (isGuide(o) || isFrame(o) || !o.rcParent) return
      if (!ids.has(o.rcParent)) unassignFromFrame(o)
      else syncFrameClip(o)
    })
    frames().forEach(syncFrameClips)
  }

  function frameAt(x, y, exclude = null) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    const p = new Point(x, y)
    const list = frames()
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i]
      if (f === exclude || f.visible === false) continue
      f.setCoords()
      if (f.containsPoint(p)) return f
    }
    return null
  }

  function assignToFrame(o, frame) {
    if (!o || !frame || isGuide(o) || isFrame(o)) return null
    o.rcParent = frame.id
    const objects = canvas.getObjects()
    const fi = objects.indexOf(frame)
    const oi = objects.indexOf(o)
    if (fi >= 0 && oi >= 0 && oi < fi) canvas.moveObjectTo(o, fi + 1)
    syncFrameClip(o, frame)
    return frame
  }

  function moveFrameBy(frame, dx, dy) {
    if (!frame || (!dx && !dy)) return
    childrenOf(frame).forEach((o) => {
      o.set({ left: o.left + dx, top: o.top + dy })
      o.setCoords?.()
      const clip = o.clipPath
      if (clip?.rcFrameClip) {
        clip.set({ left: clip.left + dx, top: clip.top + dy })
        clip.setCoords?.()
      }
      o.dirty = true
    })
  }

  function updateParentFor(o) {
    if (!o || isGuide(o) || isFrame(o)) return
    const c = o.getCenterPoint()
    const parent = o.rcParent ? frameById(o.rcParent) : null
    if (parent) {
      parent.setCoords()
      if (parent.containsPoint(c)) return
    }
    const next = frameAt(c.x, c.y, o)
    if (next) assignToFrame(o, next)
    else unassignFromFrame(o)
  }

  function frameScreenInfo(frame, selectedIds) {
    const page = canvas.upperCanvasEl?.parentElement?.parentElement ?? stage
    const rect = frame.getBoundingRect()
    const p = util.transformPoint({ x: rect.left, y: rect.top }, canvas.viewportTransform)
    const ur = canvas.upperCanvasEl.getBoundingClientRect()
    const pr = page.getBoundingClientRect()
    const zoom = canvas.getZoom()
    return {
      id: frame.id,
      name: nameOf(frame),
      selected: selectedIds.has(frame.id),
      left: Math.round(p.x + ur.left - pr.left),
      top: Math.round(p.y + ur.top - pr.top - 20),
      width: Math.round(rect.width * zoom),
      height: Math.round(rect.height * zoom),
      locked: !!frame.rcLocked,
    }
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
  const serializePage = () => {
    const active = canvas.getActiveObject()
    if (!(active instanceof ActiveSelection)) return canvas.toObject(EXTRA_PROPS)
    const objects = active.getObjects().slice()
    active.removeAll()
    const json = canvas.toObject(EXTRA_PROPS)
    if (objects.length > 1) canvas.setActiveObject(new ActiveSelection(objects, { canvas }))
    else if (objects.length === 1) canvas.setActiveObject(objects[0])
    canvas.requestRenderAll()
    return json
  }

  async function loadJSON(json) {
    loading = true
    try {
      canvas.discardActiveObject()
      await canvas.loadFromJSON(json ?? blankJson())
      canvas.getObjects().forEach(prepObject)
      syncAllFrameClips()
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
    refresh()
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
    const selectedIds = canvas.getActiveObjects().map(o => o.id)
    state.layers = canvas.getObjects().filter(o => !isGuide(o)).map(o => ({
      id: o.id, name: nameOf(o), kind: kindOf(o), visible: o.visible !== false, locked: !!o.rcLocked,
      parentId: o.rcParent || null, frame: isFrame(o),
    })).reverse()
    state.selectedIds = selectedIds
    state.frames = frames()
      .filter(o => o.visible !== false)
      .map(o => frameScreenInfo(o, new Set(selectedIds)))
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
    const imageSize = img ? imageNaturalSize(img) : null
    const imageMeta = img ? imageFileInfo(img) : null
    const imageCropW = img ? Math.max(1, Number(img.width) || imageSize.w) : null
    const imageCropH = img ? Math.max(1, Number(img.height) || imageSize.h) : null
    const imageCropped = img
      ? (Number(img.cropX) || 0) > 0.5 || (Number(img.cropY) || 0) > 0.5
      || imageCropW < imageSize.w - 0.5 || imageCropH < imageSize.h - 0.5
      : false
    const cropRatio = img ? Math.round((img.getScaledWidth() / img.getScaledHeight()) * 10000) / 10000 : null
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
      cropRatio,
      imageCropped,
      imageName: imageMeta?.name ?? null,
      imageType: imageMeta?.type ?? null,
      imageNaturalWidth: imageSize?.w ?? null,
      imageNaturalHeight: imageSize?.h ?? null,
      imageCropWidth: imageCropW,
      imageCropHeight: imageCropH,
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
      originalFrame: originalFrame ? { ...originalFrame } : null,
      originalBackground: cloneData(originalBackground),
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
        originalFrame: d.originalFrame ?? null,
        originalBackground: d.originalBackground ?? null,
        pages: d.pages.map((p, i) => ({ id: p.id || uid(), name: p.name || `Page ${i + 1}`, json: p.json ?? blankJson() })),
      }
    }
    if (d?.objects) return { width: d.width || W, height: d.height || H, current: 0, originalFrame: null, originalBackground: null, pages: [{ id: uid(), name: 'Page 1', json: d }] }
    return { width: W, height: H, current: 0, originalFrame: null, originalBackground: null, pages: [{ id: uid(), name: 'Page 1', json: blankJson() }] }
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
      originalFrame = d.originalFrame ? { ...d.originalFrame } : null
      originalBackground = cloneData(d.originalBackground)
      pagesData.length = 0
      pagesData.push(...d.pages)
      histories.clear()
      pageIndex = clamp(d.current, 0, pagesData.length - 1)
      syncPages()
      await loadJSON(pagesData[pageIndex].json)
      if (!originalFrame && (canvas.getObjects().some(o => o.rcBase) || pagesData[pageIndex]?.name === 'Image')) {
        originalFrame = { width: W, height: H }
      }
      if (originalBackground == null) originalBackground = cloneData(canvas.backgroundColor)
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
      originalFrame = { width: W, height: H }
      originalBackground = cloneData(canvas.backgroundColor)
      img.set({ left: 0, top: 0, scaleX: s, scaleY: s, rcBase: true })
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
  function sameData(a, b) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  function frameCropRect() {
    if (!originalFrame) return null
    if (W !== originalFrame.width || H !== originalFrame.height) return null
    if (!sameData(canvas.backgroundColor, originalBackground)) return null
    const objects = canvas.getObjects().filter(o => !isGuide(o) && o.visible !== false)
    for (const o of objects) {
      const r = o.getBoundingRect()
      if (r.left < -1 || r.top < -1 || r.left + r.width > originalFrame.width + 1 || r.top + r.height > originalFrame.height + 1) return null
      if (!o.rcBase && (o.rcFrame || /frame/i.test(o.name || ''))) return null
    }
    return { left: 0, top: 0, width: originalFrame.width, height: originalFrame.height }
  }
  function exportBlob({ format = 'png', scale = 1, quality = 0.92, crop = 'auto' } = {}) {
    return new Promise((resolve, reject) => {
      try {
        const mime = MIME[format] ?? 'image/png'
        const rect = crop === 'auto' ? frameCropRect() : crop
        const out = withUnzoomed(() => (rect ? canvas.toCanvasElement(scale, rect) : canvas.toCanvasElement(scale)))
        out.toBlob(b => (b ? resolve(b) : reject(new Error('Export failed'))), mime, quality)
      }
      catch (e) {
        reject(e?.name === 'SecurityError'
          ? new Error('An image on the canvas blocks export (CORS). Re-add it from an upload or a CORS-enabled URL.')
          : e)
      }
    })
  }
  function exportFrameBlob(id, options = {}) {
    const frame = frameById(id)
    if (!frame) return Promise.reject(new Error('Frame not found'))
    const r = frame.getBoundingRect()
    return exportBlob({
      ...options,
      crop: { left: r.left, top: r.top, width: r.width, height: r.height },
    })
  }
  async function exportFrames(options = {}) {
    const out = []
    for (const frame of frames().filter(o => o.visible !== false)) {
      out.push({ id: frame.id, name: nameOf(frame), blob: await exportFrameBlob(frame.id, options) })
    }
    return out
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
    isGuide, isText, isImage, isFrame, kindOf, nameOf, prepObject, imageNaturalSize,
    frames, frameById, childrenOf, frameAt, assignToFrame, unassignFromFrame,
    syncFrameClip, syncFrameClips, syncAllFrameClips, moveFrameBy, updateParentFor,
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

  let frameMove = null
  let frameTurn = null

  canvas.on('selection:created', refresh)
  canvas.on('selection:updated', refresh)
  canvas.on('selection:cleared', refresh)
  canvas.on('object:moving', ({ target }) => {
    if (isFrame(target)) {
      const c = target.getCenterPoint()
      if (!frameMove || frameMove.id !== target.id) frameMove = { id: target.id, x: c.x, y: c.y }
      const dx = c.x - frameMove.x
      const dy = c.y - frameMove.y
      if (dx || dy) {
        moveFrameBy(target, dx, dy)
        frameMove.x = c.x
        frameMove.y = c.y
      }
    }
    refresh()
  })
  canvas.on('object:scaling', ({ target }) => {
    if (isFrame(target)) syncFrameClips(target)
    refresh()
  })
  canvas.on('object:rotating', ({ target }) => {
    if (isFrame(target)) {
      if (!frameTurn || frameTurn.id !== target.id) frameTurn = { id: target.id, angle: target.angle || 0 }
      const delta = (target.angle || 0) - frameTurn.angle
      if (delta) {
        const c = target.getCenterPoint()
        childrenOf(target).forEach((o) => {
          const p = rotatePoint(o.getCenterPoint(), c, delta)
          o.setPositionByOrigin(p, 'center', 'center')
          o.rotate((o.angle || 0) + delta)
          o.setCoords?.()
        })
        syncFrameClips(target)
        frameTurn.angle = target.angle || 0
      }
    }
    refresh()
  })

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
    if (isFrame(e.target)) {
      syncFrameClips(e.target)
      frameMove = null
      frameTurn = null
    }
    else {
      updateParentFor(e.target)
    }
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
    if (isFrame(opt.target)) {
      const c = opt.target.getCenterPoint()
      frameMove = { id: opt.target.id, x: c.x, y: c.y }
      frameTurn = { id: opt.target.id, angle: opt.target.angle || 0 }
    }
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
    if (!(wheelZoom || e.ctrlKey || e.metaKey)) return
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
    exportBlob, exportSVG, exportJSON, exportPages, exportFrameBlob, exportFrames,
    // tools
    setTool, setPen,
    // internals the UI may need
    commit, refresh, kindOf,
    dispose,
  }
}
