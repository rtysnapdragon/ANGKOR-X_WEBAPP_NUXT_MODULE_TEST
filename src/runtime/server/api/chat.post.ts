// server/api/chat.post.ts

import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai' //If you later want multiple providers

export default defineEventHandler(async (event:any) => {
  const { prompt } = await readBody(event)

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    prompt,
  })

  return { text }
})