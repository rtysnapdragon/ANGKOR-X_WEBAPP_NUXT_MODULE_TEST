<template>
    <header>
        <nav :class="`fixed w-full ${background ?? ''}`">
            <div class="relative flex items-center justify-between">

                <div class="flex items-center justify-center">
                    <slot name="left"> </slot>
                </div>

                <div class="flex items-center justify-center">
                    <slot name="center"> </slot>
                </div>

                <div class="flex items-center justify-center">
                    <slot name="right"> </slot>
                </div>
            </div>
        </nav>
    </header>
</template>

<script setup>
const props = defineProps(['background'])
</script>

<style lang="scss" scoped></style>