<template>
  <RWrapperPage>
    <RContent>
      <RCard>
        <RForm ref="refForm" :schema="formSchema" :state="formState" class="space-y-4">
          <div class="group-input">
            <RFormGroup :label="t('chapter_code')" name="code" :required="true">
              <RInput v-model="formState.code" :placeholder="t('chapter_code')" />
            </RFormGroup>

            <RFormGroup :label="t('chapter_title')" name="title" :required="true">
              <RInput v-model="formState.title" :placeholder="t('chapter_title')" />
            </RFormGroup>

            <RFormGroup :label="t('chapter_title_en')" name="title_en">
              <RInput v-model="formState.title_en" :placeholder="t('chapter_title_en')" />
            </RFormGroup>

            <RFormGroup :label="t('chapter_slug')" name="slug">
              <RInput v-model="formState.slug" :placeholder="t('chapter_slug')" />
            </RFormGroup>

            <RFormGroup :label="t('chapter_status')" name="status">
              <RSelect
                v-model="formState.status"
                :local-data="{ data: statusData }"
                pk="Value"
                title="Name"
              />
            </RFormGroup>

            <RFormGroup :label="t('chapter_sort_order')" name="sort_order">
              <RInput
                v-model.number="formState.sort_order"
                type="number"
                :placeholder="t('chapter_sort_order')"
              />
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
          allowBlobUrls: false
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
import { useCookie, useUserData } from '#imports'
import { useI18n } from 'vue-i18n'
import getDeviceId from '../utils/getDeviceId.js'

