// components/RCanvas/RCanvasEditing.js
// Editing operations for RCanvas: add objects, style the selection, align,
// layer order, group/ungroup, clipboard, smart-guide snapping, keyboard.
// Installed by RCanvasEngine.js, which passes in the shared `ctx`.

import { SHAPES, LINES, TEXT_PRESETS, clamp, uid } from './RCanvasData'

const ACCENT = '#8c52ff'
const GUIDE_COLOR = '#ff3d9a'
// Props that may be applied to just the selected characters while editing text.
const INLINE_KEYS = new Set(['fill', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'underline', 'linethrough'])

export function installEditing(ctx) {
  const { K, canvas, state, EXTRA_PROPS, isGuide, isText, isImage, commit, refresh, refreshNow, bbox, imageNaturalSize } = ctx
  const { Rect, FabricLine, FabricImage, Path, Textbox, Group, ActiveSelection, Shadow, Point, util, filters } = K

  canvas.targetFindTolerance = 8   // thin lines stay clickable

  // ── Small helpers ─────────────────────────────────────────────────────────
  const selected = () => canvas.getActiveObjects().filter(o => !isGuide(o))
  const stack = () => canvas.getObjects().filter(o => !isGuide(o))
  const byId = id => stack().find(o => o.id === id)
  const orderOf = o => canvas.getObjects().indexOf(o)
  const touch = (o) => { o.setCoords?.(); o.dirty = true }
  const done = (immediate = false) => { canvas.requestRenderAll(); refresh(); commit(immediate) }
  const walk = (o, fn) => {
    if (o instanceof Group && !(o instanceof ActiveSelection)) o.getObjects().forEach(c => walk(c, fn))
    else fn(o)
  }
  function apply(fn) {
    const objs = selected()
    if (!objs.length) return
    objs.forEach((o) => { fn(o); touch(o) })
    done()
  }
  function reselect(objs) {
    objs = objs.filter(Boolean)
    canvas.discardActiveObject()
    if (objs.length) canvas.setActiveObject(objs.length === 1 ? objs[0] : new ActiveSelection(objs, { canvas }))
    canvas.requestRenderAll()
    refresh()
  }
  function center(o) {
    const { W, H } = ctx.size()
    o.set({ left: (W - o.getScaledWidth()) / 2, top: (H - o.getScaledHeight()) / 2 })
    o.setCoords()
  }
  function attachToFrame(o, x, y) {
    if (!o || o.rcFrame || !ctx.frameAt) return
    const frame = ctx.frameAt(x, y, o)
    if (frame) ctx.assignToFrame?.(o, frame)
  }
  function place(o, { centered = true } = {}) {
    if (canvas.isDrawingMode) { canvas.isDrawingMode = false; state.tool = 'select' }
    if (centered) center(o)
    attachToFrame(o, o.left + o.getScaledWidth() / 2, o.top + o.getScaledHeight() / 2)
    canvas.add(o)
    canvas.setActiveObject(o)
    canvas.requestRenderAll()
    return o
  }

  // ── Locking ───────────────────────────────────────────────────────────────
  function applyLock(o) {
    const l = !!o.rcLocked
    o.set({
      lockMovementX: l, lockMovementY: l, lockRotation: l,
      lockScalingX: l, lockScalingY: l, lockSkewingX: l, lockSkewingY: l,
      hasControls: !l,
    })
  }
  ctx.applyLock = applyLock   // used by the engine's prepObject()

  // ── Adding objects ────────────────────────────────────────────────────────
  function buildShape(id, { size = 0, width, height, fill = ACCENT } = {}) {
    const def = SHAPES.find(s => s.id === id) ?? SHAPES[0]
    const { W, H } = ctx.size()
    const w = width ?? (size || Math.max(160, Math.min(W, H) * 0.3))
    const h = height ?? w
    let o
    if (def.rect) {
      const r = ((def.radius || 0) / 100) * Math.min(w, h)
      o = new Rect({ width: w, height: h, rx: r, ry: r, fill })
    }
    else {
      o = new Path(def.d, { fill, stroke: null, strokeWidth: 0 })
      o.set({ scaleX: w / o.width, scaleY: h / o.height })
    }
    o.set({ strokeUniform: true, name: def.label })
    return o
  }

  const addShape = (id, opts) => place(buildShape(id, opts))

  function placeAt(o, { left = 0, top = 0 } = {}) {
    if (canvas.isDrawingMode) { canvas.isDrawingMode = false; state.tool = 'select' }
    o.set({ left, top })
    o.setCoords()
    attachToFrame(o, o.left + o.getScaledWidth() / 2, o.top + o.getScaledHeight() / 2)
    canvas.add(o)
    canvas.setActiveObject(o)
    canvas.requestRenderAll()
    refresh()
    commit(true)
    return o
  }

  function nextFrameName() {
    const used = new Set(stack().filter(o => ctx.isFrame?.(o)).map(o => o.name))
    let i = 1
    while (used.has(`Frame ${i}`)) i++
    return `Frame ${i}`
  }

  function addFrame({ left = 0, top = 0, width = 320, height = 240, fill = '#ffffff', name } = {}) {
    const frame = buildShape('square', { width, height, fill })
    frame.set({ name: name || nextFrameName(), rcFrame: true })
    return placeAt(frame, { left, top })
  }

  function addShapeAt(id, { left = 0, top = 0, width, height, fill, name, rcFrame } = {}) {
    const shape = buildShape(id, { width, height, fill })
    if (name) shape.set({ name })
    if (rcFrame) shape.set({ rcFrame: true, name: name || nextFrameName() })
    return placeAt(shape, { left, top })
  }

  function addTextAt(presetId = 'body', { left = 0, top = 0, width } = {}) {
    const p = TEXT_PRESETS.find(x => x.id === presetId) ?? TEXT_PRESETS[2]
    const { W } = ctx.size()
    const t = new Textbox(p.sample, {
      width: width || Math.min(W * 0.7, Math.max(260, p.sample.length * p.fontSize * 0.62)),
      fontSize: p.fontSize,
      fontWeight: p.fontWeight,
      fontFamily: state.defaultFont || 'Inter',
      fill: '#1f2937',
      textAlign: 'left',
      splitByGrapheme: true,
      lineHeight: 1.16,
    })
    placeAt(t, { left, top })
    try {
      t.enterEditing()
      t.selectAll()
    }
    catch {
      return t
    }
    return t
  }

  function addLineAt({ left = 0, top = 0, width = 200, height = 0, id = 'line' } = {}) {
    const def = LINES.find(l => l.id === id) ?? LINES[0]
    const line = new FabricLine([0, 0, width, height], {
      stroke: '#1f2937',
      strokeWidth: 6,
      strokeDashArray: def.dash,
      strokeLineCap: 'round',
      strokeUniform: true,
      name: def.label,
    })
    return placeAt(line, { left, top })
  }

  function addLine(id = 'line') {
    const def = LINES.find(l => l.id === id) ?? LINES[0]
    const { W } = ctx.size()
    const len = Math.max(200, W * 0.3)
    return place(new FabricLine([0, 0, len, 0], {
      stroke: '#1f2937',
      strokeWidth: 6,
      strokeDashArray: def.dash,
      strokeLineCap: 'round',
      strokeUniform: true,
      name: def.label,
    }))
  }

  function addText(presetId = 'body', opts = {}) {
    const p = TEXT_PRESETS.find(x => x.id === presetId) ?? TEXT_PRESETS[2]
    const { W } = ctx.size()
    const t = new Textbox(p.sample, {
      width: Math.min(W * 0.7, Math.max(260, p.sample.length * p.fontSize * 0.62)),
      fontSize: p.fontSize,
      fontWeight: p.fontWeight,
      fontFamily: state.defaultFont || 'Inter',
      fill: '#1f2937',
      textAlign: 'center',
      splitByGrapheme: true,     // wraps scripts without spaces (Khmer, Thai…)
      lineHeight: 1.16,
      ...opts,
    })
    place(t)
    try { t.enterEditing(); t.selectAll() } catch { /* not interactive */ }
    return t
  }

  async function addImage(url, { select = true } = {}) {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
    const { W, H } = ctx.size()
    const s = Math.min(1, (W * 0.6) / img.width, (H * 0.6) / img.height)
    img.set({ scaleX: s, scaleY: s })
    if (select) return place(img)
    center(img)
    canvas.add(img)
    return img
  }

  async function addImageAt(url, { left = 0, top = 0, width, height } = {}) {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
    const { W, H } = ctx.size()
    const s = width || height
      ? Math.min(width ? width / img.width : Infinity, height ? height / img.height : Infinity)
      : Math.min(1, (W * 0.6) / img.width, (H * 0.6) / img.height)
    img.set({ scaleX: s, scaleY: s })
    return placeAt(img, { left, top })
  }

  async function replaceImage(url) {
    const old = selected().find(isImage)
    if (!old) return null
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
    const s = old.getScaledWidth() / img.width
    img.set({
      left: old.left, top: old.top, angle: old.angle, scaleX: s, scaleY: s,
      flipX: old.flipX, flipY: old.flipY, rcParent: old.rcParent || null,
    })
    const idx = orderOf(old)
    ctx.setSuppress(true)
    try {
      canvas.discardActiveObject()
      canvas.remove(old)
      canvas.add(img)
      canvas.moveObjectTo(img, Math.min(idx, canvas.getObjects().length - 1))
      ctx.syncFrameClip?.(img)
      canvas.setActiveObject(img)
    }
    finally { ctx.setSuppress(false) }
    done(true)
    return img
  }

  async function applyTemplate(tpl) {
    ctx.setSuppress(true)
    try {
      canvas.discardActiveObject()
      const old = stack()
      if (old.length) canvas.remove(...old)
      ctx.setSize(tpl.w, tpl.h)
      ctx.setBackground(tpl.bg || '#ffffff')
      for (const item of tpl.items) {
        let o
        if (item.k === 'text') {
          o = new Textbox(item.text, {
            left: item.left, top: item.top, width: item.width,
            fontSize: item.fontSize, fontWeight: item.fontWeight ?? 400,
            fontFamily: item.fontFamily || state.defaultFont || 'Inter',
            fill: item.fill || '#1f2937', textAlign: item.textAlign || 'left',
            charSpacing: item.charSpacing || 0, lineHeight: 1.12, splitByGrapheme: true,
          })
        }
        else {
          o = buildShape(item.shape, { width: item.width, height: item.height, fill: item.fill })
          o.set({ left: item.left, top: item.top, opacity: item.opacity ?? 1 })
        }
        canvas.add(o)
      }
    }
    finally { ctx.setSuppress(false) }
    canvas.requestRenderAll()
    ctx.fit()
    refreshNow()
    commit(true)
  }

  // ── Styling the selection ─────────────────────────────────────────────────
  function loadFont(family) {
    if (!family || typeof document === 'undefined' || !document.fonts?.load) return
    document.fonts.load(`16px "${family}"`).then(() => {
      selected().filter(isText).forEach((o) => { o.initDimensions?.(); o.setCoords() })
      canvas.requestRenderAll()
    }).catch(() => {})
  }

  function applyText(patch) {
    const objs = selected().filter(isText)
    if (!objs.length) return
    objs.forEach((o) => {
      const inline = o.isEditing && o.selectionStart !== o.selectionEnd
        && Object.keys(patch).every(k => INLINE_KEYS.has(k))
      if (inline) o.setSelectionStyles(patch)
      else o.set(patch)
      o.initDimensions?.()
      touch(o)
    })
    if (patch.fontFamily) loadFont(patch.fontFamily)
    done()
  }

  const setFont = family => applyText({ fontFamily: family })
  const setFontSize = n => applyText({ fontSize: clamp(Math.round(n) || 12, 6, 800) })
  const toggleBold = () => applyText({ fontWeight: state.sel?.bold ? 400 : 700 })
  const toggleItalic = () => applyText({ fontStyle: state.sel?.italic ? 'normal' : 'italic' })
  const toggleUnderline = () => applyText({ underline: !state.sel?.underline })
  const toggleStrike = () => applyText({ linethrough: !state.sel?.linethrough })
  const setAlign = a => applyText({ textAlign: a })
  const setLineHeight = n => applyText({ lineHeight: clamp(n, 0.6, 3) })
  const setCharSpacing = n => applyText({ charSpacing: clamp(n, -200, 1000) })

  function setFill(color) {
    if (selected().some(o => isText(o) && o.isEditing && o.selectionStart !== o.selectionEnd)) return applyText({ fill: color })
    apply(o => walk(o, (c) => {
      if (c instanceof FabricLine) c.set('stroke', color)
      else if (!isImage(c)) c.set('fill', color)
      touch(c)
    }))
  }
  function setStroke(color) {
    apply(o => walk(o, (c) => {
      c.set({ stroke: color, strokeUniform: true, paintFirst: 'stroke' })
      if (!c.strokeWidth) c.set('strokeWidth', 4)
      touch(c)
    }))
  }
  function setStrokeWidth(w) {
    apply(o => walk(o, (c) => {
      c.set({ strokeWidth: clamp(w, 0, 80), strokeUniform: true, paintFirst: 'stroke' })
      if (w > 0 && !c.stroke) c.set('stroke', '#000000')
      touch(c)
    }))
  }
  const setOpacity = n => apply(o => o.set('opacity', clamp(n, 0, 1)))
  const setShadow = on => apply(o => o.set('shadow', on
    ? new Shadow({ color: 'rgba(0,0,0,0.35)', blur: 18, offsetX: 0, offsetY: 8 })
    : null))
  const flip = axis => apply(o => o.set(axis === 'y' ? 'flipY' : 'flipX', !(axis === 'y' ? o.flipY : o.flipX)))
  const setAngle = deg => apply(o => o.rotate(deg))

  function setRadius(r) {
    apply((o) => {
      if (o instanceof Rect) {
        const v = clamp(r, 0, Math.min(o.width, o.height) / 2)
        o.set({ rx: v, ry: v })
      }
      else if (isImage(o)) {
        // Images take a percentage (0–100 = square → fully rounded).
        const pct = clamp(r, 0, 100)
        const px = (Math.min(o.width, o.height) / 2) * (pct / 100)
        o.rcRadius = pct
        o.set('clipPath', pct > 0
          ? new Rect({ width: o.width, height: o.height, rx: px, ry: px, originX: 'center', originY: 'center' })
          : undefined)
      }
    })
  }

  function setImageFx(name, value) {
    const patch = name && typeof name === 'object' ? name : { [name]: value }
    apply((o) => {
      if (!isImage(o)) return
      const fx = { ...(o.rcFx || {}), ...patch }
      o.rcFx = fx
      const list = []
      if (fx.brightness) list.push(new filters.Brightness({ brightness: fx.brightness }))
      if (fx.contrast) list.push(new filters.Contrast({ contrast: fx.contrast }))
      if (fx.saturation) list.push(new filters.Saturation({ saturation: fx.saturation }))
      if (fx.blur) list.push(new filters.Blur({ blur: fx.blur }))
      o.filters = list
      o.applyFilters()
    })
  }

  function cropImage(ratio = null) {
    const images = selected().filter(isImage)
    if (!images.length) return
    const target = Number(ratio)
    images.forEach((o) => {
      const full = imageNaturalSize(o)
      const displayW = Math.max(1, o.getScaledWidth())
      const displayH = Math.max(1, o.getScaledHeight())
      const center = o.getCenterPoint()

      let cropW, cropH, cropX, cropY

      if (Number.isFinite(target) && target > 0) {
        if (full.w / full.h > target) {
          cropW = full.h * target
          cropH = full.h
        }
        else {
          cropW = full.w
          cropH = full.w / target
        }
        cropX = (full.w - cropW) / 2
        cropY = (full.h - cropH) / 2
      }
      else {
        cropW = full.w
        cropH = full.h
        cropX = 0
        cropY = 0
      }

      cropW = clamp(cropW, 1, full.w)
      cropH = clamp(cropH, 1, full.h)
      cropX = clamp(cropX, 0, Math.max(0, full.w - cropW))
      cropY = clamp(cropY, 0, Math.max(0, full.h - cropH))
      const scale = Math.max(0.0001, Math.min(displayW / cropW, displayH / cropH))

      o.set({ cropX, cropY, width: cropW, height: cropH, scaleX: scale, scaleY: scale })
      if (o.rcRadius && o.clipPath && !o.clipPath.rcFrameClip) {
        const pct = clamp(o.rcRadius, 0, 100)
        const px = (Math.min(o.width, o.height) / 2) * (pct / 100)
        o.clipPath.set({ width: o.width, height: o.height, rx: px, ry: px })
        o.clipPath.setCoords?.()
      }
      o.setPositionByOrigin(new Point(center.x, center.y), 'center', 'center')
      touch(o)
    })
    done(true)
  }

  function setPosition({ x, y }) {
    const a = canvas.getActiveObject()
    if (!a) return
    const bb = bbox(a)
    a.set({ left: a.left + (x ?? bb.l) - bb.l, top: a.top + (y ?? bb.t) - bb.t })
    a.setCoords()
    done()
  }

  // ── Scale normalisation (after a resize drag finishes) ────────────────────
  // Rect: bake scale into width/height so corner radius & stroke stay true.
  // Textbox: side handles change the wrap width; corner handles scale the font.
  function normalizeScale(o, corner) {
    if (!o || o instanceof ActiveSelection) return
    const sx = o.scaleX
    const sy = o.scaleY
    if (sx === 1 && sy === 1) return
    if (o instanceof Rect) {
      const w = o.width * sx
      const h = o.height * sy
      o.set({ width: w, height: h, scaleX: 1, scaleY: 1, rx: Math.min(o.rx, w / 2), ry: Math.min(o.ry, h / 2) })
    }
    else if (o instanceof Textbox) {
      if (corner === 'ml' || corner === 'mr') {
        o.set({ width: o.width * sx, scaleX: 1, scaleY: 1 })
      }
      else {
        const s = Math.abs(sx - 1) > Math.abs(sy - 1) ? sx : sy
        o.set({ fontSize: o.fontSize * s, width: o.width * s, scaleX: 1, scaleY: 1 })
      }
      o.initDimensions?.()
    }
    o.setCoords()
  }

  // ── Align ─────────────────────────────────────────────────────────────────
  function align(where) {
    const objs = selected().filter(o => !o.rcLocked)
    if (!objs.length) return
    const { W, H } = ctx.size()
    canvas.discardActiveObject()
    const boxes = objs.map(o => ({ o, bb: bbox(o) }))
    const frame = objs.length > 1
      ? {
          l: Math.min(...boxes.map(b => b.bb.l)), t: Math.min(...boxes.map(b => b.bb.t)),
          r: Math.max(...boxes.map(b => b.bb.r)), b: Math.max(...boxes.map(b => b.bb.b)),
        }
      : { l: 0, t: 0, r: W, b: H }
    boxes.forEach(({ o, bb }) => {
      let dx = 0
      let dy = 0
      if (where === 'left') dx = frame.l - bb.l
      else if (where === 'center') dx = (frame.l + frame.r) / 2 - (bb.l + bb.r) / 2
      else if (where === 'right') dx = frame.r - bb.r
      else if (where === 'top') dy = frame.t - bb.t
      else if (where === 'middle') dy = (frame.t + frame.b) / 2 - (bb.t + bb.b) / 2
      else if (where === 'bottom') dy = frame.b - bb.b
      o.set({ left: o.left + dx, top: o.top + dy })
      o.setCoords()
    })
    reselect(objs)
    done(true)
  }

  // ── Layer order ───────────────────────────────────────────────────────────
  function order(action) {
    const objs = selected().sort((a, b) => orderOf(a) - orderOf(b))
    if (!objs.length) return
    canvas.discardActiveObject()
    if (action === 'front') objs.forEach(o => canvas.bringObjectToFront(o))
    else if (action === 'back') [...objs].reverse().forEach(o => canvas.sendObjectToBack(o))
    else if (action === 'forward') [...objs].reverse().forEach(o => canvas.bringObjectForward(o))
    else if (action === 'backward') objs.forEach(o => canvas.sendObjectBackwards(o))
    reselect(objs)
    done(true)
  }
  function moveLayer(id, dir) {
    const o = byId(id)
    if (!o) return
    if (dir === 'up') canvas.bringObjectForward(o)
    else canvas.sendObjectBackwards(o)
    done(true)
  }
  function moveLayerTo(id, targetId) {
    const o = byId(id)
    const t = byId(targetId)
    if (!o || !t || o === t) return
    canvas.moveObjectTo(o, orderOf(t))
    done(true)
  }

  // ── Layer panel actions ───────────────────────────────────────────────────
  function selectById(id, additive = false) {
    const o = byId(id)
    if (!o || o.visible === false) return
    if (additive) reselect([...selected().filter(x => x !== o), o])
    else { canvas.discardActiveObject(); canvas.setActiveObject(o) }
    canvas.requestRenderAll()
    refresh()
  }
  function toggleLock(id) {
    const o = byId(id)
    if (!o) return
    o.rcLocked = !o.rcLocked
    applyLock(o)
    canvas.requestRenderAll()
    refresh()
    commit()
  }
  function toggleVisible(id) {
    const o = byId(id)
    if (!o) return
    const show = o.visible === false
    if (!show && selected().includes(o)) canvas.discardActiveObject()
    o.set('visible', show)
    if (ctx.isFrame?.(o)) ctx.childrenOf?.(o).forEach(c => c.set('visible', show))
    done()
  }
  function renameLayer(id, name) {
    const o = byId(id)
    if (!o) return
    o.name = name
    refresh()
    commit()
  }
  function setLocked(v) {
    selected().forEach((o) => { o.rcLocked = v; applyLock(o) })
    canvas.requestRenderAll()
    refresh()
    commit()
  }

  // ── Delete / select ───────────────────────────────────────────────────────
  function remove() {
    const direct = selected()
    if (!direct.length) return
    const frameIds = new Set(direct.filter(o => ctx.isFrame?.(o)).map(o => o.id))
    const objs = [...new Set([
      ...direct,
      ...stack().filter(o => o.rcParent && frameIds.has(o.rcParent)),
    ])]
    canvas.discardActiveObject()
    canvas.remove(...objs)
    done(true)
  }
  function selectAll() {
    reselect(stack().filter(o => o.visible !== false && o.selectable !== false))
  }
  function clearSelection() {
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    refresh()
  }
  function nudge(dx, dy) {
    const a = canvas.getActiveObject()
    if (!a || a.rcLocked) return
    a.set({ left: a.left + dx, top: a.top + dy })
    if (ctx.isFrame?.(a)) ctx.moveFrameBy?.(a, dx, dy)
    a.setCoords()
    canvas.fire('object:modified', { target: a })
    canvas.requestRenderAll()
  }

  // ── Group / ungroup ───────────────────────────────────────────────────────
  function group() {
    const a = canvas.getActiveObject()
    if (!(a instanceof ActiveSelection)) return
    const objs = a.getObjects().slice().sort((x, y) => orderOf(x) - orderOf(y))
    const index = orderOf(objs[0])
    ctx.setSuppress(true)
    try {
      canvas.discardActiveObject()
      objs.forEach(o => canvas.remove(o))
      const g = new Group(objs)
      g.id = uid()
      canvas.add(g)
      canvas.moveObjectTo(g, Math.min(index, canvas.getObjects().length - 1))
      canvas.setActiveObject(g)
    }
    finally { ctx.setSuppress(false) }
    done(true)
  }

  function ungroup() {
    const g = canvas.getActiveObject()
    if (!(g instanceof Group) || g instanceof ActiveSelection) return
    const items = g.getObjects().slice()
    const matrices = items.map(o => o.calcTransformMatrix())   // includes the group's transform
    const index = orderOf(g)
    ctx.setSuppress(true)
    try {
      canvas.discardActiveObject()
      canvas.remove(g)
      g.removeAll()
      items.forEach((o, i) => {
        const d = util.qrDecompose(matrices[i])
        o.set({ flipX: false, flipY: false, scaleX: d.scaleX, scaleY: d.scaleY, skewX: d.skewX, skewY: d.skewY, angle: d.angle })
        o.setPositionByOrigin(new Point(d.translateX, d.translateY), 'center', 'center')
        o.setCoords()
        canvas.add(o)
        canvas.moveObjectTo(o, Math.min(index + i, canvas.getObjects().length - 1))
      })
    }
    finally { ctx.setSuppress(false) }
    reselect(items)
    done(true)
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────
  let clipboard = null
  function copy() {
    const direct = selected()
    if (!direct.length) return false
    const frameIds = new Set(direct.filter(o => ctx.isFrame?.(o)).map(o => o.id))
    const objs = [...new Set([
      ...direct,
      ...stack().filter(o => o.rcParent && frameIds.has(o.rcParent)),
    ])].sort((a, b) => orderOf(a) - orderOf(b))
    canvas.discardActiveObject()                       // objects back to scene coords
    clipboard = objs.map(o => o.toObject(EXTRA_PROPS))
    reselect(direct)
    return true
  }
  async function paste(offset = 24) {
    if (!clipboard?.length) return
    const objs = await util.enlivenObjects(clipboard)
    const idMap = new Map()
    objs.forEach((o) => {
      const old = o.id
      o.id = uid()
      idMap.set(old, o.id)
    })
    objs.forEach((o) => {
      if (o.rcParent) o.rcParent = idMap.get(o.rcParent) || null
      if (!o.rcParent && o.clipPath?.rcFrameClip) o.set('clipPath', null)
    })
    ctx.setSuppress(true)
    try {
      canvas.discardActiveObject()
      objs.forEach((o) => {
        o.set({ left: o.left + offset, top: o.top + offset })
        canvas.add(o)
      })
      objs.forEach(o => ctx.updateParentFor?.(o))
      ctx.syncAllFrameClips?.()
      clipboard = clipboard.map(c => ({ ...c, left: c.left + offset, top: c.top + offset }))
      reselect(objs)
    }
    finally { ctx.setSuppress(false) }
    done(true)
  }
  async function duplicate() {
    if (copy()) await paste()
  }

  // ── Smart guides + snapping (Canva-style) ─────────────────────────────────
  let guides = []
  let snapCache = null

  function clearGuides() {
    if (!guides.length) return
    guides.forEach(g => canvas.remove(g))
    guides = []
  }
  function drawGuide(x1, y1, x2, y2) {
    const z = ctx.zoom()
    const g = new FabricLine([x1, y1, x2, y2], {
      stroke: GUIDE_COLOR,
      strokeWidth: 1 / z,
      strokeDashArray: [6 / z, 4 / z],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      objectCaching: false,
      rcGuide: true,
    })
    canvas.add(g)
    guides.push(g)
  }
  function buildSnapCache(target) {
    const { W, H } = ctx.size()
    const skip = new Set([target, ...canvas.getActiveObjects()])
    const x = [0, W / 2, W]
    const y = [0, H / 2, H]
    stack().forEach((o) => {
      if (skip.has(o) || o.visible === false) return
      const b = bbox(o)
      x.push(b.l, (b.l + b.r) / 2, b.r)
      y.push(b.t, (b.t + b.b) / 2, b.b)
    })
    return { x, y }
  }
  function nearest(anchors, stops, threshold) {
    let best = null
    anchors.forEach((a) => {
      stops.forEach((s) => {
        const d = s - a
        if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best))) best = d
      })
    })
    return best
  }

  canvas.on('object:moving', ({ target }) => {
    if (!state.snap || !target || isGuide(target)) return
    const { W, H } = ctx.size()
    const threshold = 8 / ctx.zoom()
    snapCache ??= buildSnapCache(target)
    clearGuides()

    let bb = bbox(target)
    const dx = nearest([bb.l, (bb.l + bb.r) / 2, bb.r], snapCache.x, threshold)
    const dy = nearest([bb.t, (bb.t + bb.b) / 2, bb.b], snapCache.y, threshold)
    if (dx !== null || dy !== null) {
      target.set({ left: target.left + (dx ?? 0), top: target.top + (dy ?? 0) })
      bb = bbox(target)
    }
    const eps = 0.75 / ctx.zoom()
    const seenX = new Set()
    const seenY = new Set()
    ;[bb.l, (bb.l + bb.r) / 2, bb.r].forEach((a) => {
      snapCache.x.forEach((s) => {
        const key = Math.round(s)
        if (Math.abs(s - a) <= eps && !seenX.has(key)) { seenX.add(key); drawGuide(s, 0, s, H) }
      })
    })
    ;[bb.t, (bb.t + bb.b) / 2, bb.b].forEach((a) => {
      snapCache.y.forEach((s) => {
        const key = Math.round(s)
        if (Math.abs(s - a) <= eps && !seenY.has(key)) { seenY.add(key); drawGuide(0, s, W, s) }
      })
    })
  })
  canvas.on('mouse:up', () => {
    snapCache = null
    if (guides.length) { clearGuides(); canvas.requestRenderAll() }
  })

  // ── Keyboard ──────────────────────────────────────────────────────────────
  // Returns true when the key was consumed. Paste is deliberately NOT handled
  // here: the component's `paste` event covers both OS images and our clipboard.
  function handleKey(e) {
    const a = canvas.getActiveObject()
    if (a?.isEditing) return false
    const mod = e.ctrlKey || e.metaKey
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const consume = () => { e.preventDefault(); e.stopPropagation(); return true }

    if (mod) {
      switch (key) {
        case 'z': (e.shiftKey ? ctx.redo : ctx.undo)(); return consume()
        case 'y': ctx.redo(); return consume()
        case 'c': copy(); return false          // keep native copy working too
        case 'x': if (copy()) { remove(); return consume() } return false
        case 'd': duplicate(); return consume()
        case 'a': selectAll(); return consume()
        case 'g': (e.shiftKey ? ungroup : group)(); return consume()
        case '=': case '+': ctx.zoomBy(1.2); return consume()
        case '-': ctx.zoomBy(1 / 1.2); return consume()
        case '0': ctx.fit(); return consume()
        default: return false
      }
    }

    const step = e.shiftKey ? 10 : 1
    switch (key) {
      case 'Delete': case 'Backspace':
        if (!selected().length) return false
        remove(); return consume()
      case 'Escape': clearSelection(); return consume()
      case 'ArrowLeft': if (!a) return false; nudge(-step, 0); return consume()
      case 'ArrowRight': if (!a) return false; nudge(step, 0); return consume()
      case 'ArrowUp': if (!a) return false; nudge(0, -step); return consume()
      case 'ArrowDown': if (!a) return false; nudge(0, step); return consume()
      default: return false
    }
  }

  return {
    // add
    addText, addTextAt, addShape, addShapeAt, addFrame, addLine, addLineAt, addImage, addImageAt, replaceImage, applyTemplate,
    // text
    setFont, setFontSize, toggleBold, toggleItalic, toggleUnderline, toggleStrike, setAlign, setLineHeight, setCharSpacing,
    // style
    setFill, setStroke, setStrokeWidth, setOpacity, setShadow, setRadius, setImageFx, cropImage, flip, setAngle, setPosition,
    // arrange
    align, order, moveLayer, moveLayerTo,
    // layers
    selectById, toggleLock, toggleVisible, renameLayer, setLocked,
    // selection / clipboard
    remove, selectAll, clearSelection, nudge, group, ungroup, copy, paste, duplicate,
    // internals
    normalizeScale, handleKey,
  }
}
