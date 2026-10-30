<script setup lang="ts">
import { computed } from 'vue'

type SwitchMode =
  | 'default'
  | 'icon'
  | 'text'
  | 'icon-text'

type SwitchSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'

interface Props {
  modelValue?: boolean

  disabled?: boolean
  readonly?: boolean
  loading?: boolean

  id?: string
  name?: string

  size?: SwitchSize
  mode?: SwitchMode

  checkedIcon?: string
  uncheckedIcon?: string

  checkedText?: string
  uncheckedText?: string

  activeColor?: string
  inactiveColor?: string
}

const props = withDefaults(
  defineProps<Props>(),
  {
    modelValue: false,

    disabled: false,
    readonly: false,
    loading: false,

    size: 'md',
    mode: 'default',

    activeColor: 'var(--color-green)',
    inactiveColor: 'var(--color-w-b-6)',

    checkedIcon: 'ri-check-line',
    uncheckedIcon: 'ri-close-line',

    checkedText: 'ON',
    uncheckedText: 'OFF'
  }
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  change: [boolean]
}>()

function toggle() {
  if (
    props.disabled ||
    props.readonly ||
    props.loading
  ) return

  const value = !props.modelValue

  emit('update:modelValue', value)
  emit('change', value)
}

const sizes = computed(() => {
  switch (props.size) {
    case 'xs':
      return {
        track: '32px',
        height: '18px',
        thumb: '14px',
        move: '14px'
      }

    case 'sm':
      return {
        track: '36px',
        height: '20px',
        thumb: '16px',
        move: '16px'
      }

    case 'lg':
      return {
        track: '52px',
        height: '28px',
        thumb: '24px',
        move: '24px'
      }

    default:
      return {
        track: '42px',
        height: '24px',
        thumb: '20px',
        move: '18px'
      }
  }
})
</script>

<template>
  <button
    :id="id"
    :name="name"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="r-switch"
    :class="{
      'r-switch--checked': modelValue,
      'r-switch--disabled': disabled
    }"
    :style="{
      '--switch-width': sizes.track,
      '--switch-height': sizes.height,
      '--thumb-size': sizes.thumb,
      '--thumb-move': sizes.move,
      '--switch-active': activeColor,
      '--switch-inactive': inactiveColor
    }"
    @click="toggle"
  >
    <span
      class="r-switch__thumb"
      :class="{
        'r-switch__thumb--checked': modelValue
      }"
    >
      <template v-if="loading">
        <i class="ri-loader-4-line animate-spin" />
      </template>

      <template v-else-if="mode === 'icon'">
        <i
          :class="
            modelValue
              ? checkedIcon
              : uncheckedIcon
          "
        />
      </template>

      <template v-else-if="mode === 'text'">
        <span class="r-switch__text">
          {{
            modelValue
              ? checkedText
              : uncheckedText
          }}
        </span>
      </template>

      <template v-else-if="mode === 'icon-text'">
        <div class="r-switch__content">
          <i
            :class="
              modelValue
                ? checkedIcon
                : uncheckedIcon
            "
          />
          <span>
            {{
              modelValue
                ? checkedText
                : uncheckedText
            }}
          </span>
        </div>
      </template>

      <slot
        name="thumb"
        :checked="modelValue"
      />
    </span>
  </button>
</template>

<style scoped>
.r-switch {
  position: relative;

  width: var(--switch-width);
  height: var(--switch-height);

  border-radius: 9999px;

  background: var(--switch-inactive);

  transition: .25s;

  cursor: pointer;
}

.r-switch--checked {
  background: var(--switch-active);
}

.r-switch--disabled {
  opacity: .5;
  cursor: not-allowed;
}

.r-switch__thumb {
  position: absolute;

  left: 2px;
  top: 50%;

  transform: translateY(-50%);

  width: var(--thumb-size);
  height: var(--thumb-size);

  border-radius: 9999px;

  background: white;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: .25s;

  box-shadow:
    0 1px 3px rgba(0,0,0,.2);
}

.r-switch__thumb--checked {
  transform:
    translateY(-50%)
    translateX(var(--thumb-move));
}

.r-switch__text {
  font-size: 9px;
  font-weight: 600;
}

.r-switch__content {
  display: flex;
  align-items: center;
  gap: 2px;

  font-size: 9px;
}
</style>