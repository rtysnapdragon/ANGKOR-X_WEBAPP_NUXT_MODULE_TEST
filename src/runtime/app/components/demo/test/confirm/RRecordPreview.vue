<script setup lang="ts">
export interface RecordPreviewField {
  label: string
  value: string | number | null | undefined
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export interface RecordPreviewStatus {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

interface Props {
  title: string
  subtitle?: string
  image?: string | null
  icon?: string
  status?: RecordPreviewStatus
  fields?: RecordPreviewField[]
  description?: string
  warningTitle?: string
  warningMessage?: string
  showWarning?: boolean
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  image: null,
  icon: 'ri-file-list-3-line',
  fields: () => [],
  description: '',
  warningTitle: 'Permanent deletion',
  warningMessage: 'This record will be permanently deleted. This action cannot be undone.',
  showWarning: true
})
</script>

<template>
  <div class="r-record-preview">

    <!-- Record information -->
    <section class="rrp-card">

      <div class="rrp-heading">
        <i class="ri-file-list-3-line" />
        <span>RECORD PREVIEW</span>
      </div>

      <!-- Main record -->
      <div class="rrp-identity">
        <div class="rrp-avatar">
          <img
            v-if="image"
            :src="image"
            :alt="title"
          />

          <i v-else :class="icon" />
        </div>

        <div class="rrp-identity-content">
          <h4 class="rrp-title">
            {{ title || 'Unnamed record' }}
          </h4>

          <p v-if="subtitle" class="rrp-subtitle">
            {{ subtitle }}
          </p>
        </div>

        <span
          v-if="status"
          class="rrp-status"
          :class="`rrp-status--${status.variant || 'default'}`"
        >
          {{ status.label }}
        </span>
      </div>

      <!-- Custom identity content -->
      <slot name="identity" />

      <!-- Record metadata -->
      <div v-if="fields.length" class="rrp-fields">
        <div
          v-for="(field, index) in fields"
          :key="`${field.label}-${index}`"
          class="rrp-field"
        >
          <span class="rrp-field-label">
            {{ field.label }}
          </span>

          <span
            class="rrp-field-value"
            :class="`rrp-value--${field.variant || 'default'}`"
          >
            {{ field.value ?? '—' }}
          </span>
        </div>
      </div>

      <slot name="details" />
    </section>

    <!-- Optional description -->
    <p v-if="description" class="rrp-description">
      {{ description }}
    </p>

    <!-- Warning -->
    <div v-if="showWarning" class="rrp-warning">
      <i class="ri-alert-line rrp-warning-icon" />

      <div class="rrp-warning-content">
        <strong>{{ warningTitle }}</strong>
        <p>{{ warningMessage }}</p>
      </div>
    </div>

    <slot name="footer" />

  </div>
</template>

<style scoped lang="scss">
.r-record-preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
  color: var(--c-text);
}

.rrp-card {
  overflow: hidden;
  padding: 15px;
  border: 1px solid var(--c-border);
  border-radius: 14px;
  background: var(--c-surface);
}

.rrp-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 16px;
  color: var(--c-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;

  i {
    font-size: 15px;
  }
}

.rrp-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rrp-avatar {
  display: flex;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: var(--c-surface-secondary, var(--c-muted-bg));
  color: var(--c-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  i {
    font-size: 24px;
  }
}

.rrp-identity-content {
  flex: 1;
  min-width: 0;
}

.rrp-title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rrp-subtitle {
  margin-top: 4px;
  color: var(--c-muted);
  font-size: 12px;
}

.rrp-status {
  flex-shrink: 0;
  padding: 4px 9px;
  border-radius: 20px;
  background: var(--c-surface-secondary, var(--c-muted-bg));
  font-size: 11px;
  font-weight: 600;

  &--success {
    background: rgb(34 197 94 / 10%);
    color: #16a34a;
  }

  &--warning {
    background: rgb(234 179 8 / 10%);
    color: #ca8a04;
  }

  &--danger {
    background: rgb(239 68 68 / 10%);
    color: #dc2626;
  }
}

.rrp-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
  margin-top: 17px;
  padding-top: 16px;
  border-top: 1px solid var(--c-border);
}

.rrp-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.rrp-field-label {
  color: var(--c-muted);
  font-size: 11px;
}

.rrp-field-value {
  overflow-wrap: anywhere;
  font-size: 13px;
  font-weight: 600;
}

.rrp-value--success { color: #16a34a; }
.rrp-value--warning { color: #ca8a04; }
.rrp-value--danger { color: #dc2626; }

.rrp-description {
  color: var(--c-muted);
  font-size: 13px;
  line-height: 1.6;
}

.rrp-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px;
  border: 1px solid rgb(239 68 68 / 15%);
  border-radius: 12px;
  background: rgb(239 68 68 / 6%);
}

.rrp-warning-icon {
  flex-shrink: 0;
  color: #ef4444;
  font-size: 19px;
}

.rrp-warning-content {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: #ef4444;
    font-size: 13px;
  }

  p {
    color: var(--c-muted);
    font-size: 12px;
    line-height: 1.5;
  }
}

@media (max-width: 420px) {
  .rrp-identity {
    flex-wrap: wrap;
  }

  .rrp-status {
    margin-left: 64px;
  }

  .rrp-fields {
    gap: 13px 8px;
  }
}
</style>