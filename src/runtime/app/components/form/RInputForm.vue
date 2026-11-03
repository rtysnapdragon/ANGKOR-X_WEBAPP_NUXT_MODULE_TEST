<template>
  <div>
    <RSelect
      v-if="input.type == 'select'"
      v-model="state[input.name]"
      :required="input.required"
      :localData="isNotEmpty(input.options) ? input.options : null"
      :api="
        isNotEmpty(input.api)
          ? {
              url: input.api.url,
              method: input.api.method,
              filter: input.api.filter,
              where: input.api.where,
            }
          : null
      "
      :searchable="input.search"
      :selectBy="input.pk"
      :ref="(elm) => setRefInput(elm, input.name)"
      :disabled="input.disabled"
      :multiple="input.multiple"
      :pk="input.pk"
      :isNotAllowRemoteSelect="input.isNotAllowRemoteSelect"
      :templateLeading="input.templateLeading"
      :templateOption="input.templateOption"
      @selected="
        (v) => (isNotEmpty(input.selected) ? input.selected(v, state) : '')
      "
      @mapData="(v) => (isNotEmpty(input.mapData) ? input.mapData(v) : '')"
      variant="outline"
    >
      <template #leading="{ data }" v-if="isEmpty(input?.templateLeading)">
        <div v-if="isEmpty(input.template)">
           <RTruncateText :text="isNotEmpty(input.title)
              ? data[input.title]
              : tBy({ km: data.Name, en: data.EnglishName })" />
          <!-- {{
            isNotEmpty(input.title)
              ? data[input.title]
              : tBy({ km: data.Name, en: data.EnglishName })
          }} -->
        </div>
        <div
          v-else-if="isNotEmpty(input.template)"
          class="flex items-center gap-1"
        >
          <RAvatar
            v-if="
              input.template(data)?.avatar != null &&
              input.template(data)?.avatar != undefined
            "
            size="3xs"
            round="l"
            border="s"
            :src="input.template(data)?.avatar"
          />
          <RTooltip :text="input.template(data)?.title">
            <div class="flex items-center gap-1">
              <RViewInfo :title="input.template(data)?.title" size="line-clamp-1" />
            </div>
          </RTooltip>
        </div>
      </template>
      <template #option="{ data }" v-if="isEmpty(input?.templateOption)">
        <div v-if="data.isDefault != true">
          <div v-if="isEmpty(input.template)">
            {{
              isNotEmpty(input.title)
                ? data[input.title]
                : tBy({ km: data.Name, en: data.EnglishName })
            }}
          </div>
          <div
            v-else-if="isNotEmpty(input.template)"
            class="flex items-center gap-1"
          >
            <RAvatar
              v-if="
                input.template(data)?.avatar != null &&
                input.template(data)?.avatar != undefined
              "
              size="2xs"
              round="l"
              border="s"
              :src="input.template(data)?.avatar"
            />
            <RViewInfo
              :title="input.template(data)?.title"
              :subTitle="input.template(data)?.subtitle"
            />
          </div>
        </div>
      </template>
    </RSelect>

    <RTextarea
      v-else-if="input.type == 'textarea'"
      v-model="state[input.name]"
      :placeholder="getPlaceholder()"
      :disabled="input.disabled"
      :ui="input.ui"
      :size="input.size"
      :name="input.name"
      :rows="input.rows"
      :maxRows="input.maxRows"
      :resize="input.resize"
      :autoResize="input.autoResize"
      :textareaClass="input.textareaClass"
      :padded="input.padded"
      :autofocus="input.autofocus"
      :autofocusDelay="input.autofocusDelay"
      :ref="(elm) => setRefInput(elm, input.name)"
      @onInput="
        (v) => (isNotEmpty(input.onInput) ? input.onInput(v, state) : '')
      "
    />

    <RDatePicker
      v-else-if="input.type == 'date'"
      :format="dateForm"
      class="startDate"
      v-model="state[input.name]"
      :modelValue="input.date"
      :label="input.date"
      :disabled="input.disabled"
      :attrs="input.attrs"
      :mode="input.mode"
      :hideTimeHeader="input.hideTimeHeader"
      :attributes="input.attributes"
      :dateRangePicker="input.dateRangePicker"
      :minDate="input.minDate"
      :maxDate="input.maxDate"
      :masks="input.masks"
      :ui="input.ui"
      :hover="input.hover ?? false"
      :is24hr="input.is24hr ?? false"
      :placeholder="getPlaceholder()"
      @update:model-value="
        (v) =>
          isNotEmpty(input.updateModelValue)
            ? input.updateModelValue(v, state)
            : ''
      "
      @close="() => (isNotEmpty(input.onClose) ? input.onClose() : '')"
      :ref="(elm) => setRefInput(elm, input.name)"
    />

    <RDatePicker
      v-else-if="input.type == 'time'"
      mode="time"
      class="startDate"
      v-model="state[input.name]"
      :format="input.format ?? timeForm"
      :modelValue="input.time"
      :label="input.time"
      :disabled="input.disabled"
      :attrs="input.attrs"
      :hideTimeHeader="input.hideTimeHeader"
      :attributes="input.attributes"
      :dateRangePicker="input.dateRangePicker"
      :minDate="input.minDate"
      :maxDate="input.maxDate"
      :masks="input.masks"
      :ui="input.ui"
      :hover="input.hover ?? false"
      :is24hr="true"
      :placeholder="getPlaceholder()"
      @update:model-value="
        (v) =>
          isNotEmpty(input.updateModelValue)
            ? input.updateModelValue(v, state)
            : ''
      "
      @close="() => (isNotEmpty(input.onClose) ? input.onClose() : '')"
      :ref="(elm) => setRefInput(elm, input.name)"
    />

    <RDateRangePicker
      v-else-if="input.type == 'dateRange'"
      v-model="input.value"
      :label="input.value"
      :range="input.range ?? []"
      :format="input.format ?? dateForm"
      :hide-time-header="input.hideTimeHeader"
      :predefined="input.predefined"
      :disabled="input.disabled"
      :attributes="input.attributes"
      :ui="input.ui"
      :minDate="input.minDate"
      :maxDate="input.maxDate"
      :placeholder="getPlaceholder()"
      @update:model-value="
        (a) => {
          isNotEmpty(input.update) ? input.update(a) : '';
          input.value = { start: new Date(a.start), end: new Date(a.end) };
          if (typeof input.name == 'object') {
            if (isNotEmpty(input.name.start)) state[input.name.start] = a.start;
            if (isNotEmpty(input.name.end)) state[input.name.end] = a.end;
          } else {
            state[input.name] = a;
          }
        }
      "
      :ref="(elm) => setRefInput(elm, input.name)"
    />
    <!-- range: { start: new Date(), end: add(new Date(), { days: 30 }) },
         modelApi:{start:'Start',end:'End'}
    -->

    <RCheckbox
      v-else-if="input.type == 'checkbox'"
      v-model="state[input.name]"
      :label="input.label"
      :name="input.name"
      :required="input.required"
      :value="input.value"
      :disabled="input.disabled"
      :ui="input.ui"
      :help="input.help"
      :id="input.id"
      :ref="(elm) => setRefInput(elm, input.name)"
    >
      <template #label v-if="isNotEmpty(input.slotLabel)">
        {{ input.slotLabel }}
      </template>
    </RCheckbox>

    <RCheckboxes
      v-else-if="input.type == 'groupCheckbox'"
      v-model="state[input.name]"
      :options="input.options"
      :disabled="input.disabled"
      :ui="input.ui"
      :ref="(elm) => setRefInput(elm, input.name)"
    >
      <template #label v-if="isNotEmpty(input.slotLabel)">
        {{ input.slotLabel }}
      </template>
    </RCheckboxes>

    <RRadios
      v-else-if="input.type == 'radio'"
      v-model="state[input.name]"
      :options="input.options"
      :disabled="input.disabled"
      :ui="input.ui"
      :uiRadio="input.uiRadio"
      :optionAttribute="input.optionAttribute"
      :valueAttribute="input.valueAttribute"
      :modeCheckBox="input.modeCheckBox"
      :ref="(elm) => setRefInput(elm, input.name)"
      @onChange="
        (n) => {
          isNotEmpty(input.onChange) ? input.onChange(n) : '';
        }
      "
    >
      <template #label="{ option }" v-if="isNotEmpty(input.slotLabel)">
        {{ input.slotLabel(option) }}
      </template>
    </RRadios>

    <div
      v-else-if="input.type == 'color'"
      class="flex items-center gap-2 w-full"
    >
      <RInputColor
        v-model="state[input.name]"
        :disabled="input.disabled"
        @onChange="
          (color) => {
            isNotEmpty(input.onChange) ? input.onChange(color) : '';
          }
        "
        @onPicker="isNotEmpty(input.onPicker) ? input.onPicker() : ''"
      />
    </div>

    <div v-else-if="input.type == 'file'">
      <FileUpload v-model="state[input.name]" showIconDelete="test" />
    </div>

    <RInput
      v-else
      v-model="state[input.name]"
      :type="input.type"
      :placeholder="getPlaceholder()"
      :disabled="input.disabled"
      :size="input.size"
      :name="input.name"
      :ui="input.ui"
      :icon="input.icon"
      :autofocus="input.autofocus"
      :autofocusDelay="input.autofocusDelay"
      :loading="input.loading"
      :loadingIcon="input.loadingIcon"
      :leading="input.leading"
      :trailing="input.trailing"
      :leadingIcon="input.leadingIcon"
      :trailingIcon="input.trailingIcon"
      :autocomplete="input.autocomplete"
      @onInput="
        (v) => (isNotEmpty(input.onInput) ? input.onInput(v, state) : '')
      "
      @onFocus="
        (v) => (isNotEmpty(input.onFocus) ? input.onFocus(v, state) : '')
      "
      @onBlur="(v) => (isNotEmpty(input.onBlur) ? input.onBlur(v, state) : '')"
      :min="input.min"
      :max="input.max"
      :ref="(elm) => setRefInput(elm, input.name)"
    >
      <template #leading v-if="isNotEmpty(input.slotLeading)">
        {{ input.slotLeading }}
      </template>
      <template #trailing v-if="isNotEmpty(input.slotTrailing)">
        {{ input.slotTrailing }}
      </template>
    </RInput>
  </div>
