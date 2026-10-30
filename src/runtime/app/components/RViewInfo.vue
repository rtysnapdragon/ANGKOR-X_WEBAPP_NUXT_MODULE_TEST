<template>
  <div class="oc-group-view">
    <div class="oc-title" :class="`${props.size} ${props.colorTitle}`">
      <slot name="title" v-if="$slots.title"></slot>
      <div v-else>{{ title }}</div>
    </div>

    <div class="oc-sub-title" :class="`${props.size} ${props.colorSubtitle}`" v-if="isNotEmpty(subTitle)">
      {{ subTitle }}
    </div>
    <slot name="subTitle" v-if="$slots.subTitle"></slot>
  </div>
</template>

<script setup>
const props = defineProps([
  "title",
  "subTitle",
  "size",
  "colorTitle",
  "colorSubtitle",
]);
const title = computed(() => props.title);
const subTitle = computed(() => props.subTitle);
</script>

<style lang="scss" scoped>
.oc-group-view {
  display: flex;
  flex-direction: column;
  grid-gap: 4px;
  align-items: flex-start;

  .oc-title {
    font-size: 13px;
    line-height: 13px;
    font-family: var(--font-400);
    color: var(--color-w-b-1);

    &.m {
      font-size: 15px;
      line-height: 15px;
    }

    &.l {
      font-size: 18px;
      line-height: 18px;
    }
  }

  .oc-sub-title {
    font-size: 11px;
    line-height: 11px;
    font-family: var(--font-400);
    color: var(--color-w-b-3);

    &.m {
      font-size: 13px;
      line-height: 13px;
    }

    &.l {
      font-size: 15px;
      line-height: 15px;
    }
  }
}
</style>
