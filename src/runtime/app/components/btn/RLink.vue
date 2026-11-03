<script setup>
defineProps({to:{ type: String, default: ''}})
</script>

<template>
  <NuxtLink :to="localePath(to)" class="app-link"><slot /></NuxtLink>
  <ULink :to="to" />
</template>
