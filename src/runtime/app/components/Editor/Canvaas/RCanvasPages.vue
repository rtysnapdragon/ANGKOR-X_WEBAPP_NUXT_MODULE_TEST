<script setup>
// Bottom strip: page thumbnails + add / duplicate / delete / reorder.
import { ref } from 'vue'

const props = defineProps({
  state: { type: Object, required: true },
  api: { type: Object, required: true },
})

const renaming = ref(null)
function commit(i, e) {
  props.api.renamePage(i, e.target.value.trim())
  renaming.value = null
}
</script>

<template>
  <div class="rc-pages" aria-label="Pages">
    <div
      v-for="(p, i) in state.pages" :key="p.id" class="rc-page" :class="{ 'is-on': i === state.pageIndex }"
      role="button" tabindex="0" :aria-label="p.name" @click="api.goToPage(i)" @keydown.enter.prevent="api.goToPage(i)"
    >
      <span class="rc-page__thumb" :style="{ aspectRatio: `${state.width} / ${state.height}` }">
        <img v-if="p.thumb" :src="p.thumb" :alt="p.name" draggable="false">
      </span>
      <input
        v-if="renaming === i" class="rc-input rc-page__rename" :value="p.name" autofocus
        @click.stop @keydown.enter="commit(i, $event)" @keydown.esc="renaming = null" @blur="commit(i, $event)"
      >
      <span v-else class="rc-page__name" @dblclick.stop="renaming = i">{{ i + 1 }} · {{ p.name }}</span>

      <span v-if="i === state.pageIndex" class="rc-page__tools" @click.stop>
        <button type="button" class="rc-btn rc-btn--sm" title="Move left" :disabled="i === 0" @click="api.movePage(i, i - 1)"><UIcon name="i-lucide-chevron-left" class="rc-ico" /></button>
        <button type="button" class="rc-btn rc-btn--sm" title="Move right" :disabled="i === state.pages.length - 1" @click="api.movePage(i, i + 1)"><UIcon name="i-lucide-chevron-right" class="rc-ico" /></button>
        <button type="button" class="rc-btn rc-btn--sm" title="Duplicate page" @click="api.duplicatePage(i)"><UIcon name="i-lucide-copy" class="rc-ico" /></button>
        <button type="button" class="rc-btn rc-btn--sm rc-btn--danger" title="Delete page" @click="api.deletePage(i)"><UIcon name="i-lucide-trash-2" class="rc-ico" /></button>
      </span>
    </div>
    <button type="button" class="rc-pages__add" title="Add page" @click="api.addPage()">
      <UIcon name="i-lucide-plus" class="rc-ico rc-ico--lg" /><span>Add page</span>
    </button>
  </div>
</template>
