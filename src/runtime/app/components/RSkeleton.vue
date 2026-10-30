<template>
    <USkeleton :ui="ui" :class="newClass" :style="inlineStyle" />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    ui: Object,
    outContent: Boolean,
    class: String,
    width: [String, Number],
    height: [String, Number],
})
const newClass = computed(() => props.class)

const toSize = (val) => (val === undefined || val === null || val === '') ? undefined : (typeof val === 'number' ? `${val}px` : val)

const inlineStyle = computed(() => {
    const style = {}
    if (props.width !== undefined) style.width = toSize(props.width)
    if (props.height !== undefined) style.height = toSize(props.height)
    return style
})

const ui = computed(() => {
    const defaultUI = {
        base: 'ui-rskeleton-base animate-pulse rounded-md bg-elevated',
        background: `${isNotEmpty(props.outContent) ? 'out-content-color' : 'in-content-color'}`,
        rounded: 'rounded-md',
    }

    return { ...defaultUI, ...props.ui }
})
</script>

<style lang="scss">
.ui-rskeleton-base {
    background-color: var(--bg-wrapper);
}

.in-content-color {
    background-color: var(--bg-wrapper);
}

.out-content-color {
    background-color: var(--bg-content);
}

.dark {
    .in-content-color {
        background-color: var(--bg-wrapper);
    }

    .out-content-color {
        background-color: var(--bg-content);
    }
}
</style>