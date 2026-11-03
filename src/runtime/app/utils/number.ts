// utils/number.ts

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function toKhmerNumber(value: string | number): string {
  return String(value).replace(/\d/g, d => KHMER_DIGITS[Number(d)])
}

export function toEnglishNumber(value: string): string {
  return value.replace(/[០-៩]/g, d => {
    return ENGLISH_DIGITS[KHMER_DIGITS.indexOf(d)]
  })
}

export function containsKhmerNumber(value: string): boolean {
  return /[០-៩]/.test(value)
}

export function containsEnglishNumber(value: string): boolean {
  return /\d/.test(value)
}

export function translateNumber(
  value: string | number,
  locale: 'km' | 'en'
): string {
  return locale === 'km'
    ? toKhmerNumber(value)
    : toEnglishNumber(String(value))
}

export function formatNumber(
  value: number,
  locale: 'km' | 'en' = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const formatted = new Intl.NumberFormat(
    locale === 'km' ? 'km-KH' : 'en-US',
    options
  ).format(value)

  return locale === 'km'
    ? toKhmerNumber(formatted)
    : formatted
}


//Usage
// formatNumber(1234567, 'en')
// // 1,234,567

// formatNumber(1234567, 'km')
// // ១.២៣៤.៥៦៧ (or locale-specific separators)

// translateNumber(2025, 'km')
// // ២០២៥

// translateNumber('២០២៥', 'en')
// // 2025

// containsKhmerNumber('២០២៥')
// // true

// containsEnglishNumber('២០២៥')
// // false