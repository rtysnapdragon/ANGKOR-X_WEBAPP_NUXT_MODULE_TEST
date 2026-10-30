// composables/useAiTranslate.ts - Using LibreTranslate (Free)

import { ref } from 'vue'

interface TranslateOptions {
  text: string
  from?: 'auto' | 'en' | 'km'
  to?: 'auto' | 'en' | 'km'
  context?: string
}

interface TranslateResult {
  translated: string
  detectedFrom: string
  to: string
}

export function useAiTranslateLibre() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<TranslateResult | null>(null)

  // Free LibreTranslate API endpoints
  // Option A: Public instance (rate limited)
  const API_URL = 'https://libretranslate.com/translate'
  
  // Option B: Self-hosted (unlimited)
  // const API_URL = 'http://localhost:5000/translate'

  // Option C: Free alternative - MyMemory API
  // const API_URL = 'https://api.mymemory.translated.net/get'

  async function translate(options: TranslateOptions): Promise<TranslateResult> {
    loading.value = true
    error.value = null

    try {
      const { text, from = 'auto', to = 'auto', context = '' } = options

      // Language mapping for LibreTranslate
      const langMap: Record<string, string> = {
        'en': 'en',
        'km': 'km',
        'auto': 'auto'
      }

      const fromLang = langMap[from] || 'auto'
      let toLang = langMap[to] || 'auto'

      // If auto, detect language
      let detectedFrom = from
      if (from === 'auto' || to === 'auto') {
        const detection = detectLanguage(text)
        detectedFrom = detection
        if (to === 'auto') {
          toLang = detection === 'km' ? 'en' : 'km'
        }
      }

      // Use LibreTranslate API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: fromLang,
          target: toLang,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`)
      }

      const data = await response.json()
      
      // LibreTranslate response format
      let translatedText = data.translatedText || data.translation || data.responseData?.translatedText || ''

      if (!translatedText && Array.isArray(data.matches)) {
        // MyMemory API fallback
        translatedText = data.matches[0]?.translation || ''
      }

      // Clean up
      translatedText = translatedText.trim()

      const result: TranslateResult = {
        translated: translatedText || text, // Fallback to original if empty
        detectedFrom: detectedFrom,
        to: toLang
      }

      lastResult.value = result
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed'
      error.value = errorMessage
      
      // Fallback: Return original text with warning
      console.warn('Translation failed, returning original text:', errorMessage)
      return {
        translated: options.text,
        detectedFrom: 'auto',
        to: options.to || 'auto'
      }
    } finally {
      loading.value = false
    }
  }

  // Simple language detection
  function detectLanguage(text: string): 'en' | 'km' {
    // Check for Khmer Unicode range
    const khmerRegex = /[\u1780-\u17FF]/
    if (khmerRegex.test(text)) {
      return 'km'
    }
    return 'en'
  }

  return {
    translate,
    loading,
    error,
    lastResult
  }
}