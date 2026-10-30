<template>
  <Teleport to="body">
  <Transition name="r-confirm">
    <div v-if="!!confirmStore.data" class="r-confirm">
      <!-- persistent=true means overlay click must NOT close the dialog -->
      <div class="r-confirm__overlay" @click="!confirmStore.data?.persistent && confirmStore.hide()" />
      <div class="r-confirm__wrapper">
        <div class="r-confirm__card">

          <!-- Icon -->
          <!-- <div
            class="r-confirm__icon"
            :class="typeClasses.iconBg"
          >
            <i
              :class="[typeIcon, typeClasses.iconText]"
              class="r-confirm__icon-svg"
            />
          </div> -->
          <!-- <span class="text-2xl font-semibold text-[var(--txt-primary)]">{{ tr('common.confirm') }}</span> -->

          <!-- Warning -->
          <div
            v-if="type === 'delete'"
            class="r-confirm__warning"
          >
            <i class="ri-error-warning-fill" />

            <!-- <h4 v-if="description && type === 'delete'" >{{ description }}</h4> -->
            <div v-if="type === 'delete'">
              <h4>{{ tBy({en:'This action cannot be undone', km:'សកម្មភាពនេះមិនអាចបកប្រែវិញបានទេ' }) }}</h4>
              <p>
                {{ tBy({en:'Deleting this record will permanently remove all associated data.',
                  km:'ការលុបបំបាត់កំណត់ត្រានេះនឹងលុបចោលទាំងស្រុងនូវទិន្នន័យទាំងអស់ដែលទាក់ង។'
                }) }}
              </p>
            </div>
          </div>

          <!-- Content -->
          <div class="r-confirm__content">
            <h3 v-if="title" v-html="$t(`${type}`)  ?? title" class="r-confirm__title"> </h3>
            <!-- <div class="sub-text" v-html="message"></div> -->
            <p v-if="message" v-html="message ?? title" class="r-confirm__description"> </p>
            <p v-if="description" v-html="description" class="r-confirm__description"> </p>
          </div>

          <!-- Actions -->
          <div class="r-confirm__actions">
            <RBtn type="cancel" :label="$t('cancel')" size="s" variant="solid" :noIcon="true" :disabled="confirmStore.loading"  @click="onCancel"/>
            <RBtn :type="type" :icon="type" :label="labelBtnConfirm" size="s" :variant="confirmStore.loading ? 'ghost' : 'solid'" :noIcon="!confirmStore.loading" :loading="confirmStore.loading" @click="onConfirm" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
  </Teleport>
  <!--
EX
const confirm = useConfirmStore()
confirm.show({
  type:'confirm',
  title:'Confirm',
  message:'Do you want to update?',
  onConfirm: async ()=>{
    console.log('confirm')
  },
  onCancel:async ()=>{
    await console.log('cancel') //for using with api
  }
}) 
-->
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useConfirmStore } from '../../stores/confirm'
const { tr } = useTr()
const confirmStore = useConfirmStore();

// const isOpen = computed(() => !!confirmStore.data);
const isOpen = computed({
  get: () => !!confirmStore.data,
  set: (value) => {
    if (!value) {
      confirmStore.hide()
    }
  }
})

// const title = computed(() => confirmStore.data?.title ?? "");
// const description = computed(() => confirmStore.data?.description ?? "");
// const confirmText = computed(() => confirmStore.data?.confirmText ?? "Confirm");
// const cancelText = computed(() => confirmStore.data?.cancelText ?? "Cancel");
// const type = computed(() => confirmStore.data?.type ?? "confirm");
const { t } = useI18n()
const toast = useToast();
const type = ref("");
const title = ref("");
const message = ref("");
const labelBtnConfirm = ref("");
const description = ref("");

const noIcon = ref(true);
const loading = ref(false);

watch(
  () => confirmStore.data,
  () => {
    if (confirmStore.data) {
      confirmStore.data.type != undefined
        ? (type.value = confirmStore.data.type)
        : (type.value = "delete"); // if user does't pass type when call store
      if (
        confirmStore.data.type == "delete" ||
        confirmStore.data.type == undefined ||
        confirmStore.data.type == ""
      ) {
        title.value = t("confirm");
        message.value = t("do_you_want_to_delete");
        labelBtnConfirm.value = t("delete");
        description.value = "";
      }
      if (confirmStore.data.type == "save") {
        title.value = t("confirm");
        message.value = t("do_you_want_to_save");
        labelBtnConfirm.value = t("save");
        description.value = "";
      }
      if (confirmStore.data.type == "update") {
        title.value = t("confirm");
        message.value = t("do_you_want_to_update");
        labelBtnConfirm.value = t("update");
        description.value = "";
      }
      if (confirmStore.data.type == "confirm") {
        type.value = "save";
        labelBtnConfirm.value = t("ok");
        description.value = "";
      }
      if (confirmStore.data.type == "warning") {
        type.value = "print";
        labelBtnConfirm.value = t("ok");
        description.value = "";
      }
      if (confirmStore.data.type == "view") {
        type.value = "view";
        labelBtnConfirm.value = t("ok");
        description.value = "";
      }
      if (confirmStore.data.type == "create") {
        type.value = "create";
        labelBtnConfirm.value = t("create");
        description.value = "";
      }
      if (confirmStore.data.type == "update") {
        type.value = "update";
        labelBtnConfirm.value = t("update");
        description.value = "";
      }
      if (confirmStore.data.type == "info") {
        type.value = "info";
        labelBtnConfirm.value = t("ok");
        description.value = "";
      }
      if (confirmStore.data.type == "custom") {
        type.value = "custom";
        labelBtnConfirm.value = t("ok");
        description.value = "";
      }

      if (confirmStore.data.title ?? "" != "") title.value = confirmStore.data.title;
      if (confirmStore.data.message ?? "" != "") message.value = confirmStore.data.message;
      if (confirmStore.data.description ?? "" != "") description.value = confirmStore.data.description;
      if (confirmStore.data.labelBtn ?? "" != "") labelBtnConfirm.value = confirmStore.data.labelBtn;
    }
  }
);


watch(
  () => confirmStore.loading,
  (n) => {
    if (confirmStore.loading === false) {
      confirmStore.hide();
    }
  }
);
// watch(
//   () => confirmStore.data,
//   (val) => {
//     console.log("confirmStore.data changed:", val);
//   },
//   { deep: true }
// );

// watch(
//   () => confirmStore.loading,
//   (val) => {
//     console.log("loading changed:", val);
//   }
// );

async function onConfirm() {
  confirmStore.setLoading(true);

  if (confirmStore.data && typeof confirmStore.data.onConfirm === "function") {
    Promise.resolve(confirmStore.data.onConfirm())
      .then(() => {
        confirmStore.setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        toast.add({title: error.Message, color: 'red' });
        confirmStore.setLoading(false);
      });
  } else {
    // If confirmStore.data or confirmStore.data.onConfirm is undefined, handle accordingly
    confirmStore.setLoading(false);
  }
}

// close only on success (no auto close)
async function onConfirm1() {
  if (confirmStore.loading) return;

  confirmStore.setLoading(true);

  try {
    await confirmStore.data?.onConfirm?.();

    // Close only after success
    confirmStore.hide();
  } catch (error) {
    console.error(error);

    toast.add({
      title: error?.message || 'Error',
      color: 'red'
    });
  } finally {
    confirmStore.setLoading(false);
  }
}
// Dynamic icon based on confirm type using RemixIcon
const typeConfig = {
  success: { icon: "ri-checkbox-circle-fill", color: "green" },
  warning: { icon: "ri-error-warning-fill", color: "yellow" },
  error: { icon: "ri-close-circle-fill", color: "red" },
  create: { icon: "ri-add-circle-fill", color: "green" },
  update: { icon: "ri-edit-circle-fill", color: "blue" },
  delete: { icon: "ri-delete-bin-fill", color: "red" },
  confirm: { icon: "ri-question-fill", color: "blue" },
  view: { icon: "ri-eye-fill", color: "indigo" },
  info: { icon: "ri-information-fill", color: "blue" },
  print: { icon: "ri-printer-fill", color: "blue" },
  ok: { icon: "ri-check-fill", color: "blue" },
  cancel: { icon: "ri-close-fill", color: "red" },
  save: { icon: "ri-save-line", color: "blue" },
  custom: { icon: "ri-information-fill", color: "blue" },
};

const currentType = computed(
  () => typeConfig[type.value] ?? typeConfig.confirm
);

const typeIcon = computed(() => currentType.value.icon);
const colorMap = {
  green: {
    button:
      "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    iconBg: "bg-green-100",
    iconText: "text-green-600",
  },

  yellow: {
    button:
      "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    iconBg: "bg-yellow-100",
    iconText: "text-yellow-600",
  },

  red: {
    button:
      "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    iconBg: "bg-red-100",
    iconText: "text-red-600",
  },

  blue: {
    button:
      "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
  },

  indigo: {
    button:
      "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
  },
};

const typeClasses = computed(() => {
  const color = currentType.value.color

  return colorMap[color] ?? colorMap.blue
})


// Dynamic classes based on confirm type
const typeClasses1 = computed(() => {
  const base = {
    confirmButton: '',
    iconBg: '',
    iconText: ''
  };

  switch (type.value) {
    case 'success':
      return {
        ...base,
        confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        iconBg: 'bg-green-100',
        iconText: 'text-green-600'
      };
    case 'warning':
      return {
        ...base,
        confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        iconBg: 'bg-yellow-100',
        iconText: 'text-yellow-600'
      };
    case 'error':
      return {
        ...base,
        confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600'
      };
    default: // info
      return {
        ...base,
        confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600'
      };
  }
});
async function onCancel() {
  if (confirmStore.data.onCancel) await confirmStore.data?.onCancel();
  confirmStore.hide();
}

</script>

<style lang="scss" scoped>
.r-confirm {
  position: fixed;
  inset: 0;
  z-index: 2147483647;

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.55);
    backdrop-filter: blur(3px);
  }

  &__wrapper {
    position: relative;
    // z-index: 1;

    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 100vh;
    padding: 1rem;
  }

  &__card {
    width: 100%;
    max-width: 460px;
    z-index: 1;

    background: var(--bg-c-card);
    color: var(--c-text);
    border-radius: 1rem;
    padding: 1.5rem;

    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
    // box-shadow: 0 25px 50px -12px rgb(0 0 0 / 25%);

    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__icon {
    width: 56px;
    height: 56px;

    margin-inline: auto;

    border-radius: 999px;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon-svg {
    font-size: 1.75rem;
  }

  &__content {
    text-align: center;
  }

  &__title {
    font-family: var(--font-400);
    font-size: 1.125rem;
    font-weight: 900;
    color: var(--c-text);
  }

  &__description {
    font-family: var(--font-400);
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--c-muted);
    line-height: 1.5;
  }

  &__warning {
    display: flex;
    gap: 0.75rem;

    padding: 1rem;

    border: 1px solid var(--c-border);
    background: var(--c-surface);
    border-radius: 0.75rem;

    i {
      font-size: 1.125rem;
      color: #dc2626;
      flex-shrink: 0;
    }

    h4 {
      font-family: var(--font-400);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--r-c-red, #991b1b);
    }

    p {
      font-family: var(--font-400);
      margin-top: 0.25rem;
      font-size: 0.8125rem;
      color: var(--color-w-b-3, #b91c1c);
      line-height: 1.5;
    }
  }

  &__actions {
    display: flex;
    flex-direction: row;
    gap: 0.50rem;
    align-items: end;
    justify-content: end;
    white-space: nowrap !important;
  }

  &__btn {
    flex: 1;

    &--cancel {
      background: white;
    }
  }
}

.r-confirm__description{
  font-family: var(--font-400);
}
/* Color Variants */
.bg-green {
  background: #dcfce7;
}
.text-green {
  color: #16a34a;
}

.bg-red {
  background: #fee2e2;
}
.text-red {
  color: #dc2626;
}

.bg-yellow {
  background: #fef9c3;
}
.text-yellow {
  color: #ca8a04;
}

.bg-blue {
  background: #dbeafe;
}
.text-blue {
  color: #2563eb;
}

.bg-indigo {
  background: #e0e7ff;
}
.text-indigo {
  color: #4f46e5;
}

/* Animation */
.r-confirm-enter-active,
.r-confirm-leave-active {
  transition: all 0.2s ease;
}

.r-confirm-enter-from,
.r-confirm-leave-to {
  opacity: 0;

  .r-confirm__card {
    transform: scale(0.95);
  }
}
</style>


<!-- 
Usage

Normal confirmation:

confirmStore.show({
  type: "confirm",
  title: "Confirm Action",
  description: "Do you want to continue?",
});

Delete confirmation:

confirmStore.show({
  type: "delete",
  title: "Delete Academic Setting",
  description:
    "Are you sure you want to delete this academic setting?",
});

Create:

const confirmStore = useConfirmStore()
confirmStore.show({
  type: "create",
  title: "Create Academic Setting",
  description:
    "Do you want to create this academic setting?",
}); -->