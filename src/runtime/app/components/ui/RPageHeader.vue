<!-- components/global/PageHeader.vue -->

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
}>();
</script>

<template>
  <div class="page-header">
    <div class="page-header__left">
      <!-- Icon -->
      <div v-if="icon" class="page-header__icon-wrap">
        <UIcon :name="icon" class="page-header__icon" />
      </div>
      <!-- Content -->
      <div class="page-header__content">
        <!-- Breadcrumb -->
        <!-- Title -->
        <h1 v-if="title" class="page-header__title">{{ title }}</h1>
        <!-- Subtitle -->
        <p v-if="subtitle" class="page-header__sub">{{ subtitle }}</p>
        <p v-if="description" class="page-header__description sub-text">
          {{ description }}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1; // ← important
  min-width: 0;
}

.page-header__actions {
  margin-left: auto; // ← important
  flex-shrink: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  &__content {
    min-width: 0;
    flex: 1;
  }

  &__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    flex-shrink: 0;
    background: var(--color-item-active-bg);
    @media (max-width: 768px) {
      width: 38px;
      height: 38px;
    }
  }

  &__icon {
    width: 22px;
    height: 22px;
    color: var(--color-accent);
    @media (max-width: 768px) {
      width: 18px;
      height: 18px;
    }
  }

  &__title {
    font-family: var(--font-400, var(--font-fallback));
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--color-text-primary);
    @media (max-width: 768px) {
      font-size: 1.2rem;
    }
  }

  &__sub {
    margin-top: 2px;
    font-size: 0.85rem;
    color: var(--sub-text);
    @media (max-width: 768px) {
      font-size: 0.78rem;
    }
  }

  &__actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}
</style>

<!-- Example PageHeader -->

<!-- <PageHeader
  title="Users"
  subtitle="Manage users"
  icon="i-lucide-users"
>
  <template #actions>

    <UButton
      label="Add User"
      icon="i-lucide-plus"
    />

    <UButton
      label="Export"
      color="neutral"
      variant="soft"
      icon="i-lucide-download"
    />

  </template>
</PageHeader> -->
