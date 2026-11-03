<template>
  <div v-if="type=='pininput'">
    <UPinInput v-model="value" :length="length" :type="typePinInput" :mask="mask" :size="size" :disabled="disabled" :otp="totp" :placeholder="placeholderPinInput" :separator="separator" :color="color" :highlight="highlight" :error="error" :variant="variant" :ui="pinDefaultInputUI">
      <template #separator v-if="$slots.separator">
        <UIcon name="i-lucide-minus" class="size-4" />
      </template>
    </UPinInput>
  </div>

  <!-- default -->
  <div v-else class="input-wrapper">
    <UInput ref="refOCInput" v-model="value" v-model.nullable="value" :size="props.size ?? 'md text-[12px]'" :name="props.name" :ui="ui" :type="type" :color="color" :highlight="highlight" :error="error"
      :placeholder="placeholder" :loading="loading" :leading="leading" :loading-icon="loadingIcon" :trailing="trailing"
      :padded="padded" :icon="icon" :autofocus="autofocus" :autofocus-delay="autofocusDelay" :autocomplete="autocomplete"
      :leading-icon="leadingIcon" :trailing-icon="trailingIcon" :disabled="disabled" class="w-full"
      :inputClass="score ? 'ocs-input-score' : 'ocs-input'" @focus="(v) => emits('onFocus', v)"
      @blur="(v) => emits('onBlur', v)" @input="(v) => emits('onInput', v)" :min="min" :max="max">
      <!-- :inputClass="score ? 'ocs-input-score' : 'ocs-input'" @focus="(v) => emits('onFocus', v)" -->
      <template #leading v-if="$slots.leading">
        <div class="leading-side right-[10px]">
          <slot name="leading" />
        </div>
      </template>

      <template #trailing v-if="$slots.trailing">
        <slot name="trailing" />
        <!-- <div class="trailing-side right-[10px]"> </div> -->
      </template>

      <!-- <template #trailing v-if="!$slots.trailing">
        <slot v-if="value?.length > 0" name="trailing" class="right-[10px]" />
      </template> -->

      <label v-if="floatingLabel" class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal">
        <span class="inline-flex bg-default px-1">{{ floatingLabel }}</span>
      </label>
    </UInput>
    <!-- <RBtn v-if="ai" :ui="{ icon: '!inline-flex !h-[16px] !w-[16px]' }" :label="aiLabel" :trailing-icon="mdiBrainCircuit" icon="ri-sparkling-line"/> -->
  </div>
</template>
<!-- <script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const value = ref('npx nuxt module add ui')

const { copy, copied } = useClipboard()
// @click="copy(value)"
</script> -->

<script setup>
const refOCInput = ref();
const value = defineModel();
const props = defineProps([
  "size", // xs, sm, md, lg,xl
  "name",
  "type", //file/search/text/password/number/textarea/checkbox/radio/switch/select/time/date
  "ui",
  "icon",
  'highlight', // for highlight border color -> true or false
  'error', // for error border color -> true or false
  'variant', // outline, solft, subtle, ghost, link,none -> solid or outline -> border color
  "placeholder",
  "autofocus",
  "autofocusDelay",
  "loading",
  "leading",
  "trailing",
  "loadingIcon",
  "leadingIcon",
  "trailingIcon",
  "autocomplete",
  "disabled",
  "min",
  "max",
  "score",
  "isRight",
  "isLeft",
  "floatingLabel",
  'avatar', //{ src: String, loading: 'eager' | 'lazy', error: false,alt:String}
  'color', // primary,secondary,success,info,warning,error,neutral,danger -> border color

  // for UPinInput
  'pininput', // pininput -= type : text & number only
  'mask', // mask for UPinInput -> array of number 
  'totp', // totp for UPinInput -> true or false
  'placeholderPinInput', // placeholder for UPinInput
  'length', // length for UPinInput
  'separator', //:separator="[3, 4]"
  'pinInputUI', // ui for UPinInput
  'typePinInput', // type for UPinInput -> text & number only

  // for AI Generate
  'ai', // for AI Generate -> true or false
  'aiLabel' // for AI Generate Label -> String
]);

const { t } = useI18n()

const loading = computed(() => props.loading);
const trailing = computed(() => props.trailing);
const leading = computed(() => props.leading);
const type = computed(() => props.type);
const placeholder = computed(() => props.placeholder);
const autofocus = computed(() => props.autofocus);
const autofocusDelay = computed(() => props.autofocusDelay);
const loadingIcon = computed(() => props.loadingIcon);
const leadingIcon = computed(() => props.leadingIcon);
const trailingIcon = computed(() => props.trailingIcon);
const autocomplete = computed(() => props.autocomplete);
const padded = computed(() => props.padded);
const icon = computed(() => props.icon);
const min = computed(() => props.min);
const max = computed(() => props.max);
const score = computed(() => props.score);
const isRight = computed(() => props.isRight ?? false)
const isLeft = computed(() => props.isLeft ?? false)
const floatingLabel = computed(() => props.floatingLabel)
const disabled = computed(() => props.disabled)
const color = computed(() => props.color)
const highlight = computed(() => props.highlight ?? false)
const error = computed(() => props.error ?? false)

