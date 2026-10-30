<template>
  <UInput
    ref="refOCInput"
    v-model.trim="search"
    :placeholder="placeholder || $t('search')"
    :autofocus="props.autofocus"
    autocomplete="off"
    leading-icon="ri-search-2-line"
    color="primary"
    :ui="{
      wrapper: `container-oc-input-search relative sm:w-auto ${props.wrapper ?? ''}`,
      base: `input-search ${props.class ?? ''} ps-9 pe-9`,
      leading: {
        padding: 'ps-9'
      }
    }"
    @input="onSearch"
  >
    <!-- ✅ Trailing slot (Nuxt UI v4 way) -->
    <template #trailing>
      <button
        v-if="isNotEmpty(search)"
        type="button"
        class="btn-cancel text-lg flex items-center justify-center"
        @click="onCancel"
      >
        <i class="ri-close-circle-line"></i>
      </button>
    </template>
  </UInput>
</template>

<script setup>
const search = defineModel()
const emit = defineEmits(["onInput", "onCancel"])

const props = defineProps([
  "autofocus",
  "class",
  "wrapper",
  "placeholder"
])

const placeholder = computed(() => props.placeholder ?? false)

const refOCInput = ref()
const tempSearch = ref("")
let timeout

function onSearch(e) {
  const query = (e.target?.value || "").trim()

  clearTimeout(timeout)

  timeout = setTimeout(() => {
    const normalized = query.toLowerCase()

    if (tempSearch.value === normalized) return

    emit("onInput", normalized)
    tempSearch.value = normalized
  }, 1000)
}

function onCancel() {
  if (tempSearch.value === "") return

  search.value = ""
  tempSearch.value = ""
  emit("onCancel", "")
}

function remoteData(s = "") {
  search.value = s
}

function ocInput() {
  return refOCInput.value?.input
}

defineExpose({ remoteData, ocInput })
</script>

<style lang="scss">
.input-search {
  height: 36px;
  width: 250px;
  padding-left: 35px !important;
  border: 1px solid var(--c-border) !important;
  box-shadow: none !important;
  border-radius: 10px !important;
  background: var(--bg-content) !important;

  &:focus {
    // border: none !important;
    border: 1px solid var(--color-w-b-4) !important;
    box-shadow: none !important;
  }

  &.line {
    border: 1px solid var(--color-w-b-4) !important;
    background: none;

    &:focus {
      border: 1px solid var(--color-primary) !important;
    }
  }
}

.container-oc-input-search {
  border: 1px solid var(--c-border) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  .btn-cancel {
    position: absolute;
    right: 8px;
    cursor: pointer !important;
  }
}

.oc-content,
.oc-modal {
  .input-search {
    background: var(--bg-wrapper) !important;
  }
}
</style>