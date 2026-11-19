
<template>
  <div class="space-y-3 text-sm">
    <p>
      Are you sure you want to delete
      <strong>{{ name }}</strong>?
    </p>

    <div class="rounded-lg bg-red-50 dark:bg-red-950 p-3">
      <p class="font-semibold text-red-600">
        Warning: This action cannot be undone.
      </p>

      <p class="text-red-500 mt-1">
        {{ count }} associated records may be affected.
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    default: 'Record'
  },
  count: {
    type: Number,
    default: 0
  }
})
</script>
