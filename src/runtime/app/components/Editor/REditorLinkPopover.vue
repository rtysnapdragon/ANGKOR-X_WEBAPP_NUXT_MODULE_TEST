<script setup>
// REditorLinkPopover — link button + popover used inside the toolbars.
import { computed, ref } from 'vue'

const props = defineProps({
  editor: { type: Object, required: true },
})

const open = ref(false)
const url = ref('')

// editor.state is reactive in @tiptap/vue-3, so this tracks the selection.
const hasLink = computed(() => props.editor.isActive('link'))

function onOpen(value) {
  open.value = value
  if (value) url.value = props.editor.getAttributes('link').href || ''
}

// Adds https:// when no scheme is given and rejects javascript:/data: URLs.
function normalize(raw) {
  const value = raw.trim()
  if (!value) return ''
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
  try {
    const { protocol } = new URL(withScheme)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(protocol) ? withScheme : ''
  } catch { return '' }
}

function applyLink() {
  const href = normalize(url.value)
  const chain = props.editor.chain().focus()
  if (!href) {
    chain.extendMarkRange('link').unsetLink().run()
  }
  else if (props.editor.state.selection.empty && !hasLink.value) {
    // Nothing selected: insert the URL itself as a link.
    chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
  }
  else {
    chain.extendMarkRange('link').setLink({ href }).run()
  }
  open.value = false
}

function removeLink() {
  props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
  open.value = false
}
</script>

<template>
  <UPopover :open="open" @update:open="onOpen">
    <UButton
      icon="i-lucide-link"
      color="neutral"
      :variant="hasLink ? 'soft' : 'ghost'"
      size="sm"
      aria-label="Link"
    />
    <template #content>
      <div class="r-link-popover">
        <UInput
          v-model="url"
          placeholder="https://example.com"
          icon="i-lucide-link"
          size="sm"
          autofocus
          @keydown.enter.prevent="applyLink"
        />
        <div class="r-link-popover__actions">
          <UButton v-if="hasLink" size="xs" color="error" variant="soft" @click="removeLink">
            Remove
          </UButton>
          <UButton size="xs" @click="applyLink">
            Apply
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.r-link-popover {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  width: 260px;
}
.r-link-popover__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
}
</style>
