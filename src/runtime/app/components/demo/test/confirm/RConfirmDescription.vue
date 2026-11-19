<template>
  <component :is="renderContent" />
</template>

<script setup>
import { defineComponent } from 'vue'

defineProps({
  content: {
    type: [String, Object, Array],
    default: ''
  }
})

const renderContent = computed(() =>
  defineComponent({
    setup() {
      return () => content
    }
  })
)
</script>