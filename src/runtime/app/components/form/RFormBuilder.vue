<template>
  <div :class="isNotEmpty(form.width) ? `w-[${form.width}]` : 'min-w-[300px]'">
    <RForm ref="refForm" id="formId" :schema="schema" :state="state" @onSubmit="onSubmitModal" @onError="onFormError"
      class="space-y-4">
      <div v-if="isNotEmpty(tabs)">
        <RTab :items="tabs.items" :ui="tabs.ui" :orientation="tabs.orientation" :defaultIndex="tabs.defaultIndex"
          @onChange="(v) => (isNotEmpty(tabs.onChange) ? tabs.onChange(v) : '')" ref="refTabs">
          <template #item="data">
            <div v-for="i in data.item.inputs">
              <RFormGroup v-if="typeof i === 'object' && !Array.isArray(i) && !i.hidden" :label="i.label"
                :name="i.name" class="w-full mb-2" :required="i.required">
                <RInputForm v-model:state="state" v-model:dataUpdate="dataUpdate" :input="i"
                  :ref="(elm) => setRefInput(elm, i.name)" />
              </RFormGroup>

              <div class="flex gap-2" v-if="typeof i === 'object' && Array.isArray(i)">
                <RFormGroup v-for="j in i" v-if="!j?.hidden" :label="j.label" :name="j.name" class="w-full mb-2"
                  :required="j.required">
                  <RInputForm v-model:state="state" v-model:dataUpdate="dataUpdate" :input="j"
                    :ref="(elm) => setRefInput(elm, j.name)" />
                </RFormGroup>
              </div>
            </div>
          </template>
        </RTab>
      </div>

      <div v-else v-for="i in inputs">
        <RFormGroup v-if="typeof i === 'object' && !Array.isArray(i) && !i.hidden" :label="i.label" :name="i.name"
          class="w-full" :required="i.required">
          <RInputForm v-model:state="state" v-model:dataUpdate="dataUpdate" :input="i"
            :ref="(elm) => setRefInput(elm, i.name)" />
        </RFormGroup>

        <div class="grid grid-cols-2 gap-2" v-if="typeof i === 'object' && Array.isArray(i)">
          <RFormGroup v-for="j in i" :label="j.label" :name="j.name" :class="['w-full', j?.hidden ? 'hidden' : '']"
            :required="j.required">
            <RInputForm v-model:state="state" v-model:dataUpdate="dataUpdate" :input="j"
              :ref="(elm) => setRefInput(elm, j.name)" />
          </RFormGroup>
        </div>
      </div>
    </RForm>

    <div class="flex items-center gap-[6px] mt-[20px] justify-end">
      <RBtn type="cancel" :label="$t('cancel')" size="s" variant="solid" @click="clearForm" :disabled="loading"
        v-if="conditionShowBtn(form.showCancel)" />
      <RBtn type="reset" :label="$t('reset')" size="s" variant="solid" v-if="conditionShowBtn(form.showReset)"
        @click="resetForm" :disabled="loading" />
      <RBtn v-if="conditionShowBtn(form.showSubmit)" :type="isUpdate ? 'save-update' : 'save'"
        :label="isUpdate ? $t('update') : $t('save')" size="s" variant="solid" @click="refForm.submit()"
        :loading="loading" />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { z } from "zod";
const { t } = useI18n();
const toast = useToast();
const confirm = useConfirmStore();
const refForm = ref();
const dataUpdate = defineModel("data");
const isUpdate = computed(() => isNotEmpty(dataUpdate.value));
const emit = defineEmits([
  "onSubmitted",
  "onCancel",
  "onReset",
  "onLoading",
  "onError",
  "onSuccess",
]);
const refInput = ref({});
const refTabs = ref();
function setRefInput(elm, name) {
  refInput.value[name] = elm?.refInput().value[name];
}

defineExpose({
  onsubmit: () => refForm.value.submit(),
  clearForm,
  resetForm,
  refInput: () => refInput.value,
  jumpTo: (v) => refTabs.value.jumpTo(v),
  disabledTab: (i, disabled) => refTabs.value.disabled(i, disabled),
});

// const props = defineProps(['form', 'tabs', 'inputs'])

