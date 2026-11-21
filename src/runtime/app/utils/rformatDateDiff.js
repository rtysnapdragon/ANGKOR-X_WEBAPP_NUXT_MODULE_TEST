// utils/formatDateDiff.js
import {
  format as dfFormat,
  differenceInSeconds, differenceInMinutes, differenceInHours,
  differenceInDays, differenceInMonths, differenceInYears,
} from 'date-fns'

export const DATE_PATTERNS = {
  default: 'yyyy-MM-dd',
  date: 'yyyy-MM-dd',
  dateShort: 'dd/MM/yyyy',
  dateLong: 'dd MMMM yyyy',
  dateFull: 'EEEE dd MMMM yyyy',

  time: 'HH:mm:ss',
  timeShort: 'HH:mm',
  time12: 'hh:mm a',

  datetime: 'yyyy-MM-dd HH:mm:ss',
  datetimeShort: 'dd/MM/yyyy HH:mm',
  datetimeLong: 'dd MMMM yyyy hh:mm a',
  datetimeFull: 'EEEE dd MMMM yyyy hh:mm:ss a',

  readable: 'dddd dd-mmm-yyyy hh:mm a',
  readableFull: 'dddd dd-mmmm-yyyy hh:mm a',

  month: 'MMMM',
  monthShort: 'MMM',
  monthYear: 'MMMM yyyy',

  year: 'yyyy',
  iso: "yyyy-MM-dd'T'HH:mm:ssxxx",

  // international
  dateUS: 'MM/dd/yyyy',
  dateEU: 'dd.MM.yyyy',
  datetimeUS: 'MM/dd/yyyy hh:mm a',
  datetimeEU: 'dd.MM.yyyy HH:mm',
}

// month / weekday / AM-PM names are localized through Intl (km, en, zh, ...)
const NAMES = {
  dddd: ['weekday', 'long'], EEEE: ['weekday', 'long'],
  ddd: ['weekday', 'short'], EEE: ['weekday', 'short'],
  mmmm: ['month', 'long'], MMMM: ['month', 'long'],
  mmm: ['month', 'short'], MMM: ['month', 'short'],
}
const TOKEN = /('[^']*'|dddd|ddd|mmmm|mmm|MMMM|MMM|EEEE|EEE|a)/

const warned = new Set()
const warn = (msg) => {
  if (warned.has(msg)) return
  warned.add(msg)
  console.warn(`[formatDateDiff] ${msg}`)
  if (!(import.meta.client && import.meta.dev)) return // toast = dev feedback only
  try {
    useToast().add({
      id: `fdd:${msg}`,
      title: 'formatDateDiff',
      description: msg,
      color: 'warning',
      icon: 'i-lucide-triangle-alert',
    })
  } catch { /* outside Nuxt context */ }
}

const cache = new Map()
const intl = (Ctor, lang, opts) => {
  const key = `${Ctor.name}|${lang}|${JSON.stringify(opts)}`
  if (!cache.has(key)) cache.set(key, new Ctor(lang, opts))
  return cache.get(key)
}

const resolveLocale = (l) => {
  let tag = l
  if (!tag) { try { tag = unref(useNuxtApp().$i18n?.locale) } catch { /* no i18n */ } }
  try {
    return Intl.getCanonicalLocales(String(tag || 'en').replace('_', '-'))[0]
  } catch {
    warn(`Invalid locale "${tag}", falling back to "en"`)
    return 'en'
  }
}

// null / undefined / '' -> null (silent). Anything unparsable -> throws.
const toDate = (v, utc) => {
  if (v == null || v === '') return null
  let x = v
  if (typeof x === 'string') {
    x = x.trim().replace(/^(\d{4}-\d\d-\d\d) /, '$1T') // Safari-safe
    if (/^\d{4}-\d\d-\d\d$/.test(x)) x += utc ? 'T00:00:00Z' : 'T00:00:00' // date-only: avoid UTC shift
    else if (utc && x.includes('T') && !/(Z|[+-]\d\d:?\d\d)$/i.test(x)) x += 'Z'
  } else if (!(x instanceof Date) && typeof x !== 'number') {
    throw new Error(`Invalid date: ${typeof v}`)
  }
  const d = x instanceof Date ? x : new Date(x)
  if (isNaN(d)) throw new Error(`Invalid date: ${String(v)}`)
  return d
}

const part = (date, lang, opts, type) =>
  intl(Intl.DateTimeFormat, lang, opts).formatToParts(date).find((p) => p.type === type)?.value ?? ''

const render = (date, pattern, lang) =>
  pattern.split(TOKEN).map((seg) => {
    if (!seg) return ''
    if (NAMES[seg]) return part(date, lang, { [NAMES[seg][0]]: NAMES[seg][1] }, NAMES[seg][0])
    if (seg === 'a') return part(date, lang, { hour: 'numeric', hour12: true }, 'dayPeriod')
    return dfFormat(date, seg)
  }).join('')

const RELATIVE = [
  ['year', differenceInYears], ['month', differenceInMonths], ['day', differenceInDays],
  ['hour', differenceInHours], ['minute', differenceInMinutes],
]
const relative = (date, to, lang) => {
  const rtf = intl(Intl.RelativeTimeFormat, lang, { numeric: 'auto' })
  for (const [unit, diff] of RELATIVE) {
    const n = diff(date, to)
    if (n) return rtf.format(n, unit)
  }
  return rtf.format(differenceInSeconds(date, to), 'second')
}

/**
 * formatDateDiff(value, pattern = 'default', { locale, utc, to })
 *   pattern : preset name from DATE_PATTERNS | date-fns pattern | 'relative'
 *   locale  : defaults to $i18n.locale, then 'en'
 *   utc     : treat timezone-less strings as UTC
 *   to      : reference date for 'relative' (default: now)
 * Never throws; returns '' on empty/invalid input (dev toast on misuse).
 */
export default (value, pattern = 'default', { locale, utc = false, to } = {}) => {
  try {
    const date = toDate(value, utc)
    if (!date) return ''
    const lang = resolveLocale(locale)

    if (pattern === 'relative') return relative(date, toDate(to, utc) ?? new Date(), lang)

    const p = DATE_PATTERNS[pattern] ?? pattern
    if (typeof p !== 'string' || !p) throw new Error('Pattern must be a non-empty string')
    try {
      return render(date, p, lang)
    } catch (e) {
      throw new Error(`Invalid format "${pattern}" (${e.message}). Presets: ${Object.keys(DATE_PATTERNS).join(', ')}, relative`)
    }
  } catch (e) {
    warn(e.message)
    return ''
  }
}

/*
formatDateDiff(CreatedAt)                          // 2026-11-17
formatDateDiff(CreatedAt, 'datetimeFull')          // Tuesday 17 November 2026 01:12:54 PM
formatDateDiff(CreatedAt, 'readable')              // Tuesday 17-Nov-2026 01:12 PM
formatDateDiff(CreatedAt, 'dateLong', { locale: 'km' })
formatDateDiff(CreatedAt, 'dd/MM/yy')              // custom pattern
formatDateDiff(CreatedAt, 'relative')              // 3 days ago
formatDateDiff(CreatedAt, 'datetime', { utc: true })
*/