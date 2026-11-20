<template>
  <div v-if="kind === 'user'" class="du-user">
    <span class="du-avatar" :style="{ background: `hsl(${(row.id * 47) % 360} 55% 42%)` }" aria-hidden="true">
      {{ initials }}
    </span>
    <div>
      <div class="du-name">{{ row.name }}</div>
      <div class="du-sub">{{ row.role }}</div>
    </div>
  </div>

  <div v-else-if="kind === 'contact'">
    <div>{{ row.email }}</div>
    <div class="du-sub">{{ row.phone }}</div>
  </div>

  <span v-else class="du-badge" :class="`is-${row.status.toLowerCase()}`">{{ row.status }}</span>
</template>

<script setup lang="ts">
import type { DemoUser } from './demo-users'

const props = defineProps<{
  kind: 'user' | 'contact' | 'status'
  row: DemoUser
}>()

const initials = computed(() =>
  props.row.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2),
)
</script>

<style lang="scss">
.du-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.du-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.du-name {
  font-weight: 600;
}

.du-sub {
  font-size: 12px;
  color: var(--color-w-b-2);
}

.du-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.is-active {
    background: #16a34a22;
    color: #15803d;
  }

  &.is-away {
    background: #f59e0b22;
    color: #b45309;
  }

  &.is-suspended {
    background: #dc262622;
    color: #b91c1c;
  }
}
</style>
