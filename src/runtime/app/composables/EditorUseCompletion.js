// EditorUseCompletion.js
// Ported to plain JS from Nuxt UI's official "With AI completion" example.
// Wraps @ai-sdk/vue's useCompletion + the Completion extension into a single
// composable that returns { extension, handlers, isLoading, mode }.

import { ref, computed, watch } from 'vue'
import { useCompletion } from '@ai-sdk/vue'
import { Completion } from './EditorCompletionExtension'

export function useEditorCompletion(editorRef, options = {}) {
  // State for direct insertion/transform mode
  const insertState = ref()
  const mode = ref('continue')
  const language = ref()

  function getCompletionStorage() {
    return editorRef.value?.editor?.storage?.completion
  }

  const { completion, complete, isLoading, stop, setCompletion } = useCompletion({
    api: options.api || '/api/completion',
    streamProtocol: 'text',
    body: computed(() => ({
      mode: mode.value,
      language: language.value,
    })),
    onFinish: (_prompt, completionText) => {
      const storage = getCompletionStorage()
      if (mode.value === 'continue' && storage?.visible) {
        return
      }

      const transformModes = ['fix', 'extend', 'reduce', 'simplify', 'summarize', 'translate']
      if (transformModes.includes(mode.value) && insertState.value && completionText) {
        const editor = editorRef.value?.editor
        if (editor) {
          if (insertState.value.deleteRange) {
            editor.chain().focus().deleteRange(insertState.value.deleteRange).run()
          }
          editor.chain().focus().insertContentAt(insertState.value.pos, completionText, { contentType: 'markdown' }).run()
        }
      }

      insertState.value = undefined
    },
    onError: (error) => {
      console.error('AI completion error:', error)
      insertState.value = undefined
      getCompletionStorage()?.clearSuggestion()
    },
  })

  watch(completion, (newCompletion, oldCompletion) => {
    const editor = editorRef.value?.editor
    if (!editor || !newCompletion) return

    const storage = getCompletionStorage()
    if (storage?.visible) {
      let suggestionText = newCompletion
      if (storage.position !== undefined) {
        const textBefore = editor.state.doc.textBetween(Math.max(0, storage.position - 1), storage.position)
        if (textBefore && !/\s/.test(textBefore) && !suggestionText.startsWith(' ')) {
          suggestionText = ` ${suggestionText}`
        }
      }
      storage.setSuggestion(suggestionText)
      editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
    } else if (insertState.value) {
      const transformModes = ['fix', 'extend', 'reduce', 'simplify', 'summarize', 'translate']
      if (transformModes.includes(mode.value)) {
        return
      }

      if (insertState.value.deleteRange && !oldCompletion) {
        editor.chain().focus().deleteRange(insertState.value.deleteRange).run()
        insertState.value.deleteRange = undefined
      }

      let delta = newCompletion.slice(oldCompletion?.length || 0)
      if (delta) {
        if (['fix', 'simplify', 'translate'].includes(mode.value)) {
          delta = delta.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ')
        }

        if (mode.value === 'continue' && !oldCompletion) {
          const textBefore = editor.state.doc.textBetween(Math.max(0, insertState.value.pos - 1), insertState.value.pos)
          if (textBefore && !/\s/.test(textBefore)) {
            delta = ` ${delta}`
          }
        }

        editor.chain().focus().command(({ tr }) => {
          tr.insertText(delta, insertState.value.pos)
          return true
        }).run()
        insertState.value.pos += delta.length
      }
    }
  })

  function triggerTransform(editor, transformMode, lang) {
    if (isLoading.value) return

    getCompletionStorage()?.clearSuggestion()

    const { state } = editor
    const { selection } = state
    if (selection.empty) return

    mode.value = transformMode
    language.value = lang
    const selectedText = state.doc.textBetween(selection.from, selection.to)

    insertState.value = { pos: selection.from, deleteRange: { from: selection.from, to: selection.to } }
    complete(selectedText)
  }

  function getMarkdownBefore(editor, pos) {
    const { state } = editor
    const serializer = editor.storage.markdown?.serializer
    if (serializer) {
      const slice = state.doc.slice(0, pos)
      return serializer.serialize(slice.content)
    }
    return state.doc.textBetween(0, pos, '\n')
  }

  function triggerContinue(editor) {
    if (isLoading.value) return

    mode.value = 'continue'
    getCompletionStorage()?.clearSuggestion()
    const { state } = editor
    const { selection } = state

    if (selection.empty) {
      const textBefore = getMarkdownBefore(editor, selection.from)
      insertState.value = { pos: selection.from }
      complete(textBefore)
    } else {
      const textBefore = getMarkdownBefore(editor, selection.to)
      insertState.value = { pos: selection.to }
      complete(textBefore)
    }
  }

  const extension = Completion.configure({
    onTrigger: (editor) => {
      if (isLoading.value) return
      mode.value = 'continue'
      const textBefore = getMarkdownBefore(editor, editor.state.selection.from)
      complete(textBefore)
    },
    onAccept: () => setCompletion(''),
    onDismiss: () => { stop(); setCompletion('') },
  })

  const handlers = {
    aiContinue: {
      canExecute: () => !isLoading.value,
      execute: (editor) => { triggerContinue(editor); return editor.chain() },
      isActive: () => !!(isLoading.value && mode.value === 'continue'),
      isDisabled: () => !!isLoading.value,
    },
    aiFix: {
      canExecute: (editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor) => { triggerTransform(editor, 'fix'); return editor.chain() },
      isActive: () => !!(isLoading.value && mode.value === 'fix'),
      isDisabled: (editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiExtend: {
      canExecute: (editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor) => { triggerTransform(editor, 'extend'); return editor.chain() },
      isActive: () => !!(isLoading.value && mode.value === 'extend'),
      isDisabled: (editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiReduce: {
      canExecute: (editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor) => { triggerTransform(editor, 'reduce'); return editor.chain() },
      isActive: () => !!(isLoading.value && mode.value === 'reduce'),
      isDisabled: (editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiSimplify: {
      canExecute: (editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor) => { triggerTransform(editor, 'simplify'); return editor.chain() },
      isActive: () => !!(isLoading.value && mode.value === 'simplify'),
      isDisabled: (editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiSummarize: {
      canExecute: (editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor) => { triggerTransform(editor, 'summarize'); return editor.chain() },
      isActive: () => !!(isLoading.value && mode.value === 'summarize'),
      isDisabled: (editor) => editor.state.selection.empty || !!isLoading.value,
    },
    aiTranslate: {
      canExecute: (editor) => !editor.state.selection.empty && !isLoading.value,
      execute: (editor, cmd) => { triggerTransform(editor, 'translate', cmd?.language); return editor.chain() },
      isActive: (_editor, cmd) => !!(isLoading.value && mode.value === 'translate' && language.value === cmd?.language),
      isDisabled: (editor) => editor.state.selection.empty || !!isLoading.value,
    },
  }

  return { extension, handlers, isLoading, mode }
}

export default useEditorCompletion
