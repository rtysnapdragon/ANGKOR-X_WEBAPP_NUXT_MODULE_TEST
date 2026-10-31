/**
 * Minimal, dependency-free .xlsx writer (single sheet).
 *
 * Builds a valid OOXML workbook and packs it into a "stored" (uncompressed) ZIP,
 * so it works in the browser with no libraries.
 *
 *   buildXlsx('Data', ['Name', 'Qty'], [['Apple', 3], ['Pear', null]])  // → Blob
 */

/** A single cell value. `null` produces an empty cell. */
export type XlsxCell = string | number | boolean | null

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const enc = new TextEncoder()

// ─── XML helpers ─────────────────────────────────────────────────────────────

// Characters not allowed in XML 1.0
// eslint-disable-next-line no-control-regex
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g

function esc(s: string): string {
  return s
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 0 → A, 25 → Z, 26 → AA … */
function colName(i: number): string {
  let n = i + 1
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** Excel sheet names: max 31 chars, none of  [ ] : * ? / \  and not empty. */
function safeSheetName(name: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').replace(INVALID_XML, '').trim().slice(0, 31)
  return cleaned || 'Sheet1'
}

function cellXml(ref: string, v: XlsxCell, style?: number): string {
  const s = style ? ` s="${style}"` : ''
  if (v === null || v === undefined) return style ? `<c r="${ref}"${s}/>` : ''
  if (typeof v === 'number') {
    return Number.isFinite(v) ? `<c r="${ref}"${s}><v>${v}</v></c>` : (style ? `<c r="${ref}"${s}/>` : '')
  }
  if (typeof v === 'boolean') return `<c r="${ref}"${s} t="b"><v>${v ? 1 : 0}</v></c>`
  // Inline string (no sharedStrings part needed). Preserve leading/trailing spaces & newlines.
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`
}

// ─── Worksheet / workbook parts ──────────────────────────────────────────────

function sheetXml(head: string[], rows: XlsxCell[][]): string {
  const colCount = Math.max(head.length, ...rows.map((r) => r.length), 1)

  // Approximate column widths from content (capped).
  const widths = Array.from({ length: colCount }, (_, c) => {
    let max = String(head[c] ?? '').length + 2 // header is bold → a bit wider
    for (const r of rows) {
      const v = r[c]
      if (v === null || v === undefined) continue
      const len = String(v).split('\n').reduce((m, line) => Math.max(m, line.length), 0)
      if (len > max) max = len
    }
    return Math.min(Math.max(max + 2, 8), 60)
  })

  const cols = widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('')

  let data = ''
  let rowNo = 1

  if (head.length) {
    const cells = head.map((h, c) => cellXml(`${colName(c)}${rowNo}`, h, 1)).join('')
    data += `<row r="${rowNo}">${cells}</row>`
    rowNo++
  }

  for (const r of rows) {
    const cells = r.map((v, c) => cellXml(`${colName(c)}${rowNo}`, v)).join('')
    data += `<row r="${rowNo}">${cells}</row>`
    rowNo++
  }

  const lastRow = Math.max(rowNo - 1, 1)
  const dim = `A1:${colName(colCount - 1)}${lastRow}`
  const pane = head.length
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : ''

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<dimension ref="${dim}"/>` +
    pane +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    `<cols>${cols}</cols>` +
    `<sheetData>${data}</sheetData>` +
    '</worksheet>'
  )
}

const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2">' +
  '<font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
  '</fonts>' +
  '<fills count="3">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="2">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>'

const CONTENT_TYPES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
  '</Types>'

const ROOT_RELS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  '</Relationships>'

const WORKBOOK_RELS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>'

function workbookXml(sheetName: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
    '</workbook>'
  )
}

// ─── ZIP (store only) ────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

interface ZipEntry { name: Uint8Array; data: Uint8Array; crc: number; offset: number }

function zip(files: Array<{ name: string; content: string }>): Uint8Array {
  const now = new Date()
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)
  const dosDate = (((now.getFullYear() - 1980) & 0x7f) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()

  const entries: ZipEntry[] = []
  const chunks: Uint8Array[] = []
  let offset = 0

  for (const f of files) {
    const name = enc.encode(f.name)
    const data = enc.encode(f.content)
    const crc = crc32(data)

    const h = new Uint8Array(30 + name.length)
    const v = new DataView(h.buffer)
    v.setUint32(0, 0x04034b50, true) // local file header signature
    v.setUint16(4, 20, true) // version needed
    v.setUint16(6, 0x0800, true) // flags: UTF-8 names
    v.setUint16(8, 0, true) // method: stored
    v.setUint16(10, dosTime, true)
    v.setUint16(12, dosDate, true)
    v.setUint32(14, crc, true)
    v.setUint32(18, data.length, true) // compressed size
    v.setUint32(22, data.length, true) // uncompressed size
    v.setUint16(26, name.length, true)
    v.setUint16(28, 0, true) // extra length
    h.set(name, 30)

    entries.push({ name, data, crc, offset })
    chunks.push(h, data)
    offset += h.length + data.length
  }

  const centralStart = offset
  for (const e of entries) {
    const c = new Uint8Array(46 + e.name.length)
    const v = new DataView(c.buffer)
    v.setUint32(0, 0x02014b50, true) // central directory signature
    v.setUint16(4, 20, true) // version made by
    v.setUint16(6, 20, true) // version needed
    v.setUint16(8, 0x0800, true)
    v.setUint16(10, 0, true)
    v.setUint16(12, dosTime, true)
    v.setUint16(14, dosDate, true)
    v.setUint32(16, e.crc, true)
    v.setUint32(20, e.data.length, true)
    v.setUint32(24, e.data.length, true)
    v.setUint16(28, e.name.length, true)
    v.setUint16(30, 0, true) // extra
    v.setUint16(32, 0, true) // comment
    v.setUint16(34, 0, true) // disk number
    v.setUint16(36, 0, true) // internal attrs
    v.setUint32(38, 0, true) // external attrs
    v.setUint32(42, e.offset, true)
    c.set(e.name, 46)
    chunks.push(c)
    offset += c.length
  }

  const centralSize = offset - centralStart
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true) // end of central directory
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, centralStart, true)
  chunks.push(end)

  const out = new Uint8Array(offset + end.length)
  let p = 0
  for (const ch of chunks) { out.set(ch, p); p += ch.length }
  return out
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Build a single-sheet .xlsx file.
 *
 * @param sheetName Worksheet tab name (sanitised to Excel's rules).
 * @param head      Header labels (first row, bold, frozen). Pass `[]` for no header.
 * @param rows      Data rows.
 * @returns         A `Blob` ready for download.
 */
export function buildXlsx(sheetName: string, head: string[], rows: XlsxCell[][]): Blob {
  const name = safeSheetName(sheetName)
  const bytes = zip([
    { name: '[Content_Types].xml', content: CONTENT_TYPES_XML },
    { name: '_rels/.rels', content: ROOT_RELS_XML },
    { name: 'xl/workbook.xml', content: workbookXml(name) },
    { name: 'xl/_rels/workbook.xml.rels', content: WORKBOOK_RELS_XML },
    { name: 'xl/styles.xml', content: STYLES_XML },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml(head, rows) },
  ])
  // Copy into a fresh ArrayBuffer-backed view so the Blob typing is happy in all TS lib configs.
  return new Blob([bytes.slice().buffer], { type: XLSX_MIME })
}
