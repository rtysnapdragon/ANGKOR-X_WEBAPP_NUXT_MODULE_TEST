<template>
  <div class="playground">
    <div class="content">
      <h1>Nuxt Module Playground</h1>
      <p>
        Preview and test your Nuxt module in a realistic browser environment.
      </p>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Nuxt Module Playground',
  meta: [
    {
      name: 'description',
      content:
        'Preview and test your Nuxt module in a realistic browser environment.'
    }
  ]
})
</script>

<style scoped>
.playground {
  position: fixed;
  inset: 0;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #0f172a;
  color: #f8fafc;
  text-align: center;
}

.content {
  padding: 24px;
}

h1 {
  margin: 0 0 12px;
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

p {
  margin: 0;
  font-size: 1.125rem;
  color: #94a3b8;
}
</style>