const emit = defineEmits(['created', 'saved'])
definePageMeta({ layout: 'navbar', middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirmStore()
const { api, str } = helper()

const query = queryParams() ?? {}
const novelParam = query.novel ?? {}
const chapterParam = query.chapter ?? {}

const novelId = ref(Number(novelParam.Id ?? novelParam.id) || 0)
const chapterId = ref(Number(chapterParam.Id ?? chapterParam.id) || null)
const uploadProvider = ref(String(query.provider ?? query.Provider ?? 'telegram'))

const editorRef = ref(null)
const refForm = ref(null)
const editorValue = ref('')
const submitting = ref(false)
const uploadedFiles = ref([])

const statusData = computed(() => [
  { Value: 1, Name: t('active') },
  { Value: 0, Name: t('inactive') }
])

const formState = reactive({
  code: '',
  title: '',
  title_en: '',
  slug: '',
  status: 1,
  sort_order: 0,
  chapter_number: 0,
  volume_id: null
})

const formSchema = computed(() => [
  {
    name: 'code',
    type: 'text',
    label: t('chapter_code'),
    placeholder: t('chapter_code'),
    required: true
  },
  {
    name: 'title',
    type: 'text',
    label: t('chapter_title'),
    placeholder: t('chapter_title'),
    required: true
  },
  {
    name: 'title_en',
    type: 'text',
    label: t('chapter_title_en'),
    placeholder: t('chapter_title_en')
  },
  {
    name: 'slug',
    type: 'text',
    label: t('chapter_slug'),
    placeholder: t('chapter_slug')
  },
  {
    name: 'status',
    type: 'select',
    label: t('chapter_status'),
    required: true,
    options: { data: statusData.value },
    pk: 'Value',
    title: 'Name'
  },
  {
    name: 'sort_order',
    type: 'number',
    label: t('chapter_sort_order'),
    placeholder: t('chapter_sort_order')
  }
])

const uploadApi = computed(() => ({
  url: api.fileExplorer.upload,
  method: 'POST',
  fieldName: 'File',
  headers: () => {
    const user = useUserData()?.value
    const accessToken = useCookie(str.accessTokenKey).value ?? user?.access_token
    const headers = {
      lang: useCookie(str.langCode).value ?? 'en',
      device_id: getDeviceId(),
      database: useCookie(str.dbCode).value
    }
    if (accessToken) headers.Authorization = `${user?.token_type ?? 'Bearer'} ${accessToken}`
    return headers
  },
  body: {
    Provider: uploadProvider.value,
    FolderId: null,
    MakePublic: true
  },
  mapResponse: (response) => ({
    url:
      response?.Url ??
      response?.url ??
      response?.FullPath ??
      response?.data?.Url ??
      response?.data?.url ??
      response?.data?.FullPath,
    fileId:
      response?.Id ??
      response?.id ??
      response?.FileId ??
      response?.fileId ??
      response?.data?.Id ??
      response?.data?.id ??
      response?.data?.FileId ??
      response?.data?.fileId ??
      null,
    Id:
      response?.Id ??
      response?.id ??
      response?.FileId ??
      response?.fileId ??
      response?.data?.Id ??
      response?.data?.id ??
      response?.data?.FileId ??
      response?.data?.fileId ??
      null
  })
}))

const editorApi = computed(() => ({
  load: chapterId.value
    ? {
        url: api.novels.chapters.get,
        method: 'POST',
        data: { Id: chapterId.value },
        mapResponse: (response) => {
          applyChapter(response)
          return {
            json: response?.EditorJson,
            html: response?.Html ?? response?.Content
          }
        }
      }
    : null,
  save: {
    url: chapterId.value ? api.novels.chapters.update : api.novels.chapters.create,
    method: 'POST',
    data: (context) => ({
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
      ImageFileIds: collectFileIds(context?.uploads, 'image'),
      AttachmentFileIds: collectFileIds(context?.uploads, 'attachment')
    })
  },
  autoLoad: !!chapterId.value,
  autoSave: false,
  deferUpload: true
}))

function applyChapter(record) {
  if (!record) return
  chapterId.value = Number(record.Id) || chapterId.value
  novelId.value = Number(record.NovelId) || novelId.value
  formState.code = record.Code ?? ''
  formState.title = record.Title ?? ''
  formState.title_en = record.TitleEn ?? ''
  formState.slug = record.Slug ?? ''
  formState.status = Number(record.Status ?? 1)
  formState.sort_order = Number(record.SortOrder ?? 0)
  formState.chapter_number = Number(record.ChapterNumber ?? 0)
  formState.volume_id = record.VolumeId ?? null
}

function collectFileIds(uploads, group) {
  const source = Array.isArray(uploads) && uploads.length ? uploads : uploadedFiles.value
  const ids = new Set()
  for (const item of source) {
    const id =
      item?.fileId ??
      item?.Id ??
      item?.id ??
      item?.result?.Id ??
      item?.result?.id ??
      item?.result?.data?.Id ??
      item?.result?.data?.id ??
      null
    if (!id) continue
    if (group === 'image' && item?.kind !== 'image') continue
    if (group === 'attachment' && item?.kind === 'image') continue
    ids.add(id)
  }
  return [...ids]
}

function onUpload(event) {
  if (event?.phase !== 'success') return
  const upload = {
    uploadId: event.uploadId ?? null,
    kind: event.kind ?? event.result?.kind ?? null,
    url: event.url ?? event.result?.url ?? event.result?.Url ?? null,
    fileId:
      event.fileId ??
      event.result?.Id ??
      event.result?.id ??
      event.result?.data?.Id ??
      event.result?.data?.id ??
      null
  }
  if (!upload.fileId && !upload.url) return
  if (!uploadedFiles.value.some((item) => item.uploadId === upload.uploadId && upload.uploadId != null)) {
    uploadedFiles.value.push(upload)
  }
}

function onEditorSave(result) {
  submitting.value = false
  editorValue.value = result?.value ?? editorValue.value
  const response = result?.response
  if (response?.Id) chapterId.value = Number(response.Id)
  toast.add({ color: 'success', title: response?.Message ?? t('saved') })
  emit('saved', response)
  emit('created', response)
}

function onEditorError(event) {
  submitting.value = false
  toast.add({
    color: 'error',
    title: t('error'),
    description:
      event?.error?.Message ??
      event?.error?.message ??
      String(event?.error ?? event?.message ?? t('error'))
  })
}

function submitForm() {
  if (submitting.value) return
  if (!novelId.value) {
    toast.add({ color: 'error', title: t('required_fields') })
    return
  }
  if (!formState.code || !formState.title || !formState.slug) {
    toast.add({ color: 'error', title: t('required_fields') })
    return
  }

  confirm.show({
    title: t('confirm_create'),
    description: t('confirm_create_body'),
    confirmLabel: t('create'),
    color: 'success',
    onConfirm: async () => {
      if (submitting.value) return
      submitting.value = true
      const result = await editorRef.value?.saveToApi()
      if (!result) submitting.value = false
    }
  })
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
  editorValue.value = ''
  uploadedFiles.value = []
  refForm.value?.clearValidate?.()
  editorRef.value?.clearPendingUploads()
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