const props = defineProps({
  form: {
    type: Object,
    required: true,
    default: {
      api: {
        create: "",
        update: "",
      },
      showSubmit: false,
      showReset: false, // Button reset
      showCancel: false,
      width: 360, // width of Drawer
      showErrorMassage: false,
      showSuccessMessage: false,
      confirmUpdate: "",
    },
  },

  tabs: {
    // items: [
    //   {
    //     label: "Label 1",
    //     inputs: [
    //       {
    //         type: "select",
    //         name: "CurrencyCode",
    //         label: "Currency",
    //         required: true,
    //         disabled: false, // disCurrency.value
    //         api: {
    //           url: "api/currency/list",
    //           method: "Post",
    //           filter: {
    //             Status: [],
    //             UserType: [],
    //           },
    //         },
    //         pk: "Id",
    //         isNotAllowRemoteSelect: false,
    //         templateLeading: {},
    //         templateOption: {},
    //         template: (d) => {
    //           return {
    //             avatar: d.ImagePath,
    //             subtitle: d.ShortName,
    //             title: tBy({ en: d.EnglishName, km: d.Name }),
    //           };
    //         },
    //         mapData: (v) => {
    //           const list = [];
    //           v.filter((v) => {
    //             if (!v.IsBase) {
    //               list.push({
    //                 ...{ ImagePath: getCurrencyFlag(v.ShortName) },
    //                 ...v,
    //               });
    //             }
    //           });
    //           v.data = list;
    //         },
    //         title: tBy({ en: "EnglishName", km: "Name" }),
    //       },
    //       {
    //         type: "date",
    //         name: "Date",
    //         label: "Date",
    //         value: new Date(),
    //         required: true,
    //       },
    //     ],
    //   },
    //   {
    //     label: "Label 2",
    //     inputs: [
    //       [
    //         {
    //           type: "number",
    //           name: "ExchangeRate",
    //           label: "Exchange Rate",
    //           disabled: false,
    //           required: true,
    //           onInput: (v) => "",
    //           trailingIcon: "ri-money-dollar-circle-line",
    //           placeholder: "0",
    //           min: 0,
    //           schema: z
    //             .any()
    //             .refine((val) => val > 0 && val != null && val !== "", {
    //               message: "Exchange Rate must be greater than 0.",
    //             }),
    //         },
    //         {
    //           type: "textarea",
    //           name: "Description",
    //           label: "Description",
    //           disabled: false,
    //           required: false,
    //         },
    //       ],
    //     ],
    //   },
    // ],
    // onChange: (v) => { },
    // defaultIndex: 1,
    // orientation: "",
    // ui: "",
  },

  inputs: {
    type: Array,
    required: true,
    default: () => [
      // {
      //   type: "email", //optional
      //   name: "email",
      //   label: "Email", // optional
      //   // placeholder: '', // optional
      //   disabled: false, // optional
      //   required: false, // optional
      //   schema: "", // optional
      //   value: "", // optional in case draw input value to update
      // },
      // {
      //   type: "text",
      //   name: "text",
      //   label: "Text",
      //   // placeholder: '',
      //   disabled: false,
      //   required: false,
      //   schema: z.string().min(7, "Must be less than 7 characters"),
      // },
      // [
      //   {
      //     type: "phone",
      //     name: "phone",
      //     label: "Phone",
      //     // placeholder: '',
      //     disabled: false,
      //     required: false,
      //     schema: z.string().min(7, "Must be less than 7 characters"),
      //   },
      //   {
      //     type: "groupCheckbox",
      //     name: "groupCheckbox",
      //     label: "Group Checkbox",
      //     disabled: false,
      //     required: false,
      //     ui: "",
      //     options: [
      //       { value: "first", label: "First" },
      //       { value: "second", label: "Second" },
      //     ],
      //     // schema: z.string().min(7, 'Must be less than 7 characters')
      //   },
      // ],
      // {
      //   type: "checkbox",
      //   name: "checkbox",
      //   label: "",
      //   placeholder: "Checkbox",
      //   disabled: false,
      //   required: false,
      //   // schema: z.string().min(7, 'Must be less than 7 characters')
      // },
      // {
      //   type: "select",
      //   name: "CurrencyCode",
      //   label: "Currency",
      //   required: true,
      //   api: {
      //     url: "api/currency/list",
      //     method: "Post",
      //   },
      //   pk: "Id",
      //   isNotAllowRemoteSelect: false,
      //   templateLeading: {},
      //   templateOption: {},
      // },
      // {
      //   type: "radio",
      //   name: "radio",
      //   label: "Radio",
      //   disabled: false,
      //   required: false,
      //   options: [
      //     {
      //       value: "p1",
      //       label: "Option 1",
      //     },
      //     {
      //       value: "p2",
      //       label: "Option 2",
      //     },
      //     {
      //       value: "p3",
      //       label: "Option 3",
      //     },
      //   ],
      //   // schema: z.string().min(7, 'Must be less than 7 characters')
      // },
    ],
  },
});

