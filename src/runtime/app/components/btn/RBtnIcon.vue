<template>
  <UButton size="md" color="transparent" variant="ghost" class="icon-btn-29345">
    <i v-if="icon.startsWith('ri')" :class="icon" style="font-size: 18px"></i>
    <i v-if="icon.startsWith('<')" v-html="icon" style="font-size: 18px"></i>
    <UIcon v-else :icon="icon" />
    <slot name="path" />
  </UButton>
</template>

<script setup>
const props = defineProps(["icon"]);
const emit = defineEmits([]);
const icon = computed({
  get() {
    return props.icon;
  },
});
</script>

<style scoped lang="scss">
.icon-btn-29345 {
  border-radius: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-w-b-1);
  width: 20px !important;
  height: 20px !important;
}
</style>
