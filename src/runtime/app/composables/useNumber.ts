// composables/useNumber.ts
import { useI18n } from 'vue-i18n'
import { formatNumber } from '~/utils/number'

export default function useNumber(value: number) {
  const { locale } = useI18n()

  return formatNumber(value, locale.value as 'km' | 'en')
}


///usage
// const { format, translate } = useNumber()

// format(1234567)      // Uses current language automatically
// translate(2025)      // 2025 -> ២០២៥ if locale is km