const form = computed(() => props.form);
const inputs = computed(() => props.inputs);
const tabs = computed(() => props.tabs);
const loading = ref(false);
const flatInput = computed(() =>
  isNotEmpty(tabs.value?.items)
    ? tabs.value.items.flatMap((item) => item.inputs.flat())
    : inputs.value
);
let initialVal = mapInput(flatInput.value);

function mapInput(inputs) {
  return inputs.reduce((acc, i) => {
    Array.isArray(i)
      ? i.forEach((j) => {
        if (j.type == "time") {
          acc[j.name] = isEmpty(j.value)
            ? new Date()
            : ocStrTimeToDate(j.value);
        } else {
          acc[j.name] = j.value;
        }
      })
      : i.type == "time"
        ? (acc[i.name] = isEmpty(i.value) ? new Date() : ocStrTimeToDate(i.value))
        : (acc[i.name] = i.value);
    return acc;
  }, {});
}

let state = reactive(copyWith(initialVal));
watch(
  dataUpdate,
  (n, o) => {
    if (isEmpty(n)) return;
    let newObj = {};
    for (const key in n) {
      if (n.hasOwnProperty(key)) {
        let inp = inputs.value.find((v) => v.name == key);
        let checkSelect = isNotEmpty(inp) ? inp.type == "select" : false;
        let checkDate = isNotEmpty(inp) ? inp.type == "date" : false;
        let checkTime = isNotEmpty(inp) ? inp.type == "time" : false;
        let val = n[key];
        if (!checkSelect) newObj[key] = val;
        if (checkDate) newObj[key] = new Date(val);
        if (checkTime) newObj[key] = ocStrTimeToDate(val);
      }
    }
    initialVal = copyWith(newObj);
    Object.assign(state, newObj);
  },
  { deep: true, immediate: true }
);

const schemaObj = mapInputSchema(
  isNotEmpty(tabs.value?.items)
    ? tabs.value.items.flatMap((item) => item.inputs.flat())
    : inputs.value
);

function mapInputSchema(input) {
  return input.reduce((acc, i) => {
    Array.isArray(i)
      ? i
        .filter((v) => v.required || isNotEmpty(v.schema))
        .forEach((j) => {
          acc[j.name] = isNotEmpty(j.schema)
            ? j.schema
            : defaultSchema(j.type, j.label);
        })
      : i.required || isNotEmpty(i.schema)
        ? (acc[i.name] = isNotEmpty(i.schema)
          ? i.schema
          : defaultSchema(i.type, i.label))
        : "";
    return acc;
  }, {});
}

function defaultSchema(type, label) {
  const msg = `This field is required`;
  return (
    {
      text: z.string({ required_error: msg }).trim().min(1, msg),
      email: z
        .string({})
        .optional()
        .refine(
          (value) => !value || z.string().email().safeParse(value).success,
          {
            message: "Invalid email",
          }
        ),
      number: z.any().refine((val) => val != null && val !== "" && val > 0, {
        message: `${label} must be more than 0`,
      }),
      phone: z
        .string({ required_error: msg })
        .min(1, msg)
        .refine(
          (phone1) => {
            const khmerPhoneRegex = /^(0\d{8,9}|\+855\d{8,9})$/;
            return khmerPhoneRegex.test(phone1);
          },
          { message: "Invalid phone number format" }
        ),
      website: z
        .string({})
        .optional()
        .refine(
          (value) => {
            if (!value) return true;
            const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-]*)*$/i;
            return urlRegex.test(value);
          },
          {
            message: "Invalid website URL",
          }
        ),

      checkbox: z.boolean({ required_error: msg }),

      radio: z.string().min(1, msg),

      date: z
        .date({ required_error: msg })
        .refine((val) => !isNaN(val), { message: "Invalid date" }),

      // time: z
      //   .date({ required_error: msg })
      //   .refine((val) => !isNaN(val), { message: "Invalid time" }),

      color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, {
        message: "Invalid hex color format",
      }),
    }[type] ||
    z.any().refine((val) => val != null && val !== "", { message: msg })
  );
}
const schema = z.object(schemaObj);

function resolveApiConfig(config) {
  return typeof config === "object"
    ? {
      url: config.url,
      method: isNotEmpty(config.method) ? config.method : "POST",
    }
    : { url: config, method: "POST" };
}

