<template>
    <div class="rty-content dynamic-height" :class="`${color} ${newClass}`"
        :style="{ '--dynamic-height': props.height + 'px' }">
        <div class="rty-header" v-if="$slots['header']">
            <slot name="header"></slot>
        </div>
        <slot></slot>
    </div>
</template>

<script setup>
const props = defineProps(['class', 'color', 'height'])
const newClass = computed(() => props.class)
const color = computed(() => props.color == 'wrapper' ? 'color-bg-wrapper' : 'color-bg-content')
</script>

<style lang="scss" scoped>
.dynamic-height {
    height: var(--dynamic-height) !important;
}

.rty-content {
    padding: 20px;
    background:    var(--c-surface) !important;
    border-radius: var(--radius-lg,20px);
    display: flex;
    flex-direction: column;
    grid-gap: 12px;
    height: fit-content;

    .rty-header {
        font-size: 14px;
        font-family: var(--font-500) !important;
        color: var(--color-w-b-1);
    }
}
</style>




<!-- 
<script setup lang="ts">

</script>

<template>
  <div class="r-content">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.r-content {
  background:    var(--c-surface) !important;
  border-radius: var(--radius-lg);
  overflow:      hidden;
  padding:15px !important;
  min-height: calc(100dvh - 350px) ;
}
</style> -->
