// EditorCompletionExtension.js
// Ported to plain JS from Nuxt UI's official "With AI completion" example.
// Handles inline ghost-text suggestions (Tab to accept, Esc to dismiss, Mod-J to trigger).
//
// NOTE ON THE "Adding different instances of a keyed plugin" ERROR:
// This extension registers a ProseMirror Plugin with a fixed PluginKey. That
// error happens when Vite ends up bundling two separate copies of
// prosemirror-state/prosemirror-view (one pulled in by @nuxt/ui, one pulled
// in by this file's direct '@tiptap/pm/*' imports) — the two copies' Plugin
// classes are different identities, so PM thinks it's a duplicate key.
// Fix (in nuxt.config.ts, see project notes) — NOT something this file can
// work around on its own:
//
//   vite: {
//     optimizeDeps: {
//       include: [
//         '@nuxt/ui > prosemirror-state',
//         '@nuxt/ui > prosemirror-transform',
//         '@nuxt/ui > prosemirror-model',
//         '@nuxt/ui > prosemirror-view',
//         '@nuxt/ui > prosemirror-gapcursor'
//       ]
//     }
//   }

import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { useDebounceFn } from '@vueuse/core'

export const completionPluginKey = new PluginKey('completion')

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
      debouncedTrigger: null,
      setSuggestion(text) {
        this.suggestion = text
      },
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
        key: completionPluginKey,
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
        if (this.storage.visible) {
          this.storage.clearSuggestion()
          this.options.onDismiss?.()
        }
        this.storage.debouncedTrigger?.(editor)
        return true
      },
      'Tab': ({ editor }) => {
        if (!this.storage.visible || !this.storage.suggestion || this.storage.position === undefined) {
          return false
        }

        const suggestion = this.storage.suggestion
        const position = this.storage.position

        this.storage.clearSuggestion()
        editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
        editor.chain().focus().insertContentAt(position, suggestion).run()

        this.options.onAccept?.()
        return true
      },
      'Escape': ({ editor }) => {
        if (this.storage.visible) {
          this.storage.clearSuggestion()
          editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
          this.options.onDismiss?.()
          return true
        }
        return false
      },
    }
  },

  onUpdate({ editor }) {
    if (this.storage.visible) {
      this.storage.clearSuggestion()
      editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
      this.options.onDismiss?.()
    }

    if (this.options.autoTrigger) {
      this.storage.debouncedTrigger?.(editor)
    }
  },

  onSelectionUpdate({ editor }) {
    if (this.storage.visible) {
      this.storage.clearSuggestion()
      editor.view.dispatch(editor.state.tr.setMeta('completionUpdate', true))
      this.options.onDismiss?.()
    }
  },

  onCreate() {
    const storage = this.storage
    const options = this.options

    this.storage.debouncedTrigger = useDebounceFn((editor) => {
      if (!options.onTrigger) return

      const { state } = editor
      const { selection } = state
      const { $from } = selection

      const isAtEndOfBlock = $from.parentOffset === $from.parent.content.size
      const hasContent = $from.parent.textContent.trim().length > 0
      const textContent = $from.parent.textContent

      const endsWithPunctuation = /[.!?]\s*$/.test(textContent)
      const triggerChars = options.triggerCharacters || []
      const endsWithTrigger = triggerChars.some(char => textContent.endsWith(char))

      if (!isAtEndOfBlock || !hasContent || endsWithPunctuation || endsWithTrigger) {
        return
      }

      storage.position = selection.from
      storage.visible = true
      options.onTrigger(editor)
    }, options.debounce || 250)
  },

  onDestroy() {
    this.storage.debouncedTrigger = null
  },
})

export default Completion