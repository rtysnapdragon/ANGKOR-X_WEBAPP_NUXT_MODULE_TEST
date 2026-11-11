// components/RCanvas/RCanvasData.js
// Static data for RCanvas: page sizes, fonts, palettes, vector shapes, templates.
// Pure data + tiny pure helpers — safe to import on the server.

export const PAGE_PRESETS = [
  { id: 'ig-post', label: 'Instagram post', w: 1080, h: 1080 },
  { id: 'ig-story', label: 'Instagram story', w: 1080, h: 1920 },
  { id: 'fb-post', label: 'Facebook post', w: 1200, h: 630 },
  { id: 'yt-thumb', label: 'YouTube thumbnail', w: 1280, h: 720 },
  { id: 'slide', label: 'Presentation 16:9', w: 1920, h: 1080 },
  { id: 'a4', label: 'A4 document', w: 794, h: 1123 },
  { id: 'article-cover', label: 'Article cover', w: 1600, h: 900 },
]

export const FONTS = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
  'Noto Sans Khmer', 'Battambang', 'Moul', 'Koulen',
]

// Load these (e.g. via useHead) for the Khmer / Inter entries to render.
export const GOOGLE_FONTS_URL
  = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Noto+Sans+Khmer:wght@400;700&family=Battambang:wght@400;700&family=Moul&family=Koulen&display=swap'

export const PALETTE = [
  '#000000', '#545454', '#a6a6a6', '#ffffff',
  '#ff3131', '#ff5757', '#ff66c4', '#cb6ce6',
  '#8c52ff', '#5271ff', '#38b6ff', '#00c2cb',
  '#5ce1e6', '#7ed957', '#c1ff72', '#ffde59',
  '#ffbd59', '#ff914d',
]

export const GRADIENTS = [
  { id: 'sunset', stops: ['#ff9966', '#ff5e62'] },
  { id: 'ocean', stops: ['#2193b0', '#6dd5ed'] },
  { id: 'violet', stops: ['#8e2de2', '#4a00e0'] },
  { id: 'mint', stops: ['#11998e', '#38ef7d'] },
  { id: 'dusk', stops: ['#2c3e50', '#fd746c'] },
  { id: 'peach', stops: ['#ffecd2', '#fcb69f'] },
]

// ── Vector shapes (100×100 viewBox) ─────────────────────────────────────────
const round = n => Math.round(n * 100) / 100

function polygonPath(sides, rotate = -90) {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = ((rotate + (360 / sides) * i) * Math.PI) / 180
    return `${round(50 + 48 * Math.cos(a))} ${round(50 + 48 * Math.sin(a))}`
  })
  return `M ${pts.join(' L ')} Z`
}

function starPath(points = 5, inner = 0.42) {
  const pts = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 48 : 48 * inner
    const a = ((-90 + (180 / points) * i) * Math.PI) / 180
    pts.push(`${round(50 + r * Math.cos(a))} ${round(50 + r * Math.sin(a))}`)
  }
  return `M ${pts.join(' L ')} Z`
}

// `rect` is created with fabric's Rect (so corner radius stays editable);
// everything else is a fabric Path scaled from this 100×100 box.
export const SHAPES = [
  { id: 'square', label: 'Square', rect: true, d: 'M 4 4 H 96 V 96 H 4 Z' },
  { id: 'rounded', label: 'Rounded', rect: true, radius: 16, d: 'M 14 4 H 86 Q 96 4 96 14 V 86 Q 96 96 86 96 H 14 Q 4 96 4 86 V 14 Q 4 4 14 4 Z' },
  { id: 'circle', label: 'Circle', d: 'M 2 50 A 48 48 0 1 0 98 50 A 48 48 0 1 0 2 50 Z' },
  { id: 'triangle', label: 'Triangle', d: 'M 50 4 L 97 92 L 3 92 Z' },
  { id: 'diamond', label: 'Diamond', d: 'M 50 2 L 98 50 L 50 98 L 2 50 Z' },
  { id: 'pentagon', label: 'Pentagon', d: polygonPath(5) },
  { id: 'hexagon', label: 'Hexagon', d: polygonPath(6, 0) },
  { id: 'octagon', label: 'Octagon', d: polygonPath(8, 22.5) },
  { id: 'star', label: 'Star', d: starPath(5) },
  { id: 'burst', label: 'Burst', d: starPath(12, 0.78) },
  { id: 'heart', label: 'Heart', d: 'M 50 92 C 8 60 -2 34 14 16 C 30 0 47 9 50 24 C 53 9 70 0 86 16 C 102 34 92 60 50 92 Z' },
  { id: 'arrow', label: 'Arrow', d: 'M 4 38 L 58 38 L 58 12 L 96 50 L 58 88 L 58 62 L 4 62 Z' },
  { id: 'cross', label: 'Cross', d: 'M 36 4 H 64 V 36 H 96 V 64 H 64 V 96 H 36 V 64 H 4 V 36 H 36 Z' },
  { id: 'bubble', label: 'Speech', d: 'M 8 8 H 92 V 68 H 46 L 24 94 L 28 68 H 8 Z' },
  { id: 'chevron', label: 'Chevron', d: 'M 6 6 L 60 6 L 94 50 L 60 94 L 6 94 L 40 50 Z' },
]

