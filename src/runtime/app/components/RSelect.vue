<template>
        <!-- :search-input="props.localData?.keySearch" -->

  <div ref="refOCSelect" class="r-custom-select"
    :class="[variant, props.disabled ? 'disabled' : '', (multiple && selected?.length > 0) ? 'have-selected-value' : '']">
    <USelectMenu ref="refSelctMenu" v-model="selected"  v-model:open="isOpen" v-model:query="query" :ui="ui" selected-icon="i-lucide-flame" trailingIcon="ri-arrow-down-s-line" class="r-select-menu-base" :arrow="arrow"
      :loading="isLoading" loading-icon="i-lucide-loader" :placeholder="props.placeholder ? props.placeholder : $t('select')" :items="listData" @update:open="onOpen" 
      :searchInput="isNotEmpty(props.api)
        ? props.searchInput ?? true
          ? fnSearch
          : false
        : props.searchInput ?? true
        " 
        :clear-search-on-close="true" trailing :required="true" :leadingIcon="leadingIcon"
      size="md" :disabled="props.disabled ?? false" :multiple="multiple" :by="pk" @update:modelValue="fnSelect" :class="fullWidth ? 'w-full' : 'w-[11/12]'">
      <template #default="{ modelValue,open,ui }" v-if="!multiple">
        <slot name="iconLeading" v-if="$slots.iconLeading" />
        <slot v-if="$slots.leading && isNotEmpty(modelValue) && !modelValue.isDefault" name="leading" :data="modelValue" />
        <RTruncatedText :text="tBy({ en: modelValue.NameEnglish, km: modelValue.Name })" class="truncated-select text-[13px] color-w-b-1 flex-1 w-full text-left"
          v-else-if="isNotEmpty(modelValue) && !modelValue.isDefault && isEmpty(templateLeading?.labelKey || templateLeading?.labelKeyEn)" />
        <!-- <div v-else-if="isNotEmpty(modelValue) && !modelValue.isDefault && isEmpty(templateLeading?.labelKey || templateLeading?.labelKeyEn)"  class="flex-1 min-w-0">
          <RTruncatedText :text="$tBy({ en: modelValue.NameEnglish, km: modelValue.Name })" class="text-[13px] color-w-b-1" />
          </div> -->
        <RProfileInfo size="2xs" border="s" :src="modelValue[templateLeading.imagePath]"
          :errorType="templateLeading.imageType" :gender="modelValue[templateLeading?.gender]"
          v-else-if="isNotEmpty(modelValue) && !modelValue.isDefault && isNotEmpty(templateLeading) && isNotEmpty(templateLeading?.imagePath)">
          <template #title>
            <RTruncatedText :text="fnGenerateTextLabel(modelValue, templateLeading)" />
          </template>
        </RProfileInfo>

        <RViewInfo
          v-else-if="isNotEmpty(modelValue) && !modelValue.isDefault && isNotEmpty(templateLeading) && isEmpty(templateLeading?.imagePath)">
          <template #title>
            <RTruncatedText :text="fnGenerateTextLabel(modelValue, templateLeading)" />
          </template>
        </RViewInfo>

        <div v-else :class="[colorPlaceholder ? 'text-[--color-primary]' : 'opacity-[0.6] text-[12px]', 'line-clamp-1']">
          {{ placeholder ? placeholder : $t("please_select") }}
        </div>
      </template>

      <template #default="{ modelValue }" v-else>
        <slot name="iconLeading" v-if="$slots.iconLeading"></slot>
        <div v-if="selected?.length" class="nav-multiple-select">
          <div class="item" v-for="(item, index) in generateSelect(modelValue)" :key="index">
          <!-- <div class="item" v-for="(item, index) in generateSelect(modelValue?.selected)" :key="index"> -->

            <span v-if="$slots.leading && !(item?.isSelectAll || item?.isDefault)">
              <slot name="leading" :data="item"></slot>
            </span>

            <RTruncatedText :text="$tBy({ en: item.NameEnglish, km: item.Name })" class="text-[13px] color-w-b-1"
              v-else-if="!$slots.leading && isEmpty(templateLeading?.labelKey || templateLeading?.labelKeyEn)" />

            <RProfileInfo size="2xs" border="s" :src="item[templateLeading.imagePath]"
              :errorType="templateLeading.imageType" :gender="item[templateLeading?.gender]"
              v-else-if="!$slots.leading && isNotEmpty(templateLeading) && isNotEmpty(templateLeading?.imagePath)">
              <template #title>
                <RTruncatedText :text="fnGenerateTextLabel(item, templateLeading)" />
              </template>
            </RProfileInfo>

            <RViewInfo
              v-else-if="!$slots.leading && isNotEmpty(templateLeading) && isEmpty(templateLeading?.imagePath)">
              <template #title>
                <RTruncatedText :text="fnGenerateTextLabel(item, templateLeading)" />
              </template>
            </RViewInfo>

            <i v-if="!(item?.isSelectAll || item?.isDefault)" class="ri-close-circle-fill"
              @click.stop="fnRemoveMultiple(item)"></i>
          </div>
        </div>
        <div v-else :class="[colorPlaceholder ? 'text-[--color-primary]' : 'opacity-[0.6] text-[12px] ', 'line-clamp-1']">
          {{ placeholder ? placeholder : $t("please_select") }}
        </div>
      </template>

      <template #item="{ item,selected,index,ui }">
        <div v-if="multiple && item?.isSelectAll" class="select-clear-container">
          {{ locale == "km" ? "---ជ្រើសរើសទាំងអស់---" : "---Select All---" }}
        </div>

        <div v-if="multiple && item?.isDefault" class="select-clear-container">
          {{ locale == "km" ? "---សម្អាត---" : "---Clear Selected---" }}
        </div>

        <div v-if="!multiple && item?.isDefault"
          :class="[colorPlaceholder ? '' : 'opacity-[0.6] text-[12px]', 'flex items-center py-2 px-3.5 !w-full']">
          <span v-if="colorPlaceholder" class="p-3">{{
            locale == "km" ? "ទាំងអស់" : "All"
          }}</span>
          <span v-else-if="clearSelect">{{
            locale == "km" ? "---សម្អាត---" : "---Clear Selected---"
          }}</span>
        </div>

        <div v-if="$slots.option && !(item?.isDefault || item?.isSelectAll)"
          class="flex items-center py-2 px-3.5 !w-full">
          <slot name="option" :data="item"></slot>
        </div>

        <div v-else-if="!$slots.option && isEmpty(templateOption?.labelKey || templateOption?.labelKeyEn)"
          class="text-[13px] color-w-b-1 py-2 px-3.5">
          {{ tBy({ en: item.NameEnglish, km: item.Name }) }}
        </div>

        <div v-else-if="!$slots.option && isNotEmpty(templateOption) && !item?.isSelectAll && !item?.isDefault"
          class="flex items-center py-2 px-3.5 !w-full">
          <RProfileInfo v-if="isNotEmpty(templateOption?.imagePath)" size="2xs" border="s"
            :src="item[templateOption.imagePath]" :errorType="templateOption.imageType"
            :subTitle="fnGenerateTextSubLabel(item, templateOption)" :gender="item[templateOption?.gender]">
            <template #title>
              {{ fnGenerateTextLabel(item, templateOption) }}
            </template>
          </RProfileInfo>

          <RViewInfo v-else :subTitle="fnGenerateTextSubLabel(item, templateOption)">
            <template #title>
              {{ fnGenerateTextLabel(item, templateOption) }}
            </template>
          </RViewInfo>
        </div>
      </template>
      <template #trailing="{ item}">
        <button
          v-if="hasValue"
          type="button"
          class="r-select-clear"
          @click.stop="clear"
        >
          <i class="ri-close-circle-fill" />
        </button>

        <UIcon
          v-else
          name="ri-arrow-down-s-line"
          :class="[
            'r-select-arrow',
            { 'r-select-arrow--open': isOpen }
          ]"
        />
      </template>
      <!-- <template #empty>
        <button
          v-if="hasValue"
          type="button"
          class="r-select-clear"
          @click.stop="clear"
        >
          <i class="ri-close-circle-fill" />
        </button>

        <UIcon
          v-else
          name="ri-arrow-down-s-line"
          class="r-select-arrow"
        />
      </template> -->
    </USelectMenu>
  </div>