const mask = computed(() => props.mask ?? false)  
const totp = computed(() => props.totp ?? false)
const placeholderPinInput = computed(() => props.placeholderPinInput)
const length = computed(() => props.length ?? 6)
const separator = computed(() => props.separator ?? " ")
const typePinInput = computed(() => props.typePinInput ?? "number")

const ai = computed(() => props.ai ?? false)
const aiLabel = computed(() => props.aiLabel ?? t('ai_generate'))

const leftPadding = computed(() =>
  // (isLeft.value ?? props.leading ?? props.leadingIcon) ? '35px' : '12px'
  (isLeft.value ?? ui.leading ?? (ui.leadingIcon || props.leading || props.leadingIcon || props.ai)) ? '35px' : '12px'
)

const rightPadding = computed(() =>
  // (isRight.value ?? props.trailing ?? props.trailingIcon) ? '35px' : '12px'
  (isRight.value ?? ui.trailing ?? (ui.trailingIcon || props.trailing || props.trailingIcon || props.ai)) ? '35px' : '12px'
)


watch(value, (newValue) => {
  if (type.value === "number") {
    let formattedValue = newValue?.toString();
    formattedValue = formattedValue?.replace(/[^0-9.]/g, "");
    if (isEmpty(formattedValue)) return;
    const parts = formattedValue?.split(".");
    if (parts?.length > 2) {
      formattedValue = parts[0] + "." + parts[1];
    }
    if (parts[1]) {
      formattedValue = parts[0] + "." + parts[1]?.substring(0, 2);
    }
    value.value = formattedValue;
  }
});

const pinDefaultInputUI = computed(() => {
  const defautUI = {
    root: 'relative inline-flex items-center gap-1.5',
    base: [
      'pin-input-base!w-8 !h-8 rounded-md border-0 p-0 placeholder:text-dimmed text-center disabled:cursor-not-allowed disabled:opacity-75',
      'transition-colors',
      'text-[12px]'
    ],
    separator: 'text-dimmed flex items-center justify-center'
  }
  return {...defautUI, ...props.pinInputUI}
})

const base = computed(() => {
  return [
    'peer text-[12px] transition-colors',
    !floatingLabel.value && 'leading-4 trailing-padding leading-padding pr-12 pl-14.5 rounded-md border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75'
  ].filter(Boolean).join(' ')
})
// sinh
const emits = defineEmits(["onFocus", "onBlur", "onInput"]);
// size → controls padding + height preset
const ui = computed(() => {
  const defaultUI = {
    root: 'w-full relative inline-flex items-center',
    // base:base.value,
  //   base: floatingLabel.value
  // ? 'peer text-[12px] transition-colors'
  // : 'peer leading-4 trailing-padding leading-padding pr-12 pl-14.5 rounded-md border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75 text-[12px] transition-colors'
    base:['r-input-base',
      { 'input-error': !!error },'peer', floatingLabel.value ? '' : 'leading-4 trailing-padding leading-padding pr-12 pl-14.5 peer rounded-md border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75','text-[12px]','transition-colors'], //controls font-size, borders, color
    wrapper: 'relative oc-input-wrapper',
    placeholder: "placeholder:text-[12px]",
    rounded: "",
    leadingIcon: 'leadingIcon text-[12px] text-gray-400',
    trailingIcon: 'trailingIcon text-[12px] text-gray-400',
    file: {
      base: "file:hidden",
    },
    size: {},
    gap: {
      xs: "gap-x-2",
    },
    padding: {
      xs: "px-3 py-2.5",
    },
    leading: {
      padding: {
        xs: "ps-10 leading-padding",
      },
    },
    trailing: {
      padding: {
        xs: "pe-20 trailing-padding",
      },
    },
    icon: {
      base: "flex justify-center items-center",
      size: {},
      leading: {
        wrapper: 'absolute inset-y-0 start-0 flex items-center position-right-custom icon-size text-[18px]',
      },
      trailing: {
        wrapper: `absolute inset-y-0 end-0 flex items-center position-right-custom position-${isRight.value ? `right` : ''} text-[18px]`,
      }
    },
  };

  const resultUI = {
    ...defaultUI,
    ...props.ui,
    file: {
      ...defaultUI.file,
      ...props.ui?.file,
    },
    size: {
      ...defaultUI.size,
      ...props.ui?.size,
    },
    gap: {
      ...defaultUI.gap,
      ...props.ui?.gap,
    },
    padding: {
      ...defaultUI.padding,
      ...props.ui?.padding,
    },
    leading: {
      ...defaultUI.leading,
      ...props.ui?.leading,
      padding: {
        ...defaultUI.leading.padding,
        ...props.ui?.leading?.padding,
      },
    },
    trailing: {
      ...defaultUI.trailing,
      ...props.ui?.trailing,
      padding: {
        ...defaultUI.trailing.padding,
        ...props.ui?.trailing?.padding,
      },
    },
    icon: {
      ...defaultUI.icon,
      ...props.ui?.icon,
      size: {
        ...defaultUI.icon.size,
        ...props.ui?.icon?.size,
      },
      leading: {
        ...defaultUI.icon.leading,
        ...props.ui?.icon?.leading,
      },
      trailing: {
        ...defaultUI.icon.trailing,
        ...props.ui?.icon?.trailing,
      },
    },
  };
  return resultUI;
});

function ocInput() {
  return refOCInput.value;
}

defineExpose({ ocInput });
</script>

<style lang="scss">

.input-wrapper{
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.text-size-input{
  font-size: 12px !important  ;
}
.oc-input-wrapper {
  position: relative;
  .position-right-custom {
    right: 12px;
  }
  .position-right {
    right: 500px !important;
  }
}

.loader {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-w-b-3);
  border-bottom-color: var(--color-w-b-2);
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

[type="text"] {
  &::placeholder {
    color: var(--color-w-b-3) !important;
  }
}

// work for trailing and leading icon of UInput
[data-slot="leading"] {
  padding-left: 12px !important;
}


[data-slot="trailing"] {
  position: absolute;
  // right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding-right: 12px !important;
}
//work for rinput
//make space for leading icon
[data-slot="base"] {
  // padding-left: v-bind('isLeft ? "35px" : "12px"');
  // padding-right: v-bind('isRight ? "35px" : "12px"');
    padding-left: v-bind(leftPadding);
    padding-right: v-bind(rightPadding);
  // padding-left: v-bind('ui.leading ? "30px" : "12px"') !important;
  // padding-right: v-bind('ui.trailingIcon ? "30px" : "12px"') !important;
  font-size: 16px;
}

[data-size="md"] {
  --icon-size: 16px;
  --icon-padding: 36px;
}

.icon-size{
  font-size: 300px !important;
}

.pin-input-base{
  width:24px !important;
  height: 24px !important;
}

.trailing-side {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.ocs-input {
  box-shadow: none !important;
  border: 1px solid var(--color-w-b-4) !important;
  border-radius: 8px !important;
  font-size: 14px;
  color: var(--color-w-b-1);
  height: 38px;
  width: 100%;
  padding-right: 42px !important;
  background-color: transparent !important;

  &:focus {
    border: 1px solid var(--color-primary) !important;
  }
  
  // &:focus-visible{
  //   outline: 1px solid var(--color-primary) !important;
  // }

  &:disabled {
    background: var(--bg-wrapper-50) !important;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
  }
}

.ocs-input-score {
  box-shadow: none !important;
  border: 1px solid var(--color-w-b-4) !important;
  border-radius: 8px !important;
  text-align: end !important;
  font-size: 14px;
  color: var(color-w-b-1);
  background-color: transparent !important;
  width: 100%;

  &:focus {
    border: 1px solid var(--color-primary) !important;
  }

  // &:focus-visible{
  //   outline: 1px solid var(--color-primary) !important;
  // }

  &:disabled {
    background: var(--bg-wrapper-50) !important;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
  }
}


.trailingIcon,
.leadingIcon{
  font-size: 15px !important;
}

/* Hide the password reveal button in Edge */
::-ms-reveal {
    display: none;
}

.input-error {
  border: 1px solid #ef4444 !important;
}

.input-error:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 1px #ef4444;
}

.border-red-500 {
  border-color: #ef4444;
}
</style>

<!-- 
uage with lenght value input: 0/15
<script setup lang="ts">
const value = ref('')
const maxLength = 15
</script>

<template>
  <UInput
    v-model="value"
    :maxlength="maxLength"
    aria-describedby="character-count"
    :ui="{ trailing: 'pointer-events-none' }"
  >
    <template #trailing>
      <div
        id="character-count"
        class="text-xs text-muted tabular-nums"
        aria-live="polite"
        role="status"
      >
        {{ value?.length }}/{{ maxLength }}
      </div>
    </template>
  </UInput>
</template>
 -->
