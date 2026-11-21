// utils/formatDateDiff.js - self-contained (rdate.js is NOT modified, only its DATE_FORMATS is read)
import { format as fnsFormat, getISODay, getMonth, parseISO, isValid } from 'date-fns'
import { DATE_FORMATS as RDATE_FORMATS } from './rdate'
import { getMonth as monthName, getDayOfWeek as dayName } from '../helpers/str'
import helper from './helper'

export const DATE_FORMATS = {
  default: { date: true, time: true },
  datetime: { date: true, time: true },
  date: { date: true, time: false },
  time: { date: false, time: true },
  full: { date: true, time: true },

  years: { units: ['years'] },
  months: { units: ['months'] },
  days: { units: ['days'] },
  hours: { units: ['hours'] },
  minutes: { units: ['minutes'] },
  seconds: { units: ['seconds'] },
}

const UNIT_PATTERNS = { years: 'yyyy', months: 'MMMM', days: 'dd', hours: 'HH', minutes: 'mm', seconds: 'ss' }

const shapeToPattern = ({ date = true, time = true, units } = {}) => {
  if (units?.length) return units.map(u => UNIT_PATTERNS[u]).filter(Boolean).join(' ') || 'datetimeFull'
  if (date && time) return 'datetimeFull'
  if (date) return 'dateFull'
  if (time) return 'time12'
  return 'datetimeFull'
}

// ---------- language (km | en | zh) ----------
// Localized tokens: dddd/EEEE ddd/EEE mmmm/MMMM mmm/MMM
const LOCALIZED = /(?<![A-Za-z])(EEEE|EEE|dddd|ddd|MMMM|MMM|mmmm|mmm)(?![A-Za-z])/g

const resolveLang = (lang) => {
  let l = lang
  if (!l) { try { l = helper().config.lang } catch { /* no helper */ } }
  if (!l) { try { l = useNuxtApp().$i18n?.locale?.value } catch { /* outside Nuxt context */ } }
  l = String(l || 'en').split('-')[0]
  return ['en', 'km', 'zh'].includes(l) ? l : 'en'
}

const localizedToken = (token, date, lang) => {
  const isDay = token[0] === 'E' || token[0] === 'd'
  const full = isDay ? dayName(getISODay(date), lang) : monthName(getMonth(date) + 1, lang)
  return token.length === 3 && lang === 'en' ? full.slice(0, 3) : full
}

// quote custom tokens so date-fns keeps them literal, then swap in the translated text
const render = (date, pattern, lang) =>
  fnsFormat(date, pattern.replace(LOCALIZED, t => `'§${t}§'`))
    .replace(/§(\w+)§/g, (_, t) => localizedToken(t, date, lang))

// ---------- input safety ----------
const isBlank = v => v == null || (typeof v === 'string' && !v.trim())

const show = (v) => {
  try { return typeof v === 'string' ? JSON.stringify(v) : String(v) } catch { return typeof v }
}

/** Date | ms timestamp | ISO string -> valid Date, else null */
const toDate = (v) => {
  let d = null
  if (v instanceof Date) d = v
  else if (typeof v === 'number' && Number.isFinite(v)) d = new Date(v)
  else if (typeof v === 'string' && /\d/.test(v) && !/^\d+$/.test(v.trim())) d = parseISO(v.trim())
  return d && isValid(d) ? d : null
}

const seen = new Set()
const warn = (message, notify) => {
  console.warn(`[formatDateDiff] ${message}`)
  if (!notify || import.meta.server || seen.has(message)) return // dedupe: lists render many rows
  seen.add(message)
  try {
    const toast = useToast() // resolve synchronously (needs Nuxt context)
    queueMicrotask(() => // never mutate toast state during render
      toast.add({ title: 'formatDateDiff', description: message, color: 'warning', icon: 'i-lucide-triangle-alert' }),
    )
  } catch { /* toast unavailable */ }
}

/**
 * @param {Date|number|string|null|undefined} d
 * @param {string|object} [format='default']  shape key, { date, time, units }, rdate key or raw pattern
 * @param {{ fallback?: string, notify?: boolean, lang?: string }} [options]  notify: toast on misuse (default dev only)
 */
export default (d, format = 'default', { fallback = '', notify = import.meta.dev, lang } = {}) => {
  const date = isBlank(d) ? null : toDate(d)
  if (!isBlank(d) && !date) warn(`Invalid date value: ${show(d)}`, notify)

  let pattern
  if (typeof format === 'string') {
    pattern = Object.hasOwn(DATE_FORMATS, format) ? shapeToPattern(DATE_FORMATS[format]) : format
  } else if (format && typeof format === 'object') {
    pattern = shapeToPattern(format)
  } else {
    warn(`Invalid format: ${show(format)}`, notify)
    pattern = shapeToPattern(DATE_FORMATS.default)
  }

  const run = (p) => {
    if (!date) return fallback
    try {
      const resolved = Object.hasOwn(RDATE_FORMATS, p) ? RDATE_FORMATS[p] : p
      return render(date, resolved, resolveLang(lang))
    } catch (e) {
      warn(`Invalid format pattern ${show(p)}: ${e.message}`, notify)
      return fallback
    }
  }

  const result = run(pattern)

  return {
    value: result,

    format(p = pattern) {
      return run(p)
    },

    toString() {
      return result
    },

    valueOf() {
      return result
    },

    [Symbol.toPrimitive]() {
      return result
    },
  }
}