<script setup lang="ts">
const props = defineProps<{
  code?: string
  language?: string
}>()

const download = () => {
  const blob = new Blob([props.code || ''], {
    type: 'text/markdown;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url

  // use language as extension
  const ext = props.language || 'txt'
  a.download = `example.${ext}`

  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="code-wrapper">
    <button
      class="download-btn"
      @click="download"
    >
      Download
    </button>

    <pre>
      <slot />
    </pre>
  </div>
</template>

<style scoped>
.code-wrapper {
  position: relative;
}

.download-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;

  padding: 6px 12px;
  border: none;
  border-radius: 6px;

  background: #2563eb;
  color: white;
  cursor: pointer;
}

.download-btn:hover {
  background: #1d4ed8;
}
</style>