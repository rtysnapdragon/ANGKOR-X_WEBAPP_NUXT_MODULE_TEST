<template>
  <div
    class="input-group"
    :class="{
      focused: isFocused || modelValue,
      error: error,
      disabled: disabled
    }"
  >
    <!-- Overlay Label / Error -->
    <label>
      {{ label }}
    </label>
    <!-- hide placeholder when input has value -->
    <div class="input-wrapper" :class="{ error:'!!erroror'}">
      <input
        :type="type"
        :value="modelValue"
        :placeholder="(isFocused || modelValue) ? '' : placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <!-- 🔥 Trailing slot -->
      <div v-if="$slots.trailing" class="trailing">
        <slot name="trailing" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  modelValue: String,
  type: { type: String, default: 'text' },
  error: String,
  disabled: { type: Boolean, default: false }, // ✅ NEW
  placeholder: { type: String, default: '' } // ✅ NEW
})

defineEmits(['update:modelValue'])

const isFocused = ref(false)
</script>

<style scoped lang="scss">
$rama-ink: var(--color-bg) !important;
.input-group {
  position: relative;
  // margin-bottom: 22px;

  .input-wrapper {
    // position: relative;
    display: flex;
    align-items: center;
    .trailing {
      position: absolute;
      right: 12px;
      display: flex;
      justify-self: unset;
      align-items: center;
    }
  }

  input {
    width: 100%;
    padding: 10px 14px !important;
    font-size: 15px;
    background-color: transparent !important; // no background
    border: 1px solid var(--border-color) !important;
    border-radius: 14px !important;
    color: var(--text);
    outline: none;
    transition: border 0.50s ease;;
  }

  label {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: $rama-ink;
    padding: 0 6px;
    font-size: 14px;
    color: var(--general-text-color) !important;
    pointer-events: none;
    transition: all 0.50s ease;
    color: var(--color-text-primary);
  }

  &.focused label {
    top: 0;
    font-size: 13px;
    color: var(--color-text-primary);
  }

  /* ✅ Hover only */
  &:hover:not(.error) {
    label {
      color: var(--primary-color);
    }

    input {
      border-color: var(--primary-color);
    }
  }

  // /* ❌ Focus should not change color */
  // &.focused input {
  //   border-color: var(--border);
  // }
  
 /* ✅ ACTIVE / FOCUS ONLY */
  &.focused:not(.error):not(.disabled) {
    label {
      color: var(--primary-color);
    }

    input {
      border-color: green !important;
      padding-block: 10px !important;
          // Equivalent to your text-gradient class.
      border:1px solid linear-gradient(
        90deg,
        #c9a96e,
        #f1dca7,
        #c9a96e
      );

      -webkit-background-clip: text;
      background-clip: text;
      color: var(--text);
      background-color: transparent !important; // no background
    }
  }
 /* ❌ Hover does NOTHING */
  &:hover {
    label {
      color: var(--muted);
    }

    input {
      border-color: var(--border);
    }
  }
  // &.focused input {
  //   // border-color: var(--primary-color);
  // }

    /* Disabled */
  &.disabled {
    input {
      opacity: 0.6;
      cursor: not-allowed;
    }

    label {
      color: var(--muted);
    }
  }
  
  /* Error overrides everything */
  &.error {
    input {
      border-color: #ff4d4f;
    }

    label {
      color: #ff4d4f;
    }
  }
}

.error{
  border-color: #f87171;
  input{
    border-color: #f87171;
    color: #f87171;
  }
  label{
    color: #f87171;
  }
}
</style>