async function onSubmitModal() {
  if (isEmpty(form.value.api?.create) && isEmpty(form.value.api?.update)) {
    emit("onSubmitted", stateToServer(state));
    clearForm();
    return;
  }

  const url = form.value.api;
  const { url: apiCreate, method: methodCreate } = resolveApiConfig(url.create);
  const { url: apiUpdate, method: methodUpdate } = resolveApiConfig(url.update);
  const { url: apiClone, method: methodClone } = resolveApiConfig(url.clone);
  loading.value = true;
  emit("onLoading", true);
  try {
    if (isUpdate.value) {
      emit("onSubmitted", state);
      if (isNotEmpty(form.value.isClone) && form.value.isClone) {
        const { data, error } = await useHttp(apiClone, {
          method: methodClone,
          data: stateToServer(state),
        });
        if (error.value) {
          throw error.value;
        }

        if (data.value) {
          handleSuccess(data.value);
        }
      } else {
        confirm.show({
          type: "update",
          message: isNotEmpty(form.value.confirmUpdate)
            ? form.value.confirmUpdate
            : t("do_you_want_to_update"),
          onConfirm: async () => {
            const { data, error } = await useHttp(
              isUpdate.value ? apiUpdate : apiCreate,
              {
                method: isUpdate.value ? methodUpdate : methodCreate,
                data: stateToServer(state),
              }
            );
            if (error.value) {
              throw error.value;
            }

            if (data.value) {
              handleSuccess(data.value);
            }
          },
        });
      }
    } else {
      emit("onSubmitted", state);
      const { data, error } = await useHttp(
        isUpdate.value ? apiUpdate : apiCreate,
        {
          method: isUpdate.value ? methodUpdate : methodCreate,
          data: stateToServer(state),
        }
      );
      if (error.value) {
        throw error.value;
      }

      if (data.value) {
        handleSuccess(data.value);
      }
    }
  } catch (err) {
    handleError(err);
  } finally {
    loading.value = false;
    emit("onLoading", false);
  }
}

function handleError(error) {
  // if (form.value.showErrorMassage) {
  // }
  toast.add({
    color: "red",
    title: `${error.Message}`,
  });
  emit("onError", error);
}

function handleSuccess(data) {
  if (form.value.showSuccessMessage) {
    toast.add({
      color: "green",
      title: "Successfully",
    });
  }
  clearForm();
  emit("onSuccess", data);
}

function onFormError(v) {
  const error = v.errors[0];
  findTabIndex(error.path);
}

function findTabIndex(name) {
  if (isEmpty(tabs.value)) return;
  tabs.value.items.forEach((v, i) => {
    const hasElements = v.inputs.some((input) => input.name === name);
    if (hasElements) {
      refTabs.value.jumpTo(i);
    }
  });
}

function stateToServer(s) {
  const state = copyWith(s);

  flatInput.value.forEach((v) => {
    console.log(v.type)
    if (v.type == "time") {
      console.log(v.name, state[v.name])
      state[v.name] = ocdate(state[v.name]).format("HH:mm:ss"); // format HH:MM is wrong format because it is 24 hours (00:04) : 04 is never change H:mm:ss is sent to server with 17:33:00 is correct//Change by RTY
    }
  });

  let newState = {};
  for (const key in state) {
    if (state.hasOwnProperty(key)) {
      let val = state[key];

      /// type array
      if (Array.isArray(val)) {
        newState[key] = val.map((v) => (typeof v == "object" ? v[key] : v));
      }

      // type Date
      else if (isValidDate(val)) {
        val = new Date(val);
        newState[key] = ocdate(val).format("MM-dd-yyyy");
      }

      /// type obj
      else if (typeof val === "object" && !Array.isArray(val)) {
        const checkKey = filterInput(key);

        if (isNotEmpty(checkKey) && isNotEmpty(val))
          isNotEmpty(checkKey.pk)
            ? (newState[key] = val[checkKey.pk])
            : (newState[key] = val[key]);
      }

      /// default
      else {
        newState[key] = val;
      }
    }
  }
  return newState;
}

function filterInput(key) {
  let res;
  for (const i of inputs.value) {
    if (Array.isArray(i)) {
      const result = i.filter((v) => v.name === key);
      if (isNotEmpty(result)) {
        res = result[0];
        break;
      }
    } else {
      if (i.name === key) {
        res = i;
        break;
      }
    }
  }
  return res;
}

function isValidDate(value) {
  return typeof value === "object" && !isNaN(Date.parse(value));
}

function resetForm() {
  Object.assign(state, initialVal);
  refForm.value.clearValidate();
  if (isNotEmpty(tabs.value))
    refTabs.value.jumpTo(isNotEmpty(tabs.defaultIndex) ? tabs.defaultIndex : 0);
}

function clearForm() {
  for (const key in state) {
    if (state.hasOwnProperty(key)) {
      state[key] = "";
    }
  }
  dataUpdate.value = {};
  refForm.value.clearValidate();
  emit("onCancel", true);
}

function conditionShowBtn(v) {
  return v === undefined || v === null || v === "" ? true : v;
}

mounted(() => { });
onUnmounted(() => {
  dataUpdate.value = {};
});
</script>

<style lang="scss" scoped></style>
