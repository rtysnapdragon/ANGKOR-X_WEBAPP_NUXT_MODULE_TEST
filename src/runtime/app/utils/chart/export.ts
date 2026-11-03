import * as echarts from 'echarts/core'
import type { EChartsOption } from 'echarts'
import type { RChartTable } from './types'

export function downloadUrl(url: string, fileName: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  try {
    downloadUrl(url, fileName)
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // Neutralise spreadsheet formula injection (=, +, -, @ at the start of a text cell)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** UTF-8 with BOM so Excel opens Khmer / non-Latin text correctly. */
export function tableToCsv(table: RChartTable): Blob {
  const lines = [table.columns, ...table.rows].map((row) => row.map(csvCell).join(','))
  return new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

/**
 * SVG export that works whatever renderer the live chart uses:
 * the final option is rendered once into a detached SVG-renderer instance (ECharts SSR mode).
 * Requires `renderer: ['canvas', 'svg']` in the `echarts` block of nuxt.config.
 */
export function optionToSvg(option: EChartsOption, width: number, height: number, background: string): Blob {
  const chart = echarts.init(null, undefined, { renderer: 'svg', ssr: true, width, height })
  try {
    chart.setOption({ ...option, animation: false, backgroundColor: background } as EChartsOption)
    return new Blob([chart.renderToSVGString()], { type: 'image/svg+xml;charset=utf-8' })
  } finally {
    chart.dispose()
  }
}

export const safeFileName = (name: string) =>
  (name || 'chart').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 80) || 'chart'
