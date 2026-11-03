/**
 * useTr — reactive DB translation composable
 * All translations come from the API via translationStore.
 * No bundled locale file fallback — tr(key) returns fallback or key if not in DB.
 */
export const useTr = () => {
  const translationStore = useTranslationStore()

  // Reactive — re-evaluates whenever map is replaced (language switch)
  const mapRef = computed(() => translationStore.map)

  const tr = (key, fallback) => {
    const val = mapRef.value[key]
    if (val != null) return val
    return fallback ?? key
  }

  const trRef = (key, fallback) => computed(() => tr(key, fallback))

  const hasTr = (key) => key in mapRef.value

  return { tr, trRef, hasTr }
}
