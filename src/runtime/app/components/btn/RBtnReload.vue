<template>
  <RTooltip :text="$t('refresh')">
    <div class="rty-btn-reload" @click="emit('onClick')">
      <i class="ri-loop-right-fill"></i>
    </div>
  </RTooltip>
</template>

<script setup>
const emit = defineEmits('onClick')
</script>

<style lang="scss">
.rty-btn-reload {
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

.rty-content,
.rty-modal {
  .rty-btn-reload {
    background: var(--bg-wrapper);
  }
}
</style>