</template>

<script setup>
import _ from "lodash-es";
import RProfileInfo from './RProfileInfo.vue'
import RViewInfo from './RViewInfo.vue'
import RTruncatedText from './RTruncatedText.vue'
function generateSelect(select) {
  if (isNotEmpty(select) || isNotEmpty(selected.value)) {
    const data = isNotEmpty(select) ? select : selected.value
    return data?.filter(e => !(e?.isDefault || e?.isSelectAll))
  }

  return []
}
const { t, locale } = useI18n();

//variable
const selected = defineModel({ default: undefined }); // required : if single select  of object but multiple of array required

const props = defineProps([
  "required",
  "localData",
  "api",
  "isNotAllowClear",
  "defaultSelect",
  "multiple",
  "selectIfOne",
  "searchInput",
  "disabled",
  "specificProp",
  "variant",
  "class",
  "placeholder",
  "selectType",
  "colorPlaceholder",
  "recordCountPropotyName",
  "clearSelect",
  'pk',
  'templateLeading',
  'templateOption',
  'isNotAllowRemoteSelect',
  'leadingIcon',
  'fullWidth',
  'arrow'
]);
const emit = defineEmits("selected", "mapData", "onSearch",'onOpen');
const localData = computed(() => props.localData);
const selectType = computed(() => props.selectType || "");
const required = computed(() => isNotEmpty(props.required));
// const hasSelectAll = computed(() => isNotEmpty(props.hasSelectAll));
const pk = computed(() => isNotEmpty(props.pk) ? props.pk : null);
const variant = computed(() => props.variant ?? "outline"); // Ex: variant = solid,outline,none
const placeholder = computed(() => props.placeholder ?? null);
const colorPlaceholder = computed(() => props.colorPlaceholder ?? false);
const fullWidth = computed(() => props.fullWidth ?? false);
const arrow = computed(() => props.arrow ?? true);
const recordCountPropotyName = computed(
  () => props.recordCountPropotyName ?? false
);
const clearSelect = computed(() => props.clearSelect ?? true);
const isOpen = ref(false)
const listData = ref([]);
const query = ref();
// const isLoading = ref(false);
const isLoading = defineModel("loading", { default: false });
const refOCSelect = ref();
const refSelctMenu = ref();
const totalRecord = ref();
const pages = ref(1);
const customFilter = computed(() => props.api?.filter ?? {});
// const nClass = computed(() => props?.class ?? "");
const defaultSelect = computed(
  () => props.defaultSelect === "" || (props.defaultSelect ?? false)
);
const selectIfOne = computed(
  () => props.selectIfOne === "" || (props.selectIfOne ?? false)
);
const apiUrl = computed(() => props.api?.url ?? ""); //sinh
const multiple = computed(() => props.multiple)
const templateLeading = computed(() => {
  const defautLeading = {
    valueKey:'',
    labelKey: '',
    labelKeyEn: '',
    imagePath: '',
    imageType: 'user',
    gender: '',
  }
  return { ...defautLeading, ...props.templateLeading }
})
const templateOption = computed(() => {
  const defautOption = {
    labelKey: '',
    labelKeyEn: '',
    subLabelKey: '',
    subLabelKeyEn: '',
    imagePath: '',
    imageType: 'user',
    gender: '',
  }
  return { ...defautOption, ...props.templateOption }
})

const isNotAllowRemoteSelect = computed(() => isNotEmpty(props.isNotAllowRemoteSelect))
// const multiple = computed(
//   () => props.multiple === "" || (props.multiple ?? false)
// );

onBeforeMount(() => {
  if (!multiple.value && typeof selected.value === 'object' && isEmpty(selected.value)) {
    // console.log(multiple.value, typeof selected.value, '===>>>', selected.value)
    selected.value = undefined
  }
})

// * props
//  - api = {
//            url:'',
//            method:'',
//            where:'', if data from api of obj. but we need from where property ex: where:'List'
//            filter:{} this object will do filter in api
//          }
//  - localData = {
//            data:[],
//            keySearch:[], ex: ['Name','NameEnglish']
//          }

// * Function
// + remoteSelect
// - 1: if select by api this object pass of property which has on model filter in api.
// ex: ref_Element.remoteSelect({Id:1})
// - 2: if select by exist data which we select by property.
// ex: ref_Element.remoteSelect({pk:'Code', Code:'0001'})
// ex: ref_Element.remoteSelect({pk:'Code', Code:['0001','0002']})
// + reload
// - 1: this function for reload list
// ex: ref_Element.reload()

const hasValue = computed(() => {
  if (props.multiple) {
    return Array.isArray(selected.value) && selected.value.length > 0
  }

  return selected.value != null &&
         selected.value !== '' &&
         !selected.value?.isDefault
})

mounted(async () => {
  // console.log(selected.value, 'mounted select >>>', pk.value)
  // console.log('variant : ', variant.value)
  // if(refSelctMenu.value){
  //   console.log('===>>>',refSelctMenu.value)
  //   refSelctMenu.value?.onUpdate((val)=>{
  //     console.log('---->> select >>',val)
  //     emit("selected", selected.value)
  //   })
  // }
  if (isNotEmpty(props.api)) {
    listData.value = await getData({ Pages: 1, Records: 10 });
    const index = listData.value?.length - 1
    totalRecord.value = recordCountPropotyName.value
      ? listData.value[index]?.recordCountPropotyName.value
      : isNotEmpty(listData.value[index]?.RecordCounts)
        ? listData.value[index]?.RecordCounts
        : listData.value[index]?.RecordCount;
    if (props.searchInput ?? true) query.value = " ";
    fnBindScroll();
  } else {
    listData.value = [...(localData.value?.data ?? [])];
    emit("mapData", listData.value);

    // add item clear when hes props required
    if (!required.value && !multiple.value) {
      if (!props.isNotAllowClear) listData.value.unshift({ ...{ [pk.value]: "" }, isDefault: true }); // add for first only
    }
  }

  // select value default first value
  if (defaultSelect.value && isNotEmpty(listData.value)) {
    if (required.value || multiple.value) {
      // console.log(listData.value.filter((s) => s.IsCurrent));
      selected.value = !multiple.value
        ? selectType.value == "academicYear"
          ? listData.value.filter((s) => s.IsCurrent).length > 0
            ? listData.value.filter((s) => s.IsCurrent)[0]
            : listData.value[0]
          : listData.value[0]
        : [listData.value[0]];
    } else {
      if (isNotEmpty(props.specificProp)) {
        selected.value = listData.value.filter(
          (val) => val[props.specificProp]
        )[0];
      } else {
        selected.value = listData.value[1];
      }
    }
  }
  await fnSelectIfOne();
  // $(".i-heroicons:chevron-down-20-solid").parent().css("padding", "unset"); /// Override drop down style
});

// onUnmounted(()=>{
//   selected.value = undefined
// })
function onOpen() {
  emit('onOpen',selected.value)
}
function fnSetSelected(data) {
  refSelctMenu.value?.onUpdate(copyWith(data))
}

function fnSelect(s) {
  if (isNotEmpty(s) && !_.isEqual(s, selected.value)) {
    emit('selected', s)
    // console.log('===>> selected >>>', copyWith(s))

    if (multiple.value) {

      if (s?.some(e => e.isSelectAll)) {
        // console.log('isSelectAll >>', s?.some(e => e.isSelectAll))
        fnSetSelected(listData.value?.filter(e => !(e.isSelectAll || e.isDefault)))
      }

      if (s?.some(e => e.isDefault)) {
        fnSetSelected([])
        // console.log([], 'isDefault >>', s?.some(e => e.isDefault))
      }
    } else {
      if (s?.isDefault) selected.value = { ...{ [pk.value]: "" }, isDefault: true }
    }

    // console.log(copyWith(selected.value), '--- fnSelect >>>', copyWith(s))
  }

  if (isEmpty(s)) {
    if (multiple.value) {
      s = []
    } else {
      if (!required.value && !props.isNotAllowClear) {
       s = { ...{ [pk.value]: "" }, isDefault: true }  // add for first only
      }
    }
    // console.log('no data >>>', s)
    emit('selected', s)
  }
}


function fnRemoveMultiple(item) {
  fnSetSelected(selected.value?.filter(e => e[pk.value] != item[pk.value]))
}

// async function fnClearAll(e) {
//   e.preventDefault();
//   e.stopPropagation();
//   // fnSetSelected([])
// }

// async function fnSelectAll(e) {
//   e.preventDefault();
//   e.stopPropagation();
//   // setTimeout(() => {
//   //   console.log('==>>>>>',listData.value?.filter(e => !(e.isSelectAll || e.isDefault)))
//   //   fnSetSelected(listData.value?.filter(e => !(e.isSelectAll || e.isDefault)))
//   // }, 100);
// }

async function fnSelectIfOne() {
  // auto select when data one only
  if (selectIfOne.value && isNotEmpty(listData.value)) {
    selected.value =
      !multiple.value && listData.value.length == 2
        ? props.isNotAllowClear
          ? listData.value[0]
          : listData.value[1]
        : listData.value[0];

    // console.log('====>>>', selected.value)
    // if ((required.value || multiple.value) && listData.value.length == 2) {
    //   selected.value = !multiple.value ? listData.value[0] : [listData.value[0]];
    // }
  } else if (listData.value.length == 2 && defaultSelect.value) {
    selected.value = props.isNotAllowClear
      ? listData.value[0]
      : listData.value[1];
    if (selectType.value == "academicYear") {
      var currentAcademicYear = listData.value.filter((s) => s.IsCurrent);
      if (currentAcademicYear.length > 0)
        selected.value = currentAcademicYear[0];
    }
  } else {
    if (
      defaultSelect.value &&
      selectIfOne.value &&
      isNotEmpty(listData.value)
    ) {
      selected.value = listData.value[1];
    }
  }
}

let oldFilter = customFilter.value;
watch(() => customFilter, (newValue, oldValue) => {
  // read time reload api when has filter 
  // EX: :api="{ url: 'api/customer/basic/list', method: 'POST',filter : moreFilter }" (moreFilter of ref)
  if (!deepEqual(oldFilter, customFilter.value)) {
    oldFilter = { ...customFilter.value };
    reload();
    selected.value = !multiple.value ? undefined : [];
  }
}, { deep: true });

// watch(selected, (n, o) => {
//   emit("selected", selected.value);
// }, { deep: true });

watch(apiUrl, (n) => {
  if (n) {
    reload();
    selected.value = !multiple.value ? undefined : [];
  }
});

watch(localData, (n) => {
  if (isNotEmpty(n)) {
    listData.value = [...(n?.data ?? [])];
    if (!multiple.value && !n.defaultSelect) {
      if (!props.isNotAllowClear) listData.value.unshift({ ...{ [pk.value]: '' }, isDefault: true });
    }
  }
}, { deep: true });

// const items = ref([])
// watchDebounced(query, async () => {
//     items.value = await search(query.value)
// }, { deep: true })

function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}
function clear() {
  selected.value = multiple.value ? [] : undefined
  query.value = ''
}
function open() {
  isOpen.value = true
}
function close() {
  isOpen.value = false
}
function getSelected() {
  console.log('getSelected >>>', selected.value)
  return selected.value
}
function getMenuRef() {
  return refSelctMenu.value // was selectExpose() — same thing, exposed properly now
}

defineExpose({
  remoteSelect,
  reload,
  clear,
  open,
  close,
  getSelected,
  getMenuRef,
});

function selectExpose() {
  return refSelctMenu.value
}

async function remoteSelect(filter) {
  // console.log(filter);
  if (isNotAllowRemoteSelect.value) return
  if (filter.isFilter) filter = { ...filter, ...customFilter.value }; // is has property isFilter it marge filter in init
  const keyRemote = isNotEmpty(filter.pk) ? filter.pk : "Id";
  if (isNotEmpty(props.api)) {
    let listSelect = await getData(filter, true);
    // console.log(listSelect);
    if (isNotEmpty(keyRemote)) {
      // select by client side
      if (isEmpty(listSelect)) return;
      if (!multiple.value) {
        // selected.value = listSelect.find((d) => d[keyRemote] == filter[keyRemote]);
        fnSetSelected(listSelect?.find((d) => d[keyRemote] === filter[keyRemote]))
        // single select
      } else {
        // selected.value = listSelect.filter((d) => filter[keyRemote].includes(d[keyRemote]));
        fnSetSelected(listSelect?.filter((d) => filter[keyRemote]?.includes(d[keyRemote])))
        // multiple select
      }
    } else {
      if (!multiple.value) {
        // selected.value = isNotEmpty(listSelect) ? listSelect[0] : undefined;
        fnSetSelected(isNotEmpty(listSelect) ? listSelect[0] : {})
        // single select
      } else {
        // selected.value = isNotEmpty(listSelect) ? listSelect : []; // multiple select
        fnSetSelected(isNotEmpty(listSelect) ? listSelect : [])
      }
    }
  } else if (isNotEmpty(props.localData?.data)) {
    setTimeout(() => {
      if (isEmpty(listData.value)) return;
      if (!multiple.value) {
        // selected.value = listData.value.find((d) => d[keyRemote] == filter[keyRemote]);
        fnSetSelected(listData.value.find((d) => d[keyRemote] === filter[keyRemote]))
        // single select
      } else {
        // selected.value = listData.value.filter((d) => filter[keyRemote].includes(d[keyRemote]));
        fnSetSelected(listData.value.filter((d) => filter[keyRemote].includes(d[keyRemote])))
        // multiple select
      }
    }, 1000);
  }
}
async function reload() {
  setTimeout(async () => {
    if (isNotEmpty(listData.value))
      listData.value.splice(0, listData.value.length); // remove all item. it is can't assign = [] //old code
    listData.value.push(...(await getData({ Pages: 1, Records: 10 }))); // push new data //old
    totalRecord.value =
      listData.value.length > 1
        ? listData.value[1]?.RecordCount ?? listData.value[1]?.RecordCounts
        : 0;
    await fnSelectIfOne();
  }, 500);
}

function fnBindScroll() {
  const parent = refOCSelect.value;
  parent?.addEventListener(
    "scroll",
    async function (event) {
      const ul = parent.querySelector("ul");
      if (event.target === ul) {
        const scrollBottom = ul.scrollHeight - ul.clientHeight - ul.scrollTop;

        if (scrollBottom <= 40) {
          if (
            !isLoading.value &&
            pages.value * 10 < totalRecord.value &&
            isEmpty(query.value)
          ) {
            pages.value++;
            const moreData = await getData({ Pages: pages.value, Records: 10 });

            if (Array.isArray(moreData) && moreData.length > 0) {
              const existingMap = new Map(
                listData.value.map((obj) => {
                  // Build a unique key for each existing item
                  let key;
                  if (isNotEmpty(pk.value) && pk.value in obj) {
                    key = obj[pk.value];
                  } else {
                    // Fallback: serialize full object to compare
                    key = JSON.stringify(obj);
                  }
                  return [key, obj];
                })
              );

              const uniqueNewItems = moreData.filter((item) => {
                let key;
                if (isNotEmpty(pk.value) && pk.value in item) {
                  key = item[pk.value];
                } else {
                  key = JSON.stringify(item);
                }
                return !existingMap.has(key);
              });

              if (uniqueNewItems.length > 0) {
                listData.value.push(...uniqueNewItems);
                
              }
            }
          }
        }
      }
    },
    true
  );
}


async function fnSearch(d) {
  emit("onSearch", d);
  if (isEmpty(d)) {
    query.value = "";
    return listData.value;
  } else {
    return await getData({ Search: d });
  }
}
let api = {
  url: "",
  method: "",
  where: "",
  filter: {},
};
//where is api return list from api as like : { data: [{}] } so where:'data'

const result = ref([]);
let controller;
async function getData(filter, isFromSelect = false) {
  if (isEmpty(apiUrl.value)) return [];
  let filters = { ...filter, ...customFilter.value }; // marge filter init
  isLoading.value = true;
  if (controller) controller.abort();
  controller = new AbortController();
  const { data, error } = await useHttp(apiUrl.value, {
    method: props.api.method,
    controller: controller,
    data: !isFromSelect ? filters : filter,
  });
  if (error.value || isEmpty(data.value)) {
    isLoading.value = false
    return [];
  }
  if (data.value) isLoading.value = false;
  // let result;

  // mapping data select by where select property
  if (isNotEmpty(props.api?.where)) result.value = data.value[props.api?.where];
  else if (isNotEmpty(props.api?.subChild)) {
    if (data?.value.header.length > 0) {
      result.value = data?.value[props?.api?.subChild?.propFirst][props?.api?.subChild?.index][props?.api?.subChild?.propSecond];
      if (isNotEmpty(props.api.fixObjectValue)) {
        //This object should be the same with name for render to show in select
        result.value.unshift({ ...props.api.fixObjectValue });
      }
    } else result.value = copyWith([]);
  } else result.value = copyWith(data.value) ?? [];

  // custom data everything return of array
  emit("mapData", result.value);

  if (result.value?.data) {
    if (!Array.isArray(result.value?.data)) {
      alert("OCSelect: Data of array only !");
      return (result.value = copyWith([]));
    } else {
      result.value = copyWith(result.value?.data);
    }
  }

  // add item clear when hes props required
  if (!required.value && !isFromSelect && !multiple.value) {
    // console.log(listData.value)
    if (isEmpty(listData.value)) {
      if (!props.isNotAllowClear) result.value.unshift({ ...{ [pk.value]: '' }, isDefault: true }); // add for first only
    }
  }

  if (multiple.value) {
    result.value.unshift({ ...{ [pk.value]: 'clearAll' }, isDefault: true })
    result.value.unshift({ ...{ [pk.value]: 'selectAll' }, isSelectAll: true })
  }
  // console.log('==== get data>>>>',copyWith([...result.value, ...listData.value]))
  return result.value;
}

// const uiMenu = computed(() => {
//   return {
//     option: {
//       container: `flex items-center gap-1.5 min-w-full`,
//       padding: ''
//     },
//   }
// })

const ui = computed(() => {
  const defaultUI = {
    // container: "r-custom-select",
    base: `justify-between ui-select-base w-full color-bg-content rounded-[8px] ${props.multiple ? 'height-btn-select-all' : ''}`,
    // content:'min-w-fit',
    content: 'flex-1 min-w-0',
    leading: 'hidden',
    trailing: 'ui_rselect_trailing',
    group:'ui_rselect_group',
    empty:'',
    item:'ui_rselect_item',
    input:'!px-2.5 !py-2.5',
    ring: "",
    rounded: "",
    itemLabel: 'truncate',
    size: {},
    value: 'text-left flex-1',
    itemTrailingIcon: 'i-lucide-check',
    option: {
      active: "color-bg-wrapper",
      container: `flex items-center gap-1.5 w-full min-w-full`,
    },
    selectedIcon: {
      base: "!text-red-700",
    },
    leading: 'text-red-500',
    
    // icon: {
    //   base: "",
    //   loading: "!h-4 !w-4 ri-loader-4-line",
    //   leading: {
    //     wrapper: "absolute inset-y-0 start-0 flex items-center pr-custom",
    //   },
    //   trailing: {
    //     wrapper: "absolute inset-y-0 end-0 flex items-center",
    //     padding: {
    //       "2xs": "px-1",
    //       xs: "px-2.5",
    //       sm: "px-2.5",
    //       md: "px-2.5",
    //       lg: "px-3.5",
    //       xl: "px-3.5",
    //     },
    //   },
    // },
    arrow:'ui_rselect_arrow'
    // arrow: [
    //   'ui_rselect_arrow',
    //   { input: "", base:"ri-chevron-down", },
    // ],
  };

  if (isNotEmpty(props.class)) {
    defaultUI.base = `color-bg-content rounded-[8px] ${props.class}`;
    return defaultUI;
  } else return defaultUI;
});

function fnGenerateTextLabel(data, template) {
  return tBy({ km: data[template.labelKey], en: data[template.labelKeyEn] })
}
function fnGenerateTextSubLabel(data, template) {
  return tBy({ km: data[template.subLabelKey], en: data[template.subLabelKeyEn] })
}
</script>

<style lang="scss">
.ui-select-base { // work
  width: 100%;
  min-width: fit-content !important;
  display: flex;
  justify-content: start;
  align-items: center !important;

//  display: flex !important; 
//   flex-direction: row !important;
//   justify-content: start !important;
//   align-items: center !important; 
//   overflow: hidden !important;
}

// .truncated-select{
//   padding-top: 7px !important;
// }

.ui_rselect_trailing{
  display: flex !important; 
  flex-direction: row !important;
  justify-content: start !important;
  align-items: center !important; 
  overflow: hidden !important;
}

.ui_rselect_item{
  flex-shrink: 0 !important;
  padding: 1px 5px !important;
  border-radius: 5px !important;
}
.r-custom-select {
  &.have-selected-value {
    .height-btn-select-all {
      padding: 3px 40px 3px 2px;
    }

  }

  width: 100%;

  .height-btn-select-all {
    height: 100% !important;
  }

  .max-h-60 {
    max-height: 350px !important;
  }

  &.disabled {
    pointer-events: none !important;
    color: var(--color-w-b-2) !important;
    background: var(--r-b-disabled) !important;
    border-radius: 8px;
  }

  button {
    cursor: pointer;
    height: 38px !important; // This line determines the height
    box-shadow: unset !important;
    border: 1px solid var(--color-w-b-4);
    border-radius: 10px !important;
    
    &:focus {
      border: 1px solid var(--color-primary);
    }

    .pr-custom {
      padding-right: 22px;
    }
  }

  &.outline {
    outline-style: none;

    button {
      background: transparent !important;
    }
  }

  &.solidBackGround {
    outline-style: none;

    button {
      border: 1px solid transparent;
      background: var(--color-w-b-5) !important;
    }
  }

  &.solid {
    button {
      border: 1px solid transparent;

      //background: var(--bg-wrapper) !important;
      &:focus {
        border: 1px solid transparent;
        //background: var(--bg-wrapper) !important;
      }
    }
  }

  &.solid-content {
    button {
      border: 1px solid transparent;
      background: var(--bg-wrapper) !important;

      &:focus {
        border: 1px solid transparent;
        background: var(--bg-wrapper) !important;
      }
    }
  }

  &.none {
    button {
      background: transparent !important;
      border: 1px solid transparent;

      &:focus {
        border: 1px solid transparent;
      }
    }
  }

  ul {
    background: var(--bg-content) !important;
    border-radius: 8px;
    --tw-ring-color: var(--color-w-b-4) !important;
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

    &::-webkit-scrollbar {
      width: 7px;
      height: 7px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
      margin: 2px 0px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: transparent;
      border: 2px solid var(--bg-content);
      background-color: var(--color-w-b-4) !important;
      border-radius: 50px;
    }

    // hover
    &::-webkit-scrollbar-thumb:hover {
      background-color: var(--color-w-b-3) !important;
    }

    input {
      background: var(--bg-content) !important;
      padding: 10px 16px;
      border-color: var(--color-w-b-4) !important;

      &:focus {
        border-bottom: 1px solid var(--color-w-b-4) !important;
      }
    }

    li {
      //padding: 8px 14px;
      border-radius: 10px;
      cursor: pointer;

      &.bg-gray-100 {
        background: var(--bg-wrapper) !important;
      }

      &:hover {
        background: blue !important;
        // background: var(--bg-wrapper) !important;
      }

      .select-clear-container {
        display: flex;
        align-items: center;
        opacity: .6;
        padding: 8px 14px;
        width: 100% !important;
      }

      //  flex items-center opacity-[0.6] text-[12px] py-2 px-3.5 !w-full
    }
  }

  .nav-multiple-select {
    display: flex;
    flex-wrap: wrap;
    grid-gap: 6px;
    overflow: auto;
    max-height: 136px;

    .item {
      display: flex;
      grid-gap: 4px;
      border-radius: 8px;
      background: var(--bg-wrapper);
      color: var(--color-w-b-1);
      padding: 2px 5px 2px 8px;
      align-items: center;

      i {
        font-size: 14px;
        cursor: pointer;
        transition: 0.25s ease-in-out;
        color: var(--r-c-red);

        // &:hover {
        //   color: var(--color-primary);
        // }
      }
    }
  }
}

.r-select-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px !important;
  height: 20px !important;
  border: 0 !important;
  background: var(--color-w-b-1) !important;
  cursor: pointer !important;
  color: var(--c-text) !important;
  transition: .2s;

  &:hover {
    color: var(--color-error);
  }

  i {
    font-size: 18px !important;
  }
}

.r-select-arrow {
  transition: transform .2s ease;

  &.r-select-arrow--open {
    transform: rotate(180deg);
  }
}

.ui_rselect_arrow{
  // .ui_rselect_base[aria-expanded="true"] .ri-chevron-down::before{
  //   content: "\e984" !important;
  // }

  background-color: var(--c-bg);
  color: var(--c-text);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  // padding: 30px;
}
</style>
