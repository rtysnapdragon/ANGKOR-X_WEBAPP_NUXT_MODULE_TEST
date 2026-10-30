import { useCompletion } from '@ai-sdk/vue'
import { ref, computed } from 'vue'

export function useAICompletion(options = {}) {
  const mode = ref('continue')
  const language = ref('English')

  const {
    completion,
    complete: aiComplete,
    isLoading,
    stop,
    setCompletion
  } = useCompletion({
    api: options.api || '/api/completion',
    streamProtocol: 'text',
    body: computed(() => ({
      mode: mode.value,
      language: language.value
    }))
  })

  async function complete(prompt: string, newMode?: string, lang?: string) {
    mode.value = newMode || 'continue'
    language.value = lang || 'English'

    return aiComplete(prompt)
  }

  return {
    completion,
    complete,
    isLoading,
    stop,
    setCompletion,
    mode,
    language
  }
}