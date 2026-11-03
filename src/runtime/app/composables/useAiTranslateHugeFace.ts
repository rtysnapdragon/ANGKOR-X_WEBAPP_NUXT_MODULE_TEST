// composables/useAiTranslate.ts - Hugging Face (Fixed)

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

export function useAiTranslateHugeFace() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<TranslateResult | null>(null)

  // Language codes for NLLB-200
  const NLLB_LANGS: Record<string, string> = {
    'en': 'eng_Latn',
    'km': 'khm_Khmr',
    'zh': 'zho_Hans',
    'vi': 'vie_Latn',
    'th': 'tha_Thai',
    'fr': 'fra_Latn',
    'de': 'deu_Latn',
    'es': 'spa_Latn',
    'ja': 'jpn_Jpan',
    'ko': 'kor_Hang',
  }

  // Mapping back from NLLB codes
  const NLLB_LANGS_REVERSE: Record<string, string> = {
    'eng_Latn': 'en',
    'khm_Khmr': 'km',
    'zho_Hans': 'zh',
    'vie_Latn': 'vi',
    'tha_Thai': 'th',
    'fra_Latn': 'fr',
    'deu_Latn': 'de',
    'spa_Latn': 'es',
    'jpn_Jpan': 'ja',
    'kor_Hang': 'ko',
  }

  async function translate(options: TranslateOptions): Promise<TranslateResult> {
    loading.value = true
    error.value = null

    try {
      const { text, from = 'auto', to = 'auto', context = '' } = options

      // Detect language if auto
      let detectedFrom = from
      if (from === 'auto') {
        detectedFrom = detectLanguage(text)
      }

      // Determine target language
      let targetTo = to
      if (to === 'auto') {
        targetTo = detectedFrom === 'km' ? 'en' : 'km'
      }

      // Get NLLB language codes
      const sourceLang = NLLB_LANGS[detectedFrom] || 'eng_Latn'
      const targetLang = NLLB_LANGS[targetTo] || 'eng_Latn'

      // Hugging Face API call
      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Optional: Add token if you have one
            // 'Authorization': `Bearer ${process.env.NUXT_PUBLIC_HF_TOKEN || ''}`,
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              source_lang: sourceLang,
              target_lang: targetLang,
            },
            options: {
              wait_for_model: true, // Wait for model to load
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Hugging Face API Error:', errorData)
        
        // Check if model is loading
        if (response.status === 503) {
          throw new Error('Model is loading, please wait 30 seconds and try again')
        }
        
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract translated text from response
      let translatedText = ''
      
      if (Array.isArray(data) && data.length > 0) {
        translatedText = data[0]?.translation_text || data[0] || ''
      } else if (data.translation_text) {
        translatedText = data.translation_text
      } else if (typeof data === 'string') {
        translatedText = data
      } else if (data[0]?.generated_text) {
        translatedText = data[0].generated_text
      }

      // Clean up
      translatedText = translatedText.trim() || text

      const result: TranslateResult = {
        translated: translatedText,
        detectedFrom: detectedFrom,
        to: targetTo
      }

      lastResult.value = result
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed'
      error.value = errorMessage
      console.error('Translation error:', errorMessage)
      
      // Return original text as fallback
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
    // Check for Khmer Unicode range: U+1780 to U+17FF
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