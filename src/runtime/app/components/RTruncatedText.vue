<template>
    <RTooltip :text="text" class="w-full" :content="{ side: side, sideOffset: sideOffset, align:align }">
        <div class="r-text text r-truncate w-full" :style="{ '--lines': lines }" :class="props.class" @click="expand(text)">
            {{ $t(`${text}`) }}
        </div>
    </RTooltip>
</template>

<script setup>
const props = defineProps(['text', 'class','lines','side','sideOffset','align']);
const text = computed(() => props.text)
const lines = computed(() => props.lines ?? 1)
const side = computed(() => props.side ?? 'top')
const sideOffset = computed(() => props.sideOffset ?? 4)
const align = computed(() => props.align ?? 'center')
const emit = defineEmits(['click', 'expand'])
const expand = (txt) => {
    emit('expand', txt)
}
</script>

<style lang="scss" scoped>
// .text {

// }
// .r-truncate {
//   display: -webkit-box;
//   -webkit-box-orient: vertical;
//   -webkit-line-clamp: var(--lines);
//   overflow: hidden;
//   word-break: break-word;
// }

// If you want a standard one-line ellipsis:
.r-truncate {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: var(--lines,2) !important;
  -webkit-box-orient: vertical;
  white-space: nowrap;
  min-width: 0;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}
// .r-table-clamp {
//   display: -webkit-box;
//   -webkit-line-clamp: var(--clamp-lines, 2);

//   overflow: hidden;
//   text-overflow: ellipsis;
//   white-space: normal;
//   word-break: break-word;
// }

// .truncate {
//   overflow: hidden;
//   text-overflow: ellipsis;
//   display: -webkit-box;
//   -webkit-line-clamp: 1;
//   -webkit-box-orient: vertical;
// }
</style>
