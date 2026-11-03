<template>
  <div class="r-wrapper-page" :class="props.class">
    <slot></slot>
  </div>
</template>

<script setup>
const props = defineProps(["class"]);
</script>

<style lang="scss" scoped>
.r-wrapper-page {
  display: flex;
  flex-direction: column;
  // margin-left: 8px;
  // margin-right: 8px;
  padding: 0px 20px 20px 20px;
  border-radius: 12px;
  grid-gap: var(--sp-3,16px);
  height: calc(100dvh - 70px);
}
@media (max-width: 768px) {
  .r-wrapper-page {
    padding: 0px 14px 20px 14px;
    grid-gap: 12px !important;
    height: calc(100dvh - 114px) !important;
  }
}
</style>