</template>

<script setup>
import FileUpload from '../files/FileUpload.vue'
import RRadios from '../checkRadio/RRadios.vue'
import RTooltip from '../RTooltip.vue'
import RViewInfo from '../RViewInfo.vue'
const state = defineModel("state");
const props = defineProps(["input"]);
const input = computed(() => props.input);
const dateForm = "MMM dd,yyyy";
const timeForm = "hh:mm";
const dataUpdate = defineModel("dataUpdate");
const copyUpdateData = computed(() => copyWith(dataUpdate.value));
const refInput = ref({});

function setRefInput(elm, name) {
  if (isNotEmpty(elm)) refInput.value[name] = elm;
}
defineExpose({
  refInput: () => refInput,
});
setTimeout(() => {
  watch(
    copyUpdateData,
    (n, o) => {
      if (isNotEmpty(n) && input.value.type == "select") {
        let selectRef = refInput.value[input.value.name];
        let keySelect = isNotEmpty(input.value.pk)
          ? input.value.pk
          : input.value.name;
        if (isNotEmpty(selectRef)) {
          setTimeout(() => {
            selectRef.remoteSelect({
              pk: keySelect,
              [keySelect]: n[input.value.name],
            });
          }, 300);
        }
      }
    },
    { deep: true, immediate: true }
  );
}, 300);

const getPlaceholder = () => {
  if (isNotEmpty(input.value.placeholder)) {
    return input.value.placeholder;
  }

  switch (input.value.type) {
    case "select":
      return "Please select";
    case "number":
      return 0;
    case "phone":
      return "012345678";
    default:
      return "Please enter";
  }
};

function onSelected(v, input) {
  isNotEmpty(input.selected) ? input.selected(v) : "";
}

onMounted(() => {
// console.log('mounted >>>',input.value)
});
</script>

<style scoped>
.text-below-item {
  font-size: 11px;
  color: var(--color-w-b-3);
}

.custom-color-input {
  height: 38px;
  border: none;
  border-radius: 8px;
  background-color: #ffffff;
  cursor: pointer;
  padding: 5px;
  outline: 2px solid #ffffff;
}
</style>
