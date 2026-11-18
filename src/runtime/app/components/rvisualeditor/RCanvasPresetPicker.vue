<template>
  <div class="rpp-picker">
    <span
      v-if="label"
      class="rpp-picker__label"
    >
      {{ label }}
    </span>

    <RPopoverPanel
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :disabled="disabled"
      :title="title"
      :show-close="showClose"
      :panel-class="panelClass"
      size="lg"
      scrollable
      no-padding
    >
      <template #default="{ open }">
        <button
          type="button"
          class="rpp-picker__trigger"
          :class="{ 'is-open': open }"
          :disabled="disabled"
          aria-haspopup="listbox"
          :aria-expanded="open"
        >
          <span
            class="rpp-picker__preview"
            aria-hidden="true"
          >
            <span
              class="rpp-picker__preview-inner"
              :style="currentPreviewStyle"
            />
          </span>

          <span class="rpp-picker__value">
            <span class="rpp-picker__value-label">
              {{ current ? current.label : placeholder }}
            </span>
            <span
              v-if="current"
              class="rpp-picker__value-size"
            >
              {{ current.sizeLabel }}
            </span>
          </span>

          <RIcon
            name="i-lucide-chevron-down"
            class="rpp-picker__chevron"
            :class="{ 'is-open': open }"
          />
        </button>
      </template>

      <template #body="{ close }">
        <div
          class="rpp-picker__body"
          role="listbox"
          :aria-label="title"
        >
          <div
            v-for="group in groups"
            :key="group.id"
            class="rpp-picker__group"
          >
            <div class="rpp-picker__group-title">
              {{ group.label }}
            </div>

            <div class="rpp-picker__grid">
              <button
                v-for="preset in group.presets"
                :key="preset.id"
                type="button"
                class="rpp-picker__item"
                :class="{ 'is-active': preset.id === model }"
                role="option"
                :aria-selected="preset.id === model"
                @click="selectPreset(preset, close)"
              >
                <span
                  class="rpp-picker__item-preview"
                  aria-hidden="true"
                >
                  <span
                    class="rpp-picker__item-shape"
                    :style="itemPreviewStyle(preset)"
                  />
                </span>

                <span class="rpp-picker__item-text">
                  <span class="rpp-picker__item-label">{{ preset.label }}</span>
                  <span class="rpp-picker__item-size">{{ preset.sizeLabel }}</span>
                </span>

                <RIcon
                  v-if="preset.id === model"
                  name="i-lucide-check"
                  class="rpp-picker__item-check"
                />
              </button>
            </div>
          </div>

          <p
            v-if="!groups.length"
            class="rpp-picker__empty"
          >
            {{ emptyLabel }}
          </p>
        </div>
      </template>
    </RPopoverPanel>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import RIcon from '../RIcon.vue'
import RPopoverPanel from '../ui/RPopoverPanel.vue'

const props = defineProps({
  groups: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Choose a preset' },
  emptyLabel: { type: String, default: 'No presets available' },
  title: { type: String, default: 'Presets' },
  disabled: { type: Boolean, default: false },
  side: { type: String, default: 'bottom' },
  align: { type: String, default: 'end' },
  sideOffset: { type: Number, default: 6 },
  showClose: { type: Boolean, default: true },
  panelClass: { type: [String, Array, Object], default: '' },
})

const emit = defineEmits(['select'])
const model = defineModel({ type: String, default: '' })

const current = computed(() => {
  if (!model.value) return null
  for (const group of props.groups) {
    const found = group.presets?.find(preset => preset.id === model.value)
    if (found) return found
  }
  return null
})

function previewStyle(preset, maxWidth, maxHeight) {
  const width = Number(preset?.w) || 1
  const height = Number(preset?.h) || 1
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: `${Math.max(7, Math.round(width * scale))}px`,
    height: `${Math.max(7, Math.round(height * scale))}px`,
  }
}