export const LINES = [
  { id: 'line', label: 'Line', dash: null },
  { id: 'dashed', label: 'Dashed', dash: [14, 10] },
  { id: 'dotted', label: 'Dotted', dash: [2, 10] },
]

export const TEXT_PRESETS = [
  { id: 'heading', label: 'Add a heading', sample: 'Heading', fontSize: 72, fontWeight: 700 },
  { id: 'subheading', label: 'Add a subheading', sample: 'Subheading', fontSize: 40, fontWeight: 600 },
  { id: 'body', label: 'Add a little bit of body text', sample: 'Body text', fontSize: 26, fontWeight: 400 },
]

// ── Starter templates (mini-DSL, converted to fabric objects by the engine) ─
//   { k:'text', text, left, top, width, fontSize, fontWeight, fontFamily, fill, textAlign, charSpacing }
//   { k:'shape', shape:<SHAPES id>, left, top, width, height, fill, opacity }
export const TEMPLATES = [
  {
    id: 'quote', name: 'Quote', w: 1080, h: 1080, bg: '#fff4e6',
    items: [
      { k: 'shape', shape: 'circle', left: 780, top: -120, width: 520, height: 520, fill: '#ffbd59', opacity: 0.55 },
      { k: 'text', text: '“', left: 90, top: 70, width: 200, fontSize: 280, fontWeight: 700, fill: '#ff914d' },
      { k: 'text', text: 'Make it simple,\nbut significant.', left: 90, top: 380, width: 900, fontSize: 96, fontWeight: 700, fill: '#2b2118' },
      { k: 'text', text: '— YOUR NAME', left: 90, top: 840, width: 700, fontSize: 36, fontWeight: 400, fill: '#6b5b4b', charSpacing: 300 },
    ],
  },
  {
    id: 'sale', name: 'Sale banner', w: 1200, h: 630, bg: '#111827',
    items: [
      { k: 'shape', shape: 'burst', left: 760, top: 70, width: 400, height: 400, fill: '#ff3131' },
      { k: 'text', text: '50%\nOFF', left: 790, top: 160, width: 340, fontSize: 96, fontWeight: 700, fill: '#ffffff', textAlign: 'center' },
      { k: 'text', text: 'Mega Sale', left: 80, top: 160, width: 640, fontSize: 110, fontWeight: 700, fill: '#ffffff' },
      { k: 'text', text: 'This weekend only — everything must go.', left: 80, top: 340, width: 600, fontSize: 36, fontWeight: 400, fill: '#d1d5db' },
      { k: 'shape', shape: 'rounded', left: 80, top: 470, width: 260, height: 80, fill: '#ffde59' },
      { k: 'text', text: 'Shop now', left: 80, top: 490, width: 260, fontSize: 34, fontWeight: 700, fill: '#111827', textAlign: 'center' },
    ],
  },
  {
    id: 'announce', name: 'Announcement', w: 1600, h: 900, bg: '#eef2ff',
    items: [
      { k: 'shape', shape: 'rounded', left: 90, top: 90, width: 1420, height: 720, fill: '#ffffff' },
      { k: 'shape', shape: 'square', left: 90, top: 90, width: 28, height: 720, fill: '#5271ff' },
      { k: 'text', text: 'NEWS', left: 190, top: 170, width: 600, fontSize: 36, fontWeight: 700, fill: '#5271ff', charSpacing: 400 },
      { k: 'text', text: 'Big announcement\ngoes right here', left: 190, top: 260, width: 1200, fontSize: 120, fontWeight: 700, fill: '#1e1b4b' },
      { k: 'text', text: 'Add a short description to give readers context.', left: 190, top: 620, width: 1000, fontSize: 40, fontWeight: 400, fill: '#4b5563' },
    ],
  },
  {
    id: 'title-card', name: 'Title card', w: 1920, h: 1080, bg: '#0f172a',
    items: [
      { k: 'shape', shape: 'hexagon', left: 1220, top: 200, width: 560, height: 560, fill: '#8c52ff', opacity: 0.9 },
      { k: 'shape', shape: 'hexagon', left: 1400, top: 540, width: 300, height: 300, fill: '#38b6ff', opacity: 0.85 },
      { k: 'text', text: 'Your title', left: 150, top: 340, width: 1000, fontSize: 170, fontWeight: 700, fill: '#ffffff' },
      { k: 'text', text: 'A subtitle that explains it', left: 150, top: 590, width: 1000, fontSize: 56, fontWeight: 400, fill: '#94a3b8' },
    ],
  },
]

export const TEXT_ALIGNS = ['left', 'center', 'right', 'justify']

export const SHORTCUTS = [
  ['Delete / Backspace', 'Delete selection'],
  ['Ctrl+Z / Ctrl+Shift+Z', 'Undo / redo'],
  ['Ctrl+C / V / D', 'Copy / paste / duplicate'],
  ['Ctrl+G / Ctrl+Shift+G', 'Group / ungroup'],
  ['Ctrl+A', 'Select all'],
  ['Arrows (Shift = ×10)', 'Nudge'],
  ['Ctrl + wheel, Ctrl +/−', 'Zoom'],
  ['Ctrl+0', 'Fit to screen'],
  ['Space + drag', 'Pan'],
  ['Double-click text', 'Edit text'],
]

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `o-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
