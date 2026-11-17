<template>
  <RWrapperPage>
    <RContent>
      <RCard>
        <RForm ref="refForm" :schema="formSchema" :state="formState" class="space-y-4">
          <div class="group-input">
            <RFormGroup :label="t('chapter_code')" :name="code" :required="true">
              <RInput v-model="formState.code" :placeholder="t('chapter_code')" />
            </RFormGroup>
        
            <RFormGroup :label="t('chapter_title')" :name="title" :required="true">
              <RInput v-model="formState.title" :placeholder="t('chapter_title')" />
            </RFormGroup>
            <RFormGroup :label="t('chapter_title_en')" :name="title_en">
              <RInput v-model="formState.title_en" :placeholder="t('chapter_title_en')" />
            </RFormGroup>
        
            <RFormGroup :label="t('chapter_slug')" :name="slug">
              <RInput v-model="formState.slug" :placeholder="t('chapter_slug')" />
            </RFormGroup>

            <RFormGroup :label="t('chapter_status')" :name="status">
              <RSelect
                v-model="formState.status"
                :local-data="{ data: [{ value: 1, Name: t('active') }, { value: 0, Name: t('inactive') }]}"
                :pk=" 'value' "
                title="label"
              />
            </RFormGroup>
        
            <RFormGroup :label="t('chapter_sort_order')" :name="sort_order">
              <RInput type="number" v-model.number="formState.sort_order" :placeholder="t('chapter_sort_order')" />
            </RFormGroup>
          </div>
      
          <RBtn type="reset" :label="t('reset')" @click="resetForm" />
          <RBtn type="create" :label="t('save')" @click="submitForm" :disabled="submitting" />
        </RForm>
      </RCard>

      <RVisualEditor
        v-model="editorValue"
        :options="{ preset: 'full', theme: 'system', appearance: 'paper', toolbarMode: 'ribbon', editable: true, emitDebounce: 300, allowBlobUrls: false }"
        :uploadApi="uploadApi"
        :allowedMedia="['image', 'video', 'audio', 'file']"
        @upload="onUpload"
        @media-select="onMediaSelect"
        @save="onSave"
        @error="onEditorError"/>
    </RContent>
  </RWrapperPage>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
definePageMeta({layout:'navbar', middleware:'auth'})
const { t } = useI18n()
const toast = useToast()
const confirm = useConfirmStore()
const  { api } = helper()
const paramData = queryParams()?.novel
const editorValue = ref('') // stringified JSON from RVisualEditor

// ---------------------------------------------------
// Upload handling via /api/v1/file_explorer/files/upload
// ---------------------------------------------------
const uploading = ref(false)
const uploadedUrl = ref(null)
const uploadedId = ref(null)

const uploadApi = {
  url: '/api/v1/file_explorer/files/upload',
  method: 'POST',
  // body will be FormData built in the uploader helper
}

// listen to RVisualEditor upload event (phase 'success')
function onUpload (e) {
  // e.detail.url is the permanent URL returned by the uploader
  if (e.detail?.url) {
    uploadedUrl.value = e.detail.url
    // also persist the Id if needed
    // const id = e.detail.id
  }
}

// media select handler (optional)
function onMediaSelect (a) {
  // can insert media node into editor
}

// save handler – serialize editor and submit chapter payload
function onSave (json) {
  editorValue.value = JSON.stringify(json)
}

// editor error
function onEditorError (err) {
  toast.add({ color: 'error', title: 'editor_error', description: err?.message ?? err })
}

// ---------------------------------------------------
// Form state (simple reactive)
//
const formState = reactive({
  code: '',
  title: '',
  title_en: '',
  slug: '',
  status: 1
})

const submitting = ref(false)

// schema for RForm (simple inputs)
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
    options: [{ value: 1, label: t('active') }, { value: 0, label: t('inactive') }],
    pk: 'value',
    title: 'label'
  },
  {
    name: 'sort_order',
    type: 'number',
    label: t('chapter_sort_order'),
    placeholder: t('chapter_sort_order')
  }
])

// ---------------------------------------------------
// Form actions

async function submitForm () {
  if (submitting.value) return

  const payload = {
    NovelId: paramData?.Id ?? 0,
    VolumeId: null,
    Code: formState.code,
    Title: formState.title,
    TitleEn: formState.title_en,
    Slug: formState.slug,
    Status: Number(formState.status),
    SortOrder: Number(formState.sort_order ?? 0),
    Content: editorValue.value || '',
    Html: editorValue.value || '',
    EditorJson: '{}',
    ImageFileIds: uploadedId.value ? [uploadedId.value] : [],
    AttachmentFileIds: []
  }

  confirm.show({
    title: t('confirm_create'),
    description: t('confirm_create_body'),
    confirmLabel: t('create'),
    color: 'success',
    onConfirm: async () => {
      if (submitting.value) return
      submitting.value = true
      try {
        const { data, error } = await useHttp('/api/v1/novels/chapters/create', {
            method: 'POST',
            data: payload
          }
        )

        if (error.value) { throw error.value }
        if (!data.value) {
          throw new Error('Empty response from server')
        }
        toast.add({ color: 'success', title: data.value?.Message ?? t('created') })
      } catch (error) {
        console.error('[Chapter Create]', error)

        toast.add({
          color: 'error',
          title: t('create_failed'),
          description:
            error?.Message ??
            error?.message ??
            'Unknown error'
        })
      } finally {
        submitting.value = false
      }
    }
  })
}


function resetForm () {
  formState.code = ''
  formState.title = ''
  formState.title_en = ''
  formState.slug = ''
  formState.status = 1
  editorValue.value = ''
  uploadedUrl.value = null
  uploadedId.value = null
}
</script>

<style lang="scss" scoped>
.group-input{
  display: flex;
  flex-direction: row;
  align-items:  center;
  gap:10px;
  width: 100%;
}
</style>