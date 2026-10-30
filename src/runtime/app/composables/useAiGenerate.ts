// composables/useAiGenerate.ts
// AI auto-fill composable using Anthropic claude-haiku-4-5 (fast & free tier)
// Detects field context from: label, name, placeholder, fieldType, formContext
// Returns a short, contextually correct value to fill into the input

import { ref } from 'vue'

export interface AiGenerateOptions {
  // Field metadata for context detection
  label?:        string
  name?:         string
  placeholder?:  string
  type?:         string           // 'text'|'email'|'number'|'textarea' etc.
  // Surrounding form context (pass sibling field values for smarter fills)
  formContext?:  Record<string, unknown>
  // Language hint
  lang?:         'en' | 'km' | 'auto'
  // Max length hint
  maxLength?:    number
  // Custom instruction override (bypass auto-detection)
  instruction?:  string
}

export interface AiGenerateResult {
  value:   string
  cached:  boolean
  model:   string
}

// Simple in-memory cache: key = stringified options → generated value
const _cache = new Map<string, string>()

export function useAiGenerate() {
  const loading = ref(false)
  const error   = ref<string | null>(null)
  const last    = ref<string>('')

  // ── Build system prompt based on field context ──────────────────────────
  function buildPrompt(opts: AiGenerateOptions): string {
    const fieldName = opts.label || opts.name || opts.placeholder || 'unknown field'
    const lang      = opts.lang === 'km' ? 'Khmer' : 'English'
    const typeHint  = opts.type ?? 'text'
    const maxLen    = opts.maxLength ? `Keep it under ${opts.maxLength} characters.` : ''

    let contextLines = ''
    if (opts.formContext && Object.keys(opts.formContext).length) {
      const lines = Object.entries(opts.formContext)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `  - ${k}: ${v}`)
        .join('\n')
      if (lines) contextLines = `\nExisting form values for context:\n${lines}`
    }

    const instruction = opts.instruction
      ? `Task: ${opts.instruction}`
      : `Task: Generate a realistic, appropriate sample value for a form field.
Field name: "${fieldName}"
Field type: ${typeHint}
Output language: ${lang}
${maxLen}
${contextLines}

Rules:
- Return ONLY the value itself — no quotes, no explanation, no markdown
- For email fields: generate a realistic email like name@domain.com
- For phone fields: use Cambodian format +855 XX XXX XXX or local 0XX XXX XXX
- For name fields: generate a realistic ${lang === 'Khmer' ? 'Khmer' : 'English or Cambodian'} name
- For number fields: return only digits
- For textarea/description: 1-3 sentences max
- For date fields: return YYYY-MM-DD format
- For address: realistic Cambodian or generic address
- Keep it concise and realistic`

    return instruction
  }

  // ── Main generate function ──────────────────────────────────────────────
  async function generate(opts: AiGenerateOptions): Promise<AiGenerateResult> {
    const cacheKey = JSON.stringify(opts)

    // Cache hit
    if (_cache.has(cacheKey)) {
      const cached = _cache.get(cacheKey)!
      last.value   = cached
      return { value: cached, cached: true, model: 'cache' }
    }

    loading.value = true
    error.value   = null

    try {
      const prompt = buildPrompt(opts)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'anthropic/claude-haiku-4-5',
          max_tokens: 120,
          system:     'You are a smart form assistant that generates realistic sample values for input fields. Always return just the value, nothing else. No quotes, no explanations.',
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      const data = await response.json()
      const raw  = data.content?.[0]?.text?.trim() ?? ''

      // Clean: strip surrounding quotes if model added them
      const value = raw.replace(/^["'`]|["'`]$/g, '').trim()

      _cache.set(cacheKey, value)
      last.value = value
      return { value, cached: false, model: 'claude-haiku-4-5' }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'AI generate failed'
      error.value = msg
      throw new Error(msg)
    } finally {
      loading.value = false
    }
  }

  // ── Regenerate (clears cache for this specific key) ────────────────────
  async function regenerate(opts: AiGenerateOptions): Promise<AiGenerateResult> {
    const cacheKey = JSON.stringify(opts)
    _cache.delete(cacheKey)
    return generate(opts)
  }

  function clearCache() { _cache.clear() }

  return { generate, regenerate, clearCache, loading, error, last }
}
