// composables/EditorUseCompletion.js
// AI completion for UEditor — { extension, handlers, isLoading, mode, abort }.
//
// Rewritten without @ai-sdk/vue. Root causes of the old behaviour:
//   • `body: computed(...)` — useCompletion does not unwrap refs, so `mode` and
//     `language` never reached the server (every request looked like "continue").
//   • Shared mutable `mode`/`insertState` refs + two watchers raced each other.
//   • Selected text was sent as plain text although the prompt says "preserve
//     markdown"; the result was applied without checking the selection was
//     unchanged.
// This version talks to the endpoint with plain fetch + ReadableStream (the
// server returns a text/plain stream), passes mode/language explicitly per
// request, aborts stale requests, and applies transforms as ONE undo step.

import { ref, toValue, onScopeDispose } from 'vue'
import { Completion } from './EditorCompletionExtension'

const CONTEXT_CHARS = 3000

// ── Streaming fetch ──────────────────────────────────────────────────────────
async function streamCompletion(url, body, { signal, onChunk }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    let message = `Completion request failed (${res.status})`
    try {
      const json = await res.json()
      message = json?.message || json?.statusMessage || message
    } catch { /* not JSON */ }
    throw new Error(message)
  }
  if (!res.body) {
    const text = await res.text()
    onChunk?.(text, text)
    return text
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const delta = decoder.decode(value, { stream: true })
    if (delta) { full += delta; onChunk?.(full, delta) }
  }
  const tail = decoder.decode()
  if (tail) { full += tail; onChunk?.(full, tail) }
  return full
}

// ── Editor <-> text helpers ──────────────────────────────────────────────────
function serialize(editor, docNode) {
  try {
    const md = editor.markdown?.serialize?.(docNode.toJSON())
    if (typeof md === 'string') return md
  } catch { /* fall back to plain text */ }
  return docNode.textBetween(0, docNode.content.size, '\n')
}

function contextBefore(editor, pos) {
  const text = serialize(editor, editor.state.doc.cut(0, pos))
  return text.length > CONTEXT_CHARS ? text.slice(-CONTEXT_CHARS) : text
}

function withLeadingSpace(editor, pos, text) {
  const before = editor.state.doc.textBetween(Math.max(0, pos - 1), pos)
  return before && !/\s/.test(before) && !/^[\s.,;:!?)\]]/.test(text) ? ` ${text}` : text
}

// Small models like to wrap answers in code fences.
function cleanOutput(text) {
  return text.trim().replace(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/, '$1').trim()
}

// ── Composable ───────────────────────────────────────────────────────────────
export function useEditorCompletion(editorRef, options = {}) {
  const isLoading = ref(false)
  const mode = ref('continue')
  const language = ref(undefined)
  let controller = null
  let seq = 0

  const getEditor = () => editorRef.value?.editor ?? null
  const getStorage = () => getEditor()?.storage?.completion

  function abort() {
    controller?.abort()
    controller = null
    seq++
    isLoading.value = false
  }
  onScopeDispose(abort)

  async function request(prompt, { mode: m, language: lang, onChunk }) {
    abort()
    const id = seq
    controller = new AbortController()
    isLoading.value = true
    mode.value = m
    language.value = lang
    try {
      const text = await streamCompletion(
        toValue(options.api) || '/api/completion',
        { prompt, mode: m, language: lang },
        { signal: controller.signal, onChunk: (full, delta) => { if (id === seq) onChunk?.(full, delta) } },
      )
      return id === seq ? text : null
    } catch (error) {
      if (error?.name === 'AbortError' || id !== seq) return null
      console.error('[REditor] AI completion failed:', error)
      options.onError?.(error)
      getStorage()?.clearSuggestion()
      return null
    } finally {
      if (id === seq) { isLoading.value = false; controller = null }
    }
  }

  // Ghost text (Mod-J / auto trigger) — shown as a decoration, Tab accepts.
  async function suggestInline(editor) {
    const storage = getStorage()
    if (!storage?.visible) return
    const pos = storage.position
    await request(contextBefore(editor, pos), {
      mode: 'continue',
      onChunk: (full) => {
        const s = getStorage()
        if (!s?.visible || s.position !== pos) return
        s.setSuggestion(withLeadingSpace(editor, pos, full))
        editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
      },
    })
  }

  // "Continue sentence" from the menu — streams text straight into the doc.
  async function continueText(editor) {
    if (isLoading.value) return
    getStorage()?.clearSuggestion()
    let pos = editor.state.selection.to
    let inserted = ''
    await request(contextBefore(editor, pos), {
      mode: 'continue',
      onChunk: (full) => {
        const ed = getEditor()
        if (!ed) return
        const delta = full.slice(inserted.length)
        if (!delta) return
        const piece = inserted ? delta : withLeadingSpace(ed, pos, delta)
        ed.chain().command(({ tr }) => { tr.insertText(piece, pos); return true }).run()
        pos += piece.length
        inserted += delta
      },
    })
  }

  // Selection transforms (fix / extend / reduce / simplify / summarize / translate).
  async function transform(editor, m, lang) {
    if (isLoading.value) return
    getStorage()?.clearSuggestion()
    const { from, to, empty } = editor.state.selection
    if (empty) return

    const snapshot = editor.state.doc.textBetween(from, to, '\n')
    const selectionMd = serialize(editor, editor.state.doc.cut(from, to))
    const raw = await request(selectionMd, { mode: m, language: lang })
    const text = raw ? cleanOutput(raw) : ''
    if (!text) return

    const ed = getEditor()
    // Don't clobber edits the user made while the model was answering.
    if (!ed || ed.state.doc.textBetween(from, to, '\n') !== snapshot) return
    ed.chain().focus().insertContentAt({ from, to }, text, { contentType: 'markdown' }).run()
  }

  const extension = Completion.configure({
    onTrigger: (editor) => { void suggestInline(editor) },
    onAccept: abort,
    onDismiss: abort,
  })

  const transformHandler = m => ({
    canExecute: editor => !editor.state.selection.empty && !isLoading.value,
    execute: (editor, cmd) => { void transform(editor, m, cmd?.language); return editor.chain() },
    isActive: (_e, cmd) => isLoading.value && mode.value === m && (m !== 'translate' || language.value === cmd?.language),
    isDisabled: editor => editor.state.selection.empty || isLoading.value,
  })

  const handlers = {
    aiContinue: {
      canExecute: () => !isLoading.value,
      execute: (editor) => { void continueText(editor); return editor.chain() },
      isActive: () => isLoading.value && mode.value === 'continue',
      isDisabled: () => isLoading.value,
    },
    aiFix: transformHandler('fix'),
    aiExtend: transformHandler('extend'),
    aiReduce: transformHandler('reduce'),
    aiSimplify: transformHandler('simplify'),
    aiSummarize: transformHandler('summarize'),
    aiTranslate: transformHandler('translate'),
  }

  return { extension, handlers, isLoading, mode, abort }
}

export default useEditorCompletion