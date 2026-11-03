// composables/useAiTranslate.ts
// AI translate composable — km ↔ en using claude-haiku-4-5 (fast, low-cost)
// Used inside RTextarea trailing slot when :ai="true"

import { ref } from 'vue'

export type TranslateLang = 'en' | 'km' | 'auto'

export interface TranslateOptions {
  text:     string
  from?:    TranslateLang   // 'auto' = detect
  to?:      TranslateLang   // 'auto' = opposite of detected
  context?: string          // optional domain hint e.g. "medical", "legal", "wedding"
}

export interface TranslateResult {
  original:   string
  translated: string
  detectedFrom: string
  to:         string
  model:      string
}

const _cache = new Map<string, TranslateResult>()

export function useAiTranslate() {
  const loading    = ref(false)
  const error      = ref<string | null>(null)
  const lastResult = ref<TranslateResult | null>(null)

  // ── Detect language from text ─────────────────────────────────────────────
  function detectLang(text: string): 'km' | 'en' {
    // Khmer Unicode range: U+1780–U+17FF
    const khmerChars = (text.match(/[\u1780-\u17FF]/g) || []).length
    return khmerChars > text.length * 0.15 ? 'km' : 'en'
  }

  // ── Build translate prompt ────────────────────────────────────────────────
  function buildPrompt(opts: TranslateOptions): { from: string; to: string; prompt: string } {
    const detected = opts.from === 'auto' || !opts.from ? detectLang(opts.text) : opts.from
    const target   = opts.to === 'auto' || !opts.to
      ? (detected === 'km' ? 'en' : 'km')
      : opts.to

    const langNames: Record<string, string> = {
      km: 'Khmer (Cambodian, Unicode script)',
      en: 'English',
    }

    const contextLine = opts.context
      ? `Domain/context: ${opts.context}`
      : ''

    const prompt = `Translate the following text from ${langNames[detected]} to ${langNames[target]}.
${contextLine}

Rules:
- Return ONLY the translated text — no explanations, no labels, no quotes
- Preserve paragraph breaks and line breaks exactly
- Keep proper nouns, names, numbers as-is unless they have standard translations
- Match the tone and register of the original (formal stays formal, casual stays casual)
- For Khmer output: use standard Unicode Khmer script

Text to translate:
${opts.text}`

    return { from: detected, to: target, prompt }
  }

  // ── Main translate function ───────────────────────────────────────────────
  async function translate(opts: TranslateOptions): Promise<TranslateResult> {
    if (!opts.text?.trim()) {
      throw new Error('Nothing to translate')
    }

    const cacheKey = `${opts.from}:${opts.to}:${opts.context}:${opts.text}`
    if (_cache.has(cacheKey)) {
      const cached = _cache.get(cacheKey)!
      lastResult.value = cached
      return cached
    }

    loading.value = true
    error.value   = null

    const { from, to, prompt } = buildPrompt(opts)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-haiku-4-5',
          max_tokens: 1024,
          system:     'You are a professional translator specializing in Khmer and English. Always return only the translated text, nothing else.',
          messages:   [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `API error ${response.status}`)
      }

      const data        = await response.json()
      const translated  = data.content?.[0]?.text?.trim() ?? ''

      const result: TranslateResult = {
        original:     opts.text,
        translated,
        detectedFrom: from,
        to,
        model:        'claude-haiku-4-5',
      }

      _cache.set(cacheKey, result)
      lastResult.value = result
      return result

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Translation failed'
      error.value = msg
      throw new Error(msg)
    } finally {
      loading.value = false
    }
  }

  // ── Shorthand helpers ─────────────────────────────────────────────────────
  async function toKhmer(text: string, context?: string) {
    return translate({ text, from: 'en', to: 'km', context })
  }

  async function toEnglish(text: string, context?: string) {
    return translate({ text, from: 'km', to: 'en', context })
  }

  async function autoTranslate(text: string, context?: string) {
    return translate({ text, from: 'auto', to: 'auto', context })
  }

  function clearCache() { _cache.clear() }

  return {
    translate,
    toKhmer,
    toEnglish,
    autoTranslate,
    clearCache,
    loading,
    error,
    lastResult,
  }
}
