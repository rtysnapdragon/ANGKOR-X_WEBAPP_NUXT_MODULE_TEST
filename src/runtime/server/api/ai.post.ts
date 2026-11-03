// server/api/ai.post.ts

import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export default defineEventHandler(async (event:any) => {
  const { prompt, mode, language } = await readBody(event)

  const modelGoogle = google('gemini-2.5-flash')
  const modelAstropic = anthropic('claude-sonnet-4-5')
  let systemPrompt = ''

  if (mode === 'translate') {
    systemPrompt = `
You are a professional translator.
Translate the given text into ${language}.
Return only the translated text.
Do not add explanations.
    `
  }

  const result = await generateText({
    model: modelGoogle,
    system: systemPrompt,
    prompt,
  })

  return {
    result: result.text,
  }
})