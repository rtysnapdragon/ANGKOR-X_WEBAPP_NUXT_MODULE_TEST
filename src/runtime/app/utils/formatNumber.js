
const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function getLocale() {
  const locale = useCookie('i18n_redirected')
  return locale.value === 'km' ? 'km' : 'en'
}

export function toKhmerNumber(value){
  return String(value).replace(/\d/g, d => KHMER_DIGITS[Number(d)])
}

export function toEnglishNumber(value) {
  return value.replace(/[០-៩]/g, d => {
    return ENGLISH_DIGITS[KHMER_DIGITS.indexOf(d)]
  })
}

export function containsKhmerNumber(value) {
  return /[០-៩]/.test(value)
}

export function containsEnglishNumber(value) {
  return /\d/.test(value)
}

export function translateNumber(value) {
  return getLocale() === 'km'
    ? toKhmerNumber(value)
    : toEnglishNumber(String(value))
}

export default function formatNumber(
  value,
  options,
) {
  const locale = getLocale()

  const formatted = new Intl.NumberFormat(
    locale === 'km' ? 'km-KH' : 'en-US',
    options
  ).format(value)

  return locale === 'km'
    ? toKhmerNumber(formatted)
    : formatted
}


/* Usage
formatNumber(1234567)
// Khmer: ១.២៣៤.៥៦៧
// English: 1,234,567

formatNumber(1234.56, {
  minimumFractionDigits: 2
})

translateNumber(2025)
// Khmer: ២០២៥
// English: 2025

*/