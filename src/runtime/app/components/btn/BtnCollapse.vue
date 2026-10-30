<template>
  <div>
    <img :src="mode.isDark ? '/img/imgCollap/dark_to_small.svg' : '/img/imgCollap/light_to_small.svg'"class="rty-btn-img-collapse" v-if="props?.toSmall == ''">
    <img :src="mode.isDark ? '/img/imgCollap/dark_to_large.svg' : '/img/imgCollap/light_to_large.svg'"class="rty-btn-img-collapse" v-else>
  </div>
</template>

<script setup>
const mode = useModeStore()
const props = defineProps(['toSmall'])
</script>

<style lang="scss">
.rty-btn-img-collapse{
    min-height: 15px !important;
    min-width: 15px !important;
    height: 15px !important;
    width: 15px !important;
    cursor: pointer !important;
}
</style>