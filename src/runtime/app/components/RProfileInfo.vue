<template>
  <div class="oc-profile-info">
    <RAvatar
      :size="size"
      :round="round"
      :border="border"
      :borderColor="gender"
      :errorType="errorType"
      :src="src"
    />
    <RViewInfo :title="title" :subTitle="subTitle" :size="size">
      <template v-if="$slots.title" #title>
        <slot name="title"></slot>
      </template>
      <template v-if="$slots.subTitle" #subTitle>
        <slot name="subTitle"></slot>
      </template>
    </RViewInfo>
  </div>
</template>

<script setup>
import { computed } from "vue";
import RViewInfo from './RViewInfo.vue'
import RAvatar from './RAvatar.vue'
const props = defineProps([
  "src",
  "gender",
  "title",
  "subTitle",
  "size",
  "round",
  "border",
  "errorType",
]);
const title = computed(() => props.title);
const subTitle = computed(() => props.subTitle);
const src = computed(() => props.src);
const gender = computed(() => props.gender?.toLowerCase());
const size = computed(() => props.size ?? "s");
const round = computed(() => props.round ?? "l");
const border = computed(() => props.border ?? "m");
const errorType = computed(() => props.errorType ?? "user");
</script>

<style scoped>
.oc-profile-info {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
