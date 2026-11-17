<template>
  <RWrapperPage>
    <RContent>
      <RCard>
        <RForm ref="refForm" :schema="formSchema" :state="formState" class="space-y-4">
          <div class="group-input">
            <RFormGroup label="Code" name="Code" :required="true">
              <RInput v-model="formState.code" placeholder="Code" />
            </RFormGroup>

            <RFormGroup label="Title" name="Title" :required="true">
              <RInput v-model="formState.title" placeholder="Title" />
            </RFormGroup>

            <RFormGroup label="Title English" name="TitleEn">
              <RInput v-model="formState.title_en" placeholder="Title English" />
            </RFormGroup>

            <RFormGroup label="Slug" name="Slug" :required="true">
              <RInput v-model="formState.slug" placeholder="chapter-slug" />
            </RFormGroup>

            <RFormGroup label="Status" name="Status">
              <RSelect
                v-model="formState.status"
                :local-data="{ data: statusData }"
                pk="Value"
                title="Name"
              />
            </RFormGroup>

            <RFormGroup label="Sort order" name="SortOrder">
              <RInput v-model.number="formState.sort_order" type="number" placeholder="0" />
            </RFormGroup>
          </div>

          <RBtn type="reset" :label="t('reset')" @click="resetForm" />
          <RBtn type="create" :label="t('save')" :disabled="submitting" @click="submitForm" />
        </RForm>
      </RCard>

      <RVisualEditor
        ref="editorRef"
        v-model="editorValue"
        :api="editorApi"
        :options="{
          preset: 'full',
          theme: 'system',
          appearance: 'paper',
          toolbarMode: 'ribbon',
          editable: true,
          emitDebounce: 300,
          allowBlobUrls: false,
        }"
        :upload-api="uploadApi"
        :allowed-media="['image', 'video', 'audio', 'file']"
        @upload="onUpload"
        @save="onEditorSave"
        @error="onEditorError"
      />
    </RContent>
  </RWrapperPage>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['created', 'saved'])
const { t } = useI18n()
const toast = useToast()
const { api } = helper()

const query = queryParams() ?? {}
const novelParam = query.novel ?? {}
const chapterParam = query.chapter ?? {}

const novelId = ref(Number(novelParam.Id ?? novelParam.id) || 0)
const chapterId = ref(Number(chapterParam.Id ?? chapterParam.id) || null)
const editorRef = ref(null)
const editorValue = ref('')
const submitting = ref(false)
const uploadedUrl = ref(null)
const uploadedId = ref(null)

const statusData = [
  { Value: 1, Name: 'Active' },
  { Value: 0, Name: 'Inactive' },
]

const formState = reactive({
  code: '',
  title: '',
  title_en: '',
  slug: '',
  status: 1,
  sort_order: 0,
  chapter_number: 0,
  volume_id: null,
})

const formSchema = computed(() => [
  { name: 'Code', type: 'text', label: 'Code', required: true },
  { name: 'Title', type: 'text', label: 'Title', required: true },
  { name: 'TitleEn', type: 'text', label: 'Title English' },
  { name: 'Slug', type: 'text', label: 'Slug', required: true },
  { name: 'Status', type: 'select', label: 'Status', required: true, options: { data: statusData }, pk: 'Value', title: 'Name' },
  { name: 'SortOrder', type: 'number', label: 'Sort order' },
])

const uploadApi = {
  url: api.fileExplorer.upload,
  method: 'POST',
  fieldName: 'file',
  mapResponse: response => ({
    url: response?.Url ?? response?.url ?? response?.data?.Url ?? response?.data?.url,
    Id: response?.Id ?? response?.id ?? response?.data?.Id ?? response?.data?.id ?? null,
  }),
}

function applyChapter(record) {
  if (!record) return
  chapterId.value = Number(record.Id) || chapterId.value
  novelId.value = Number(record.NovelId) || novelId.value
  formState.code = record.Code ?? ''
  formState.title = record.Title ?? ''
  formState.title_en = record.TitleEn ?? ''
  formState.slug = record.Slug ?? ''
  formState.status = Number(record.Status ?? 0)
  formState.sort_order = Number(record.SortOrder ?? 0)
  formState.chapter_number = Number(record.ChapterNumber ?? 0)
  formState.volume_id = record.VolumeId ?? null
}

const editorApi = computed(() => ({
  load: chapterId.value
    ? {
        url: api.novels.chapters.get,
        method: 'POST',
        data: { Id: chapterId.value },
        mapResponse: (response) => {
          applyChapter(response)
          return { json: response?.EditorJson, html: response?.Html ?? response?.Content }
        },
      }
    : null,
  save: {
    url: chapterId.value ? api.novels.chapters.update : api.novels.chapters.create,
    method: 'POST',
    data: () => ({
      ...(chapterId.value ? { Id: chapterId.value } : {}),
      NovelId: novelId.value,
      VolumeId: formState.volume_id ? Number(formState.volume_id) : null,
      Code: formState.code,
      Title: formState.title,
      TitleEn: formState.title_en || null,
      Slug: formState.slug,
      Status: Number(formState.status),
      SortOrder: Number(formState.sort_order ?? 0),
      ChapterNumber: Number(formState.chapter_number ?? 0),
      ImageFileIds: uploadedId.value ? [uploadedId.value] : [],
      AttachmentFileIds: [],
    }),
  },
  autoLoad: !!chapterId.value,
  autoSave: false,
}))

function onUpload(event) {
  if (event?.phase !== 'success') return
  uploadedUrl.value = event.url ?? null
  uploadedId.value = event.result?.Id ?? null
}

function onEditorSave(result) {
  submitting.value = false
  editorValue.value = result?.value ?? ''
  const response = result?.response
  if (response?.Id) chapterId.value = Number(response.Id)
  toast.add({ color: 'green', title: response?.Message ?? t('saved') })
  emit('saved', response)
  emit('created', response)
}

function onEditorError(event) {
  submitting.value = false
  toast.add({
    color: 'red',
    title: t('error'),
    description: event?.error?.Message ?? event?.error?.message ?? String(event?.error ?? ''),
  })
}

async function submitForm() {
  if (submitting.value) return
  if (!formState.code || !formState.title || !formState.slug || !novelId.value) {
    toast.add({ color: 'red', title: t('required_fields') })
    return
  }
  submitting.value = true
  await editorRef.value?.saveToApi()
}

function resetForm() {
  formState.code = ''
  formState.title = ''
  formState.title_en = ''
  formState.slug = ''
  formState.status = 1
  formState.sort_order = 0
  formState.chapter_number = 0
  formState.volume_id = null
  chapterId.value = null
  editorValue.value = ''
  uploadedUrl.value = null
  uploadedId.value = null
  editorRef.value?.clearContent()
}
</script>

<style lang="scss" scoped>
.group-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  width: 100%;
}
</style>
