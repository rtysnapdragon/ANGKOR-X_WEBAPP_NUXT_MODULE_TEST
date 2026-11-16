// composables/EditorCompletionExtension.js
// Inline ghost-text suggestions for UEditor (Tab accepts, Esc dismisses,
// Mod-J triggers). Framework-agnostic: no Vue / VueUse imports.
//
// ROOT CAUSE of "Adding different instances of a keyed plugin":
// ProseMirror derives a plugin's internal key as `${name}$${counter}`, and the
// counter lives inside each copy of prosemirror-state. The old code used one
// module-level `new PluginKey('completion')`; when two copies of
// prosemirror-state exist (@nuxt/ui's and your direct `@tiptap/pm` import — or
// a stale HMR copy), both mint "completion$" and collide. Here every editor
// instance gets its own uniquely-named key, so a collision cannot happen even
// if duplicates exist. Still, dedupe the packages — see REDITOR.md.

import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'

let instanceSeq = 0

function refresh(editor) {
  if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
}

function dismiss(ext, editor) {
  if (!ext.storage.visible) return false
  ext.storage.clearSuggestion()
  refresh(editor)
  ext.options.onDismiss?.()
  return true
}

export const Completion = Extension.create({
  name: 'completion',

  addOptions() {
    return {
      debounce: 250,
      autoTrigger: false,
      triggerCharacters: ['/', ':', '@'],
      onTrigger: undefined,
      onAccept: undefined,
      onDismiss: undefined,
    }
  },

  addStorage() {
    return {
      suggestion: '',
      position: undefined,
      visible: false,
      trigger: null,
      cancelTrigger: null,
      // Unique per editor instance (addStorage runs once per editor).
      pluginKey: new PluginKey(`completion_${++instanceSeq}`),
      setSuggestion(text) { this.suggestion = text },
      clearSuggestion() {
        this.suggestion = ''
        this.position = undefined
        this.visible = false
      },
    }
  },

  addProseMirrorPlugins() {
    const storage = this.storage
    return [
      new Plugin({
        key: storage.pluginKey,
        props: {
          decorations(state) {
            if (!storage.visible || !storage.suggestion || storage.position === undefined) {
              return DecorationSet.empty
            }
            const widget = Decoration.widget(storage.position, () => {
              const span = document.createElement('span')
              span.className = 'completion-suggestion'
              span.textContent = storage.suggestion
              span.style.cssText = 'color: var(--ui-text-muted); opacity: 0.6; pointer-events: none;'
              return span
            }, { side: 1 })
            return DecorationSet.create(state.doc, [widget])
          },
        },
      }),
    ]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-j': ({ editor }) => {
        dismiss(this, editor)
        // Manual trigger: immediate, and allowed after punctuation.
        this.storage.trigger?.(editor, { force: true, immediate: true })
        return true
      },
      'Tab': ({ editor }) => {
        const { visible, suggestion, position } = this.storage
        if (!visible || !suggestion || position === undefined) return false
        this.storage.clearSuggestion()
        refresh(editor)
        editor.chain().focus().insertContentAt(position, suggestion).run()
        this.options.onAccept?.()
        return true
      },
      'Escape': ({ editor }) => dismiss(this, editor),
    }
  },

  onUpdate({ editor }) {
    dismiss(this, editor)
    if (this.options.autoTrigger) this.storage.trigger?.(editor)
  },

  onSelectionUpdate({ editor }) {
    dismiss(this, editor)
  },

  onCreate() {
    const storage = this.storage
    const options = this.options
    let timer = null

    const run = (editor, force) => {
      if (!options.onTrigger || editor.isDestroyed || !editor.isEditable) return
      const { selection } = editor.state
      const { $from } = selection
      const text = $from.parent.textContent

      const atEndOfBlock = $from.parentOffset === $from.parent.content.size
      const hasContent = text.trim().length > 0
      const endsWithPunctuation = /[.!?]\s*$/.test(text)
      const endsWithTrigger = (options.triggerCharacters || []).some(c => text.endsWith(c))

      if (!selection.empty || !atEndOfBlock || !hasContent) return
      if (!force && (endsWithPunctuation || endsWithTrigger)) return

      storage.position = selection.from
      storage.visible = true
      options.onTrigger(editor)
    }

    storage.trigger = (editor, { force = false, immediate = false } = {}) => {
      clearTimeout(timer)
      if (immediate) return run(editor, force)
      timer = setTimeout(() => run(editor, force), options.debounce ?? 250)
    }
    storage.cancelTrigger = () => clearTimeout(timer)
  },

  onDestroy() {
    this.storage.cancelTrigger?.()
    this.storage.trigger = null
  },
})

export default Completion