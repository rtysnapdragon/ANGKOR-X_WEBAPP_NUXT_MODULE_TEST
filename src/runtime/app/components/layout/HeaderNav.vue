
<template>
  <header class="header-nav">
    <nav class="header-nav__container">
      <!-- Logo -->
      <div v-if="$slots.logo" class="header-nav__logo">
        <slot name="logo" />
      </div>

      <!-- Left -->
      <div class="header-nav__left">
        <slot name="left" />
      </div>

      <!-- Center -->
      <div class="header-nav__center">
        <slot name="center" />
      </div>

      <!-- Right -->
      <div class="header-nav__right">
        <slot name="right" />
      </div>
    </nav>
  </header>
</template>

<script setup>

</script>

<style lang="scss" scoped>
.header-nav {
  --sidebar-width: 256px;
  width: calc(100% - var(--sidebar-width));

  width: 100%;
  height: 64px;

  background: var(--c-border, #fff);
  border-bottom: 1px solid var(--ui-border, #e5e7eb);

  &__container {
    display: flex;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    height: 100%;
    padding: 0 24px;
    // gap: 16px;
    row-gap: 50%;
  }

  &__logo,
  &__left,
  &__center,
  &__right {
    display: flex;
    align-items: center;
  }

  &__left {
    flex: 1;
    min-width: 0;
    gap: 12px;
  }

  &__right {
    flex-shrink: 0;
  }
}

// Mobile
@media (max-width: 1023px) {
  .header-nav {
    left: 0;
    width: 100%;

    &__container {
      padding: 0 16px;
    }
  }
}
</style>
