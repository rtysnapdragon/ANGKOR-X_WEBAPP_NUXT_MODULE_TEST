<template>
  <Popover ref="refPopover" class="relative" v-slot="{ open }">
    <RTooltip :text="$t('filter')">
      <PopoverButton class="ocs-btn-filter" @click="fnOpen(open)">
        <i class="ri-equalizer-2-line"></i>
      </PopoverButton>
    </RTooltip>
    <PopoverPanel class="ocs-popover" :class="props.class" v-slot="{ close }">
      <div class="oc-filter-header">
        <h3 class="font-medium text-sm">{{ $t("filter") }}</h3>
        <i class="ri-close-fill cursor-pointer" @click="fnClose(close)"></i>
      </div>
      <div class="oc-filter-body">
        <slot>
          <RForm ref="refForm" :state="state" class="space-y-3 grid items-center" :class="[width]">
            <div v-if="isNotEmpty(tabs)">
              <RTab :items="tabs.items" :ui="tabs.ui" :orientation="tabs.orientation" :defaultIndex="tabs.defaultIndex"
                @onChange="(v) => (isNotEmpty(tabs.onChange) ? tabs.onChange(v) : '')" ref="refTabs">
                <template #item="data">
                  <div v-for="i in data.item.inputs">
                    <RFormGroup v-if="typeof i === 'object' && !Array.isArray(i) && !i.hidden" :label="i.label"
                      :name="i.name" class="w-full mb-2" :required="i.required">
                      <RInputForm v-model:state="state" :input="i" :ref="(elm) => setRefInput(elm, i.name)" />
                    </RFormGroup>

                    <div class="flex gap-2" v-if="typeof i === 'object' && Array.isArray(i)">
                      <RFormGroup v-for="j in i" v-if="!j?.hidden" :label="j.label" :name="j.name" class="w-full mb-2"
                        :required="j.required">
                        <RInputForm v-model:state="state" :input="j" :ref="(elm) => setRefInput(elm, j.name)" />
                      </RFormGroup>
                    </div>
                  </div>
                </template>
              </RTab>
            </div>

            <div v-else v-for="i in inputs">
              <RFormGroup v-if="typeof i === 'object' && !Array.isArray(i) && !i.hidden" :label="i.label"
                :name="i.name" class="w-full" :required="i.required">
                <RInputForm v-model:state="state" :input="i" :ref="(elm) => setRefInput(elm, i.name)" />
              </RFormGroup>

              <div class="grid grid-cols-2 gap-2" v-if="typeof i === 'object' && Array.isArray(i)">
                <RFormGroup v-for="j in i" :label="j.label" :name="j.name"
                  :class="['w-full', j?.hidden ? 'hidden' : '']" :required="j.required">
                  <RInputForm v-model:state="state" :input="j" :ref="(elm) => setRefInput(elm, j.name)" />
                </RFormGroup>
              </div>
            </div>
          </RForm>
        </slot>
      </div>
      <div class="oc-filter-footer">
        <RBtn type="cancel" :noIcon="true" :label="$t('close')" :isLabelBold="true" size="xs" variant="solid"
          @click="fnClose(close)" />
        <RBtn type="apply" :noIcon="true" :label="$t('apply')" :isLabelBold="true" size="xs" variant="solid"
          @click="onApply(close)" />
      </div>
    </PopoverPanel>
  </Popover>
</template>

<script setup>
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
const ocChipStore = useRChipDataStore();
const state = defineModel();
const emit = defineEmits(["onClick", "onCancel", "onOpen"]);
const props = defineProps({
  color: { Type: String },
  class: { Type: String },
  stateKey: { Type: String },
  width: {
    type: String,
    default: () => 'w-[350px]'
  },
  tabs: {
    items: [
      {
        label: "Label 1",
        inputs: [
          {
            type: "select",
            name: "CurrencyCode",
            label: "Currency",
            required: true,
            disabled: false, // disCurrency.value
            api: {
              url: "api/currency/list",
              method: "Post",
              filter: {
                Status: [],
                UserType: [],
              },
            },
            pk: "Id",
            isNotAllowRemoteSelect: false,
            templateLeading: {},
            templateOption: {},
            template: (d) => {
              return {
                avatar: d.ImagePath,
                subtitle: d.ShortName,
                title: tBy({ en: d.EnglishName, km: d.Name }),
              };
            },
            mapData: (v) => {
              const list = [];
              v.filter((v) => {
                if (!v.IsBase) {
                  list.push({
                    ...{ ImagePath: getCurrencyFlag(v.ShortName) },
                    ...v,
                  });
                }
              });
              v.data = list;
            },
            title: tBy({ en: "EnglishName", km: "Name" }),
          },
          {
            type: "date",
            name: "Date",
            label: "Date",
            value: undefined,
            required: true,
          },
        ],
      },
      {
        label: "Label 2",
        inputs: [
          [
            {
              type: "number",
              name: "ExchangeRate",
              label: "Exchange Rate",
              disabled: false,
              required: true,
              onInput: (v) => "",
              trailingIcon: "ri-money-dollar-circle-line",
              placeholder: "0",
              min: 0,
            },
            {
              type: "textarea",
              name: "Description",
              label: "Description",
              disabled: false,
              required: false,
            },
          ],
        ],
      },
    ],
    onChange: (v) => { },
    defaultIndex: 1,
    orientation: "",
    ui: "",
  },

  inputs: {
    type: Array,
    required: true,
    default: () => [
      {
        type: "email", //optional
        name: "email",
        label: "Email", // optional
        // placeholder: '', // optional
        disabled: false, // optional
        required: false, // optional
        value: undefined, // optional in case draw input value to update
      },
      {
        type: "text",
        name: "text",
        label: "Text",
        // placeholder: '',
        disabled: false,
        required: false,
      },
      [
        {
          type: "phone",
          name: "phone",
          label: "Phone",
          // placeholder: '',
          disabled: false,
          required: false,
        },
        {
          type: "groupCheckbox",
          name: "groupCheckbox",
          label: "Group Checkbox",
          disabled: false,
          required: false,
          ui: "",
          options: [
            { value: "first", label: "First" },
            { value: "second", label: "Second" },
          ],
        },
      ],
      {
        type: "checkbox",
        name: "checkbox",
        label: "",
        placeholder: "Checkbox",
        disabled: false,
        required: false,
      },
      {
        type: "select",
        name: "CurrencyCode",
        label: "Currency",
        required: true,
        api: {
          url: "api/currency/list",
          method: "Post",
        },
        pk: "Id",
        isNotAllowRemoteSelect: false,
        templateLeading: {},
        templateOption: {},
      },
      {
        type: "radio",
        name: "radio",
        label: "Radio",
        disabled: false,
        required: false,
        options: [
          {
            value: "p1",
            label: "Option 1",
          },
          {
            value: "p2",
            label: "Option 2",
          },
          {
            value: "p3",
            label: "Option 3",
          },
        ],
      },
    ],
  },
});

