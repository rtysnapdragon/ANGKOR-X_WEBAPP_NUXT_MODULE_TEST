
<template>
  <div class="my-card">
    <div class="my-card__header">
      <div class="my-card__avatar">
        {{ user?.Name?.charAt(0) || '?' }}
      </div>

      <div class="my-card__info">
        <strong>{{ user?.Name || '-' }}</strong>
        <span>{{ user?.Email || '-' }}</span>
      </div>
    </div>

    <div class="my-card__body">
      <div class="my-card__item">
        <span>ID</span>
        <strong>{{ user?.Id ?? '-' }}</strong>
      </div>

      <div class="my-card__item">
        <span>Status</span>
        <span
          class="my-card__status"
          :class="Number(user?.Status) === 1 ? 'active' : 'inactive'"
        >
          {{ Number(user?.Status) === 1 ? 'Active' : 'Inactive' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped lang="scss">
.my-card {
  padding: 12px;
  border: 1px solid var(--c-border);
  border-radius: 10px;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    display: grid;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    place-items: center;
    border-radius: 50%;
    background: var(--c-accent);
    color: white;
    font-weight: 600;
  }

  &__info {
    display: flex;
    min-width: 0;
    flex-direction: column;

    strong {
      font-size: 14px;
    }

    span {
      color: var(--c-muted);
      font-size: 12px;
    }
  }

  &__body {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--c-border);
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }

  &__status {
    &.active {
      color: var(--c-success);
    }

    &.inactive {
      color: var(--c-muted);
    }
  }
}
</style>
