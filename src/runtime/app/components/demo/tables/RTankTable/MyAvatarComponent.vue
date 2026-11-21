
<template>
  <div class="my-avatar">
    <div class="my-avatar__image">
      <img
        v-if="user?.AvatarUrl && !imageError"
        :src="user.AvatarUrl"
        :alt="user?.Name || 'Avatar'"
        @error="imageError = true"
      />

      <span v-else>
        {{ initials }}
      </span>
    </div>

    <div class="my-avatar__info">
      <strong>{{ user?.Name || '-' }}</strong>
      <span>{{ user?.Username || user?.Email || '-' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({})
  }
})

const imageError = ref(false)

watch(
  () => props.user?.AvatarUrl,
  () => {
    imageError.value = false
  }
)

const initials = computed(() => {
  const name = props.user?.Name?.trim() || ''
  return name ? name.charAt(0).toUpperCase() : '?'
})
</script>

<style scoped lang="scss">
.my-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  &__image {
    display: grid;
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    overflow: hidden;
    place-items: center;
    border-radius: 50%;
    background: var(--bg-tertiary);
    color: var(--c-text);
    font-weight: 700;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;

    strong {
      overflow: hidden;
      color: var(--c-text);
      font-size: 13px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      overflow: hidden;
      color: var(--c-muted);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