const currentPreviewStyle = computed(() => previewStyle(current.value, 26, 20))
const itemPreviewStyle = preset => previewStyle(preset, 24, 18)

function selectPreset(preset, close) {
  if (props.disabled || !preset) return
  model.value = preset.id
  emit('select', preset)
  close?.()
}
</script>

<style lang="scss" scoped>
.rpp-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: var(--c-muted, #6b7280);
  }

  &__trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 7px 10px;
    border: 1px solid var(--c-border, #e5e7eb);
    border-radius: 10px;
    background: var(--c-surface, #ffffff);
    color: var(--c-text, #1f2937);
    font: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 150ms var(--ease-out, ease),
      background 150ms var(--ease-out, ease),
      box-shadow 150ms var(--ease-out, ease);

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--c-accent, #8c52ff) 45%, var(--c-border, #e5e7eb));
      background: color-mix(in srgb, var(--c-accent, #8c52ff) 4%, var(--c-surface, #ffffff));
    }

    &.is-open {
      border-color: var(--c-accent, #8c52ff);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent, #8c52ff) 16%, transparent);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid var(--c-accent, #8c52ff);
      outline-offset: 2px;
    }
  }

  &__preview {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 34px;
    height: 28px;
    border: 1px solid var(--c-border, #e5e7eb);
    border-radius: 6px;
    background: color-mix(in srgb, var(--c-text, #1f2937) 4%, transparent);
  }

  &__preview-inner {
    display: block;
    border-radius: 2px;
    background: color-mix(in srgb, var(--c-accent, #8c52ff) 72%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-accent, #8c52ff) 36%, transparent);
  }

  &__value {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__value-label {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__value-size {
    overflow: hidden;
    color: var(--c-muted, #6b7280);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__chevron {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: var(--c-muted, #6b7280);
    transition: transform 150ms var(--ease-out, ease);

    &.is-open {
      transform: rotate(180deg);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 12px;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__group-title {
    position: sticky;
    top: 0;
    z-index: 2;
    margin: 0 -12px;
    padding: 6px 14px;
    background: var(--c-surface, #ffffff);
    color: var(--c-muted, #6b7280);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 7px 8px;
    border: 1px solid var(--c-border, #e5e7eb);
    border-radius: 9px;
    background: var(--c-surface, #ffffff);
    color: var(--c-text, #1f2937);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 140ms var(--ease-out, ease),
      background 140ms var(--ease-out, ease),
      box-shadow 140ms var(--ease-out, ease);

    &:hover {
      border-color: color-mix(in srgb, var(--c-accent, #8c52ff) 45%, var(--c-border, #e5e7eb));
      background: color-mix(in srgb, var(--c-accent, #8c52ff) 5%, var(--c-surface, #ffffff));
    }

    &.is-active {
      border-color: var(--c-accent, #8c52ff);
      background: color-mix(in srgb, var(--c-accent, #8c52ff) 10%, var(--c-surface, #ffffff));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-accent, #8c52ff) 40%, transparent);
    }

    &:focus-visible {
      outline: 2px solid var(--c-accent, #8c52ff);
      outline-offset: 2px;
    }
  }

  &__item-preview {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 30px;
    height: 24px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--c-text, #1f2937) 4%, transparent);
  }

  &__item-shape {
    display: block;
    border-radius: 2px;
    background: color-mix(in srgb, var(--c-text, #1f2937) 24%, transparent);
    transition: background 140ms var(--ease-out, ease);
  }

  &__item.is-active &__item-shape {
    background: var(--c-accent, #8c52ff);
  }

  &__item-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__item-label {
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-size {
    overflow: hidden;
    color: var(--c-muted, #6b7280);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-check {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    color: var(--c-accent, #8c52ff);
  }

  &__empty {
    padding: 18px 12px;
    color: var(--c-muted, #6b7280);
    font-size: 12px;
    text-align: center;
  }
}
</style>
