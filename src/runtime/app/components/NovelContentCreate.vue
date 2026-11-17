<template>
    <RWrapperPage>
      <RContent>
        <RVisualEditor
          v-model="editorValue"
          :options="{ preset: 'full', theme: 'system', appearance: 'paper', toolbarMode: 'ribbon', editable: true, emitDebounce: 300, allowBlobUrls: false }"
          :uploadApi="uploadApi"
          :allowedMedia="['image', 'video', 'audio', 'file']"
          @upload="onUpload"
          @media-select="onMediaSelect"
          @save="onSave"
          @error="onEditorError"
        >
          <template #toolbar>
            <RToolbar default />
          </template>
        </RVisualEditor>
      </RContent>

        <RCard>
          <RForm ref="refForm" :schema="formSchema" :state="formState" class="space-y-4">
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
                :options="[{ value: 1, label: t('active') }, { value: 0, label: t('inactive') }]"
                :pk=" 'value' "
                title="label"
              />
            </RFormGroup>

            <RFormGroup :label="t('chapter_sort_order')" :name="sort_order">
              <RInput type="number" v-model.number="formState.sort_order" :placeholder="t('chapter_sort_order')" />
            </RFormGroup>

            <RFormGroup>
              <template #label>{{ t('cover_image') }}</template>
              <RFileUpload
                :url="api.novels.upload"
                :accept="['image/*']"
                @success="onFileSuccess"
                @error="onFileError"
              />
            </RFormGroup>

            <div v-if="uploadedUrl">
              <img :src="uploadedUrl" alt="preview" class="w-full max-w-[200px] my-2" />
            </div>

            <RBtn type="submit" :label="t('save')" @click="submitForm" :disabled="submitting" />
            <RBtn type="reset" :label="t('reset')" @click="resetForm" />
          </RForm>
        </RCard>
    </RWrapperPage>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useI18n, useToast } from 'vue-i18n'

const { t } = useI18n()
const toast = useToast()
const { confirmDestructive } = useConfirm()

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

// custom file uploader helper (small wrapper around useHttp)
async function uploadFile (file) {
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    // optional provider param; backend defaults to configured default
    const { data, error } = await useHttp(uploadApi.url, {
      method: uploadApi.method,
      data: formData,
      // useHttp will set Content-Type multipart automatically when data is FormData
    })
    if (error.value) throw error.value
    // expected response: { Id: number, Url: string, ... }
    const payload = data.value
    uploadedId.value = payload.Id ?? null
    uploadedUrl.value = payload.Url ?? null
    toast.add({ color: 'success', title: 'upload_success' })
  } catch (e) {
    toast.add({ color: 'error', title: 'upload_failed', description: e?.Message ?? e?.message ?? 'Unknown error' })
  } finally {
    uploading.value = false
  }
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
//
async function submitForm () {
  if (submitting.value) return
  submitting.value = true

  // Build chapter payload
  const payload = {
    NovelId: /* assume known from parent context, e.g. route param */ 0,
    VolumeId: null,
    Code: formState.code,
    Title: formState.title,
    TitleEn: formState.title_en,
    Slug: formState.slug,
    Status: Number(formState.status),
    SortOrder: formState.sort_order ?? 0,
    // Content from RVisualEditor (HTML or JSON depending on output)
    Content: editorValue.value || '',
    Html: editorValue.value || '', // keep both for backend
    EditorJson: '{}', // placeholder – could extract from editor if needed
    ImageFileIds: uploadedId.value ? [uploadedId.value] : [],
    AttachmentFileIds: []
  }

  // optional confirm before create
  const ok = await confirmDestructive({
    title: t('confirm_create'),
    description: t('confirm_create_body'),
    confirmLabel: t('create'),
    color: 'success'
  })
  if (!ok) {
    submitting.value = false
    return
  }

  const { data, error } = await useHttp('/api/v1/novels/chapters/create', {
    method: 'POST',
    data: payload
  })
  submitting.value = false
  if (error.value || !data.value) {
    toast.add({ color: 'error', title: 'create_failed', description: (error.value)?.Message ?? 'Unknown error' })
    return
  }
  const result = data.value
  toast.add({ color: 'success', title: result.Message ?? 'created' })
  // close or reload parent
  emit('created')
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
/* minimal overrides – RVisualEditor already ships its own styles */
</style>