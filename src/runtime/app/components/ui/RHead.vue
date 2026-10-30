<template>

  <Head>
    <Title>{{ title }} | {{ config.appName }}</Title>
    <Meta property="og:title" :content="`${title} ${config.appName}`" />
    <Meta name="twitter:title" :content="`${title} ${config.appName}`" />
    <Meta v-if="keyword" name="keyword" :content="keyword" />

    <Meta v-if="description" property="description" :content="description" />
    <Meta v-if="description" property="og:description" :content="description" />
    <Meta v-if="description" name="twitter:description" :content="description" />

    <Meta v-if="img" property="og:image" :content="img" />
    <Meta v-if="img" name="twitter:image" :content="img" />

    <Meta v-if="icon" property="icon" :content="icon" />
    <Meta property="lang" :content="i18n.locale" />
    <Meta v-if="url" name="og:url" :content="url" />
    <Meta name="twitter:card" content="summary_large_image" />
    <slot />
  </Head>
</template>

<script setup>
const { config } = helper();
const i18n = useI18n();
const props = defineProps(['img', 'title', 'description', 'url', 'icon', 'keyword']);
</script>
