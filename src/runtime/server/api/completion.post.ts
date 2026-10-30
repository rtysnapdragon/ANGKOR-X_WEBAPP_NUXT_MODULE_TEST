import { streamText, createTextStreamResponse } from 'ai'
import { gateway } from '@ai-sdk/gateway'

// Small in-memory cache so we don't hit the models endpoint on every request
let cachedModelId: string | null = null
let cachedAt = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// Models we're happy to fall back through, cheapest/most-likely-free first.
// These are common picks that tend to be free-tier eligible, but eligibility
// is enforced server-side by Vercel and can change without notice.
const PREFERRED_FALLBACKS = [
  'anthropic/claude-haiku-4.5',
  'google/gemini-2.5-flash-lite',
  'openai/gpt-5.4-mini'
]

async function pickFreeModelId(): Promise<string> {
  const now = Date.now()
  if (cachedModelId && now - cachedAt < CACHE_TTL_MS) {
    return cachedModelId
  }

  try {
    const { models } = await gateway.getAvailableModels()

    // Prefer a model with literally zero token cost, if the catalog exposes one
    const free = models.find((m: any) => {
      const input = Number(m.pricing?.input ?? -1)
      const output = Number(m.pricing?.output ?? -1)
      return input === 0 && output === 0
    })

    if (free) {
      cachedModelId = free.id
      cachedAt = now
      return cachedModelId
    }

    // Otherwise fall back to the cheapest model we know tends to be
    // free-tier eligible and is actually present in the live catalog
    const available = new Set(models.map((m: any) => m.id))
    const fallback = PREFERRED_FALLBACKS.find(id => available.has(id))
    cachedModelId = fallback ?? PREFERRED_FALLBACKS[0]
    cachedAt = now
    return cachedModelId
  } catch {
    // If model discovery fails for any reason, just use the known-cheap default
    return PREFERRED_FALLBACKS[0]
  }
}

export default defineEventHandler(async (event: any) => {
  const { prompt, mode, language } = await readBody(event)

  if (!prompt) {
    throw createError({ statusCode: 400, message: 'Prompt is required' })
  }

  if (mode !== 'translate') {
    throw createError({ statusCode: 400, message: 'Only translate mode is supported' })
  }

  const modelId = await pickFreeModelId()
  const model = gateway(modelId)

  const instructions = `You are a writing assistant. Translate the given text to ${language || 'English'}. IMPORTANT: Preserve all markdown formatting (bold, italic, links, etc.) exactly as in the original. Only output the translated text, nothing else.`

  try {
    const result = streamText({
      model,
      instructions,
      prompt,
      maxOutputTokens: 500
    })

    return createTextStreamResponse({ stream: result.textStream })
  } catch (err: any) {
    // If the chosen model turns out to be restricted on the free tier,
    // drop it from consideration and retry once with the next fallback
    if (err?.statusCode === 403 && modelId !== PREFERRED_FALLBACKS[0]) {
      cachedModelId = null
      const retryModel = gateway(PREFERRED_FALLBACKS[0])
      const result = streamText({
        model: retryModel,
        instructions,
        prompt,
        maxOutputTokens: 500
      })
      return createTextStreamResponse({ stream: result.textStream })
    }
    throw err
  }
})
