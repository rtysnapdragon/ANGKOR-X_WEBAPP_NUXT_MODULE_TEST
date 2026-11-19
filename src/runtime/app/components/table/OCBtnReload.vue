<template>
  <OCTooltip :text="$t('refresh')">
    <div class="ocs-btn-reload" @click="emit('onClick')">
      <i class="ri-loop-right-fill"></i>
    </div>
  </OCTooltip>
</template>

<script setup>
const emit = defineEmits('onClick')
</script>

<style lang="scss">
.ocs-btn-reload {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  background: var(--bg-content);
  color: var(--color-w-b-1);
  cursor: pointer;

  &:focus-visible {
    outline: none
  }
}

.oc-content,
.oc-modal {
  .ocs-btn-reload {
    background: var(--bg-wrapper);
  }
}
</style>