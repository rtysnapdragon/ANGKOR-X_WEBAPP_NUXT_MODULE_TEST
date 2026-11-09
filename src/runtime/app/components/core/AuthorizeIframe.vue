<template>
  <iframe
    id="SETATHORIZECOOKIE"
    :src="iframeUrl"
    style="display: none"
    title="Authentication"
  />
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const iframeUrl = `${config.public.apiBase}/auth/authorize-iframe`;
</script>