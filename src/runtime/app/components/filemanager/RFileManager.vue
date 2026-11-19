<script setup>
import { computed } from 'vue'
import RModal from '../RModal.vue'
import RFileManagerContent from './RFileManagerContent.vue'

defineOptions({ name: 'RFileManager' })

const props = defineProps({
  open: { type: Boolean, default: false },
  modal: { type: Boolean, default: true },
  multiple: { type: Boolean, default: false },
  accept: { type: String, default: '' },
  selectMode: { type: String, default: 'any' }, // any | image | video | audio | file | none
  provider: { type: String, default: '' },
  folderId: { type: Number, default: null },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  t: { type: Function, default: null },
})

const emit = defineEmits(['update:open', 'select', 'close', 'uploaded', 'deleted'])

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

function onClose() {
  isOpen.value = false
  emit('close')
}

function onSelect(payload) {
  emit('select', payload)
  if (props.modal) {
    isOpen.value = false
    emit('close')
  }
}

function onUploaded(payload) {
  emit('uploaded', payload)
}

function onDeleted(payload) {
  emit('deleted', payload)
}
</script>

<template>
  <RModal
    v-if="modal"
    v-model="isOpen"
    no-header
    expandable
    modal-width="80vw"
    modal-height="80vh"
    modal-radius="16px"
    body-class="rfm-modal-body"
    @on-close="onClose"
  >
    <RFileManagerContent
      v-if="isOpen"
      :inline="false"
      :multiple="multiple"
      :accept="accept"
      :select-mode="selectMode"
      :provider="provider"
      :folder-id="folderId"
      :title="title"
      :description="description"
      :t="t"
      :show-close="true"
      @select="onSelect"
      @close="onClose"
      @uploaded="onUploaded"
      @deleted="onDeleted"
    />
  </RModal>

  <RFileManagerContent
    v-else
    inline
    :multiple="multiple"
    :accept="accept"
    :select-mode="selectMode"
    :provider="provider"
    :folder-id="folderId"
    :title="title"
    :description="description"
    :t="t"
    :show-close="false"
    @select="onSelect"
    @close="onClose"
    @uploaded="onUploaded"
    @deleted="onDeleted"
  />
</template>

<style>
.rfm-modal-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.rfm-modal-body > * {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}
</style>
