import type { RChartFormatContext, RChartValueFormatter } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Numbers
// ─────────────────────────────────────────────────────────────────────────────
export interface FormatOptions {
  unit?: string
  currency?: string
  locale?: string
  decimals?: number
  valueFormatter?: RChartValueFormatter
}

/** Builds one formatter used by tooltips, labels and axes. Never throws. */
export function createFormatter(opts: FormatOptions) {
  const cache = new Map<string, Intl.NumberFormat>()

  const getFormat = (compact: boolean) => {
    const key = compact ? 'compact' : 'full'
    let nf = cache.get(key)
    if (!nf) {
      try {
        nf = new Intl.NumberFormat(opts.locale, {
          ...(opts.currency ? { style: 'currency', currency: opts.currency } : {}),
          ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
          ...(!compact && opts.decimals !== undefined
            ? { minimumFractionDigits: opts.decimals, maximumFractionDigits: opts.decimals }
            : { maximumFractionDigits: 2 }),
        })
      } catch {
        nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
      }
      cache.set(key, nf)
    }
    return nf
  }

  return (value: unknown, ctx: RChartFormatContext = {}): string => {
    if (value === null || value === undefined || value === '') return '–'
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n)) return String(value)
    if (opts.valueFormatter) return opts.valueFormatter(n, ctx)
    const text = getFormat(Boolean(ctx.axis)).format(n)
    return opts.unit && !opts.currency && !ctx.axis ? `${text}${opts.unit}` : text
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Colors (ECharts cannot read CSS variables, and cannot parse color-mix())
// ─────────────────────────────────────────────────────────────────────────────
export function withAlpha(color: string, alpha: number): string {
  const c = color.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)
  if (hex) {
    let h = hex[1]!
    if (h.length === 3) h = h.split('').map((x) => x + x).join('')
    const n = parseInt(h, 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(c)
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`
  return c // hsl(), named colors… used as-is
}

/** Vertical gradient as a plain ECharts color object (no echarts import needed). */
export function verticalGradient(color: string, from = 0.35, to = 0.02) {
  return {
    type: 'linear' as const,
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: withAlpha(color, from) },
      { offset: 1, color: withAlpha(color, to) },
    ],
  }
}

export const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

// ─────────────────────────────────────────────────────────────────────────────
// Merge — defaults ← user `options`
// ─────────────────────────────────────────────────────────────────────────────
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && Object.getPrototypeOf(v) === Object.prototype

/**
 * Deep merge where the override always wins.
 *  - plain objects merge recursively
 *  - `series` merges element-wise by index (tweak series[0] without redefining it)
 *  - every other array (colors, data, indicator…) is replaced
 *  - functions / class instances / primitives replace
 */
export function mergeOptions<T extends Record<string, any>>(base: T, override?: Record<string, any> | null): T {
  if (!override) return base
  const out: Record<string, any> = { ...base }
  for (const key of Object.keys(override)) {
    if (UNSAFE_KEYS.has(key)) continue
    const next = override[key]
    const prev = out[key]
    if (next === undefined) continue
    if (key === 'series' && Array.isArray(next) && Array.isArray(prev)) {
      out[key] = next.map((item, i) => (isPlain(item) && isPlain(prev[i]) ? mergeOptions(prev[i], item) : item))
      if (prev.length > next.length) out[key].push(...prev.slice(next.length))
    } else if (isPlain(next) && isPlain(prev)) {
      out[key] = mergeOptions(prev, next)
    } else {
      out[key] = next
    }
  }
  return out as T
}