const width = computed(() => props.width);
const tabs = computed(() => props.tabs);

// Make a cloned and updated version of props.inputs
const inputs = computed(() => {
  const stateChip = ocChipStore.getData[props.stateKey];
  // console.log('stae chip >>>', stateChip)
  if (!props.inputs) return [];

  return props.inputs.map(input => {
    if (Array.isArray(input)) {
      return input.map(item => ({
        ...item,
        value: fnSetDataChip(stateChip, item.name)
      }));
    }

    return {
      ...input,
      value: fnSetDataChip(stateChip, input.name)
    };
  });
});


function fnSetDataChip(stateChip, pk) {
  return isNotEmpty(stateChip && stateChip?.some(e => e.pk === pk)) ? stateChip?.find(e => e.pk === pk).item : undefined
}

const refPopover = ref()
const refForm = ref();
const refInput = ref({});
const refTabs = ref();
function setRefInput(elm, name) {
  refInput.value[name] = elm?.refInput().value[name];
}

onClickOutside(refPopover, event => {
  fnSetStateValue()
})

mounted(() => {
  console.log('mounted filter',)
  fnSetStateValue(true)
});

function fnSetStateValue(isMounted=false) {
// console.log('filter 1 >>>',copyWith(state.value))
  if (isNotEmpty(ocChipStore.getData)) {
    if (isNotEmpty(props.stateKey)) {
      const stateChip = ocChipStore.getData[props.stateKey];
      if (isNotEmpty(stateChip)) {
        const keys = Object.keys(state.value)?.filter(e => e != 'undefined');
        if (isNotEmpty(keys)) {
          keys.forEach(key => {
            state.value[key] = fnSetDataChip(stateChip, key);
          })
        } else {
          stateChip.forEach(e => {
            state.value[e.pk] = e.item ?? undefined;
          });
        }
      }

      return
    }

    fnSetStateUndefined(isMounted)

  } else {
    fnSetStateUndefined(isMounted)
  }
  // console.log('filter 2 >>>',copyWith(state.value))
}

function fnSetStateUndefined(isMounted) {
  if (isNotEmpty(state.value) && isNotEmpty(inputs.value)) {
    inputs.value?.forEach(input => {
      if (Array.isArray(input)) {
        input.forEach(item => {
          if(isMounted) return
          item.value = undefined;
          state.value[item.name] = undefined;
        });
        return
      }

      if(isMounted) return
      input.value =  undefined;
      state.value[input.name] = undefined;
    });
  }
}

function fnClose(close) {
  fnSetStateValue()
  emit("onCancel");
  close();
}
function fnOpen(open) {
  fnSetStateValue()
  emit("onOpen", !open);
  // console.log('open ===>>', !isNotEmpty(open))
  // if (open) {
  //   console.log('== false >>')
  // }
}

function onApply(close) {
  emit("onClick", close);
  close();
}

defineExpose({
  onsubmit: () => refForm.value.submit(),
  refInput: () => refInput.value,
  jumpTo: (v) => refTabs.value.jumpTo(v),
  disabledTab: (i, disabled) => refTabs.value.disabled(i, disabled),
});
</script>

<style lang="scss">
.ocs-btn-filter {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  color: var(--color-w-b-1);
  background: var(--bg-content);

  &:focus-visible {
    outline: none;
  }
}

.oc-content,
.oc-modal {
  .ocs-btn-filter {
    background: var(--bg-wrapper) !important;
  }
}

.ocs-popover {
  position: absolute;
  margin-top: 14px;
  z-index: 100;
  background: var(--bg-content);
  border-radius: 12px;
  box-shadow: 6px 6px 20px #0000002d;

  margin-top: 14px;
  animation: ani-bottom 0.25s ease-in-out;
  transform: translateY(0px);

  @keyframes ani-bottom {
    from {
      transform: translateY(6px);
      opacity: 0;
    }

    to {
      transform: translateY(0px);
      opacity: 1;
    }
  }
}

.customer-shadow-dialog-filter {
  box-shadow: 6px 6px 20px rgba(0, 0, 0, 0.1);
}

.dark {
  .customer-shadow-dialog-filter {
    box-shadow: 6px 6px 20px rgba(0, 0, 0, 0.3);
  }
}

.oc-filter-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  min-height: 50px;
  padding: 0px 15px 0px 18px;
}

.oc-filter-body {
  padding: 0 18px 6px;
}

.oc-filter-footer {
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 16px 18px;
  grid-gap: 6px;
}
</style>
