<template>
  <RPopover :use="use" :placement="placement" class="flex items-center"
    v-if="items.length > 1 || props.isNotDefaultOne">
    <template #trigger>
      <RAvatar :src="items?.map(e => e[path])" :background="background" :max-src="3" :size="props.size"
        class="cursor-pointer" />
    </template>

    <div class="grid items-center gap-3">
      <div class="font-bold text-sm color-w-b-1">
        {{ title }}
      </div>
      <div class="group-image-detail have-scroll">
        <RProfileInfo v-for="item, i in items" :title="tBy({ en: item[englishName], km: item[name], })"
          :src="item[path]" :sub-title="item[code]" :gender="item[gender]?.toLowerCase()" />
      </div>
    </div>
  </RPopover>

  <RProfileInfo v-for="item, i in items" :title="tBy({ en: item[englishName], km: item[name], })" :src="item[path]"
    :sub-title="item[code]" :gender="item[gender]?.toLowerCase()" v-else />
</template>

<script setup>
const defaultImg = UseDefaultImagStore();
const props = defineProps(['items', 'path', 'title', 'placement', 'use', 'name', 'englishName', 'code', 'maxSrc', 'gender', 'background', 'size', "isNotDefaultOne"])
const items = computed(() => props.items)
const path = computed(() => props.path)
const placement = computed(() => {
  if (props.use == "flowbite" && !isNotEmpty(props.placement)) {
    return 'bottom'
  } else if (isNotEmpty(props.placement)) {
    return props.placement
  } else if (!isNotEmpty(props.placement)) {
    return 'bottom-start'
  }
})
const use = computed(() => props.use ?? 'nuxtui')
const title = computed(() => props.title)
const name = computed(() => props.name ?? 'Name')
const englishName = computed(() => props.englishName ?? 'EnglishName')
const code = computed(() => props.code ?? 'Code')
const maxSrc = computed(() => props.maxSrc ?? 3)
const gender = computed(() => props.gender ?? 'Gender')
const background = computed(() => props.background ?? 'content')

mounted(() => {

})
</script>

<style lang="scss">
.group-image-container {
  &.margin-left {
    margin-left: -16px;
  }

  position: relative;
  width: 35px;
  height: 35px;
  border-radius: 100%;
  padding: 2.5px;
  background-color: var(--bg-content);

  .group-image-more {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    border-radius: 100%;
    border: 2px solid var(--bg-content);
    background-color: #00000033;
    display: grid;
    justify-content: center;
    align-items: center;
  }
}

.group-image-detail {
  // overflow-y-auto max-h-36
  display: grid;
  align-items: center;
  gap: 10px;

  &.have-scroll {
    overflow-y: auto;
    overflow-x: unset;
    max-height: 195px;
  }
}
</style>
