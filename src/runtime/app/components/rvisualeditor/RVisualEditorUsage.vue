<script setup>
// RVisualEditor demo. The component is ONE file (script + template + SCSS).
// Media uploads here use a simulated uploader that returns blob: URLs, which is why the demos pass
// `allowBlobUrls: true`. In production, pass :upload-api (or :uploader) that returns persistent URLs.
import { Extension } from '@tiptap/core'
import {useStorage, StorageSerializers } from '@vueuse/core'
definePageMeta({layout:'navbar'})
const cases = [
  { value: 'notion', label: 'Notion style', icon: 'i-lucide-notebook-pen' },
  { value: 'ribbon', label: 'Word ribbon', icon: 'i-lucide-layout-template' },
  { value: 'compact', label: 'Compact toolbar', icon: 'i-lucide-panel-top' },
  { value: 'footer', label: 'Footer options', icon: 'i-lucide-panel-bottom' },
  { value: 'robust', label: 'Bad input safety', icon: 'i-lucide-shield-check' },
  { value: 'uploads', label: 'Drop files & uploads', icon: 'i-lucide-cloud-upload' },
  { value: 'uploadapi', label: 'Real upload endpoint', icon: 'i-lucide-server' },
  { value: 'progress', label: 'Shared upload progress', icon: 'i-lucide-list-checks' },
  { value: 'save', label: 'Deferred save + file IDs', icon: 'i-lucide-file-check-2' },
  { value: 'design', label: 'Design canvas', icon: 'i-lucide-pen-tool' },
  { value: 'novel', label: 'Novel chapter API', icon: 'i-lucide-book-open' },
  { value: 'featureRich', label: 'Feature-rich builder', icon: 'i-lucide-wand-sparkles' },
  { value: 'fullscreen', label: 'Full screen option', icon: 'i-lucide-maximize-2' },
  { value: 'basic', label: 'Basic v-model', icon: 'i-lucide-pencil' },
  { value: 'draft', label: 'Autosaved draft', icon: 'i-lucide-save' },
  { value: 'form', label: 'Form + validation', icon: 'i-lucide-clipboard-check' },
  { value: 'output', label: 'Output modes', icon: 'i-lucide-braces' },
  { value: 'flags', label: 'Feature flags', icon: 'i-lucide-toggle-right' },
  { value: 'themes', label: 'Themes', icon: 'i-lucide-palette' },
  { value: 'control', label: 'Programmatic API', icon: 'i-lucide-terminal' },
  { value: 'events', label: 'Events', icon: 'i-lucide-activity' },
  { value: 'extension', label: 'Custom extension', icon: 'i-lucide-puzzle' },
  { value: 'sync', label: 'Two editors, one model', icon: 'i-lucide-copy' },
  { value: 'layout', label: 'Responsive layout', icon: 'i-lucide-smartphone' },
  { value: 'readonly', label: 'Read-only', icon: 'i-lucide-lock' },
]
const current = ref('notion')

// ---- simulated uploader (progress + abort + failures for files named "fail*") -------------------------
const demoOptions = { allowBlobUrls: true }
const demoUploader = (file, { onProgress, signal }) => new Promise((resolve, reject) => {
  let p = 0
  const id = setInterval(() => {
    p += 0.08 + Math.random() * 0.12
    onProgress(Math.min(p, 1))
    if (/^fail/i.test(file.name) && p > 0.5) { clearInterval(id); reject(new Error('Simulated server error (HTTP 500).')) }
    else if (p >= 1) { clearInterval(id); resolve({ url: URL.createObjectURL(file) }) }
  }, 180)
  signal?.addEventListener('abort', () => { clearInterval(id); reject(new DOMException('Aborted', 'AbortError')) })
})

// ---- shared sample content ----------------------------------------------------------------------------
const t = (text, marks) => ({ type: 'text', text, ...(marks ? { marks } : {}) })
const p = (text) => ({ type: 'paragraph', content: [t(text)] })
const sampleEnvelope = {
  schema: 'rvisual.document',
  version: 1,
  doc: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [t('Product launch plan')] },
      {
        type: 'paragraph',
        content: [
          t('Select text for the floating toolbar, type '), t('/', [{ type: 'code' }]), t(' for every block, drag the '),
          t('⋮⋮', [{ type: 'bold' }]), t(' handle to reorder, and drop images, video, audio or PDFs anywhere. A '),
          t('Georgia 20px', [{ type: 'textStyle', attrs: { fontFamily: 'Georgia', fontSize: '20px' } }]), t(' span, '),
          t('highlight', [{ type: 'highlight', attrs: { color: '#fbd33d77' } }]), t(' and a '),
          t('link', [{ type: 'link', attrs: { href: 'https://nuxt.com' } }]), t('.'),
        ],
      },
      { type: 'callout', attrs: { tone: 'info' }, content: [p('Callouts, to-dos, tables, quotes and code blocks are all one slash away.')] },
      { type: 'heading', attrs: { level: 2 }, content: [t('Checklist')] },
      {
        type: 'taskList',
        content: [
          { type: 'taskItem', attrs: { checked: true }, content: [p('Slash menu with every tool')] },
          { type: 'taskItem', attrs: { checked: true }, content: [p('Drop & upload media')] },
          { type: 'taskItem', attrs: { checked: false }, content: [p('Canvas compositions (Fabric, M4)')] },
        ],
      },
      {
        type: 'table',
        content: [
          { type: 'tableRow', content: [{ type: 'tableHeader', content: [p('Milestone')] }, { type: 'tableHeader', content: [p('Status')] }] },
          { type: 'tableRow', content: [{ type: 'tableCell', content: [p('Editor + menus')] }, { type: 'tableCell', content: [p('Done')] }] },
          { type: 'tableRow', content: [{ type: 'tableCell', content: [p('Fabric canvas')] }, { type: 'tableCell', content: [p('Next')] }] },
        ],
      },
    ],
  },
  fonts: [],
}
const sampleHtml = '<h2>From HTML</h2><p>Loaded via <strong>setContent</strong> as a <em>sanitized</em> HTML string.</p><ul><li>One</li><li>Two</li></ul>'
const clone = (v) => JSON.parse(JSON.stringify(v))
const pretty = (v) => (typeof v === 'string' ? v : JSON.stringify(v, null, 2))

// ---- cases state ---------------------------------------------------------------------------------------
const notion = ref(null)
const ribbon = ref(clone(sampleEnvelope))
const compactDoc = ref(clone(sampleEnvelope))
const footerOn = ref(true)
const footerCounts = ref(true)
const footerZoom = ref(true)
const footerDoc = ref(clone(sampleEnvelope))

// Hostile / malformed inputs: every one of these must render without throwing.
const circular = {}
circular.self = circular
const robustCases = [
  { label: 'modelValue = null', props: { modelValue: null } },
  { label: "modelValue = '' (empty string)", props: { modelValue: '' } },
  { label: 'modelValue = [] (empty array)', props: { modelValue: [] } },
  { label: 'modelValue = {} (empty object)', props: { modelValue: {} } },
  { label: 'modelValue = whitespace', props: { modelValue: '   ' } },
  { label: 'malicious HTML (script, onerror)', props: { modelValue: '<p>safe text</p><img src=x onerror=alert(1)><script>alert(1)<' + '/script>' } },
  { label: 'unknown object shape', props: { modelValue: { foo: 'bar' } } },
  { label: 'circular object', props: { modelValue: circular } },
  { label: 'doc with junk nodes (null, 5)', props: { modelValue: { type: 'doc', content: [null, 5, { type: 'paragraph', content: [{ type: 'text', text: 'survivor' }] }] } } },
  { label: 'media with javascript: src', props: { modelValue: { type: 'doc', content: [{ type: 'media', attrs: { kind: 'image', src: 'javascript:alert(1)', status: 'ready' } }] } } },
  { label: 'invalid options (wrong types, unknown keys)', props: { options: { toolbar: 'yes', theme: 'neon', fonts: [], fontSizes: null, footer: 5, bogus: 1 } } },
  { label: 'junk extensions [null, {}, 5, "x"]', props: { extensions: [null, {}, 5, 'x'] } },
  { label: 'junk sizes / allowedMedia', props: { minHeight: 'abc', maxWidth: -5, allowedMedia: [null, 'zip'] } },
]

const uploadLog = ref([])
const uploadDoc = ref(null)
const uploadEd = ref(null)
const logUpload = (e) => {
  if (e.phase === 'progress') return
  uploadLog.value.unshift({ id: crypto.randomUUID(), t: new Date().toLocaleTimeString(), text: `${e.phase}: ${e.file?.name ?? ''}${e.error ? ` — ${e.error.message}` : ''}` })
  uploadLog.value.length = Math.min(uploadLog.value.length, 10)
}
const logError = (e) => logUpload({ phase: `error (${e.source}${e.code ? `/${e.code}` : ''})`, file: e.file, error: e.error })
const uploadKinds = ref(['image', 'video', 'audio', 'file'])
const kindItems = ['image', 'video', 'audio', 'file']
const uploadAPIExample = `<RVisualEditor
  v-model="doc"
  :upload-api="{
    url: '/api/v1/media/upload',
    method: 'POST',
    fieldName: 'file',
    // headers can be an async function: resolve a token from your app, never hardcode secrets
    headers: async () => ({ 'X-CSRF-Token': await getCsrfToken() }),
    withCredentials: true,
    // map your server response to { url }
    mapResponse: (res) => ({ url: res.data.publicUrl }),
  }"
  :max-file-size="{ image: 5 * 1024 * 1024, video: 100 * 1024 * 1024 }"
  :allowed-media="['image', 'video']"
/>

// or bring your own transport:
:uploader="async (file, { onProgress, signal }) => ({ url: await myUpload(file, onProgress, signal) })"`

const progressStore = useUploadProgress()
const progressDoc = ref(null)
const progressEd = ref(null)
const progressComplete = ref(null)
function onProgressComplete(e) { progressComplete.value = e }

const saveDoc = ref(null)
const saveEd = ref(null)
const saveUploads = ref([])
const saveResult = ref('')
const saveComplete = ref(null)
const saveApi = { deferUpload: true, autoSave: false, save: { url: '/demo/deferred-save' } }
function trackSaveUpload(e) {
  if (e.phase !== 'success') return
  saveUploads.value.push({ uploadId: e.uploadId, kind: e.kind, fileId: e.fileId, url: e.url })
}
function onSaveComplete(e) { saveComplete.value = e }
function collectFileIds(uploads, group) {
  return (uploads ?? [])
    .filter((u) => (group === 'image' ? u.kind === 'image' : u.kind !== 'image') && u.fileId)
    .map((u) => u.fileId)
}
async function waitForSaveUploads() {
  if (!saveEd.value?.isUploading?.()) return
  await new Promise((resolve) => {
    const stop = watch(() => saveEd.value?.isUploading?.(), (busy) => {
      if (!busy) { stop(); resolve() }
    })
  })
}
async function flushAndSave() {
  await waitForSaveUploads()
  const uploads = await saveEd.value?.flushPendingUploads?.() ?? []
  const source = uploads.length ? uploads : saveUploads.value
  saveResult.value = pretty({
    json: saveEd.value?.getJSON?.(),
    html: saveEd.value?.getHTML?.(),
    imageFileIds: collectFileIds(source, 'image'),
    attachmentFileIds: collectFileIds(source, 'attachment'),
    uploadComplete: saveComplete.value,
  })
}

const designDoc = ref(null)
const designSaved = ref(null)
const canvasOptions = { width: 1200, height: 675, background: '#ffffff' }
function onDesignSaved(e) { designSaved.value = e }

const novelRecipe = `<RVisualEditor
  ref="editorRef"
  v-model="editorValue"
  :api="{
    load: chapterId ? {
      url: api.novels.chapters.get,
      method: 'POST',
      data: { Id: chapterId },
      mapResponse: (res) => { applyChapter(res); return { json: res.EditorJson, html: res.Html } }
    } : null,
    save: {
      url: chapterId ? api.novels.chapters.update : api.novels.chapters.create,
      method: 'POST',
      data: (context) => ({
        ...(chapterId ? { Id: chapterId } : {}),
        NovelId: novelId,
        Code: formState.code,
        Title: formState.title,
        Slug: formState.slug,
        Status: Number(formState.status),
        ImageFileIds: collectFileIds(context.uploads, 'image'),
        AttachmentFileIds: collectFileIds(context.uploads, 'attachment')
      })
    },
    autoLoad: !!chapterId,
    deferUpload: true
  }"
  :upload-api="uploadApi"
  @upload="onUpload"
  @save="onEditorSave"
/>

const uploadApi = {
  url: api.fileExplorer.upload,
  method: 'POST',
  fieldName: 'File',
  headers: () => ({
    Authorization: loggedInTokenHeader(),
    lang: 'en',
    database: currentDatabase()
  }),
  body: { Provider: 'telegram', FolderId: null, MakePublic: true },
  mapResponse: (res) => ({
    url: res.Url ?? res.FullPath ?? res.data?.Url,
    fileId: res.Id ?? res.id ?? res.data?.Id ?? null
  })
}

function onUpload(event) {
  if (event.phase !== 'success') return
  uploadedFiles.push({ uploadId: event.uploadId, kind: event.kind, fileId: event.fileId })
}

function collectFileIds(uploads, group) {
  return (uploads ?? [])
    .filter((u) => group === 'image' ? u.kind === 'image' : u.kind !== 'image')
    .map((u) => u.fileId)
    .filter(Boolean)
}`

const featureRichDoc = ref(clone(sampleEnvelope))
featureRichDoc.value.doc.content.push({
  type: 'paragraph',
  content: [t('File link: '), t('sample.pdf', [{ type: 'link', attrs: { href: '/sample.pdf' } }])],
})

const fullscreenDoc = ref(clone(sampleEnvelope))
const fullscreenEd = ref(null)
const fullscreenActive = ref(false)
const fullscreenMode = ref('body')
const fullscreenModeItems = [
  { label: 'Body layout (default)', value: 'body' },
  { label: 'Browser window', value: 'window' },
]

const basic = ref(clone(sampleEnvelope))

const draft = useStorage('rv-demo-draft', null, undefined, { serializer: StorageSerializers.object, initOnMounted: true })
const draftSavedAt = ref('')
watch(draft, () => { draftSavedAt.value = new Date().toLocaleTimeString() })

const formDoc = ref(null)
const formEd = ref(null)
const formTitle = ref('')
const formErrors = ref([])
const formResult = ref('')
function submitForm() {
  const words = (formEd.value?.getText() ?? '').trim().split(/\s+/).filter(Boolean).length
  formErrors.value = []
  if (!formTitle.value.trim()) formErrors.value.push('Title is required.')
  if (words < 10) formErrors.value.push(`Body needs at least 10 words (has ${words}).`)
  if (formEd.value?.isUploading()) formErrors.value.push('Wait for uploads to finish.')
  formResult.value = formErrors.value.length ? '' : pretty({ title: formTitle.value, body: formEd.value.getJSON() })
}

const output = ref('json')
const outputItems = [{ label: 'json (envelope)', value: 'json' }, { label: 'html', value: 'html' }, { label: 'both', value: 'both' }]
const outValue = ref(null)

const presets = {
  full: {},
  minimal: { fonts: false, colors: false, headings: false, alignment: false, lists: false, blockquote: false, indent: false, spacing: false, tables: false, codeBlock: false, divider: false, callout: false, slashMenu: false, bubbleMenu: false, blockHandle: false, media: false },
  writer: { fonts: 'hidden', colors: false, tables: false, codeBlock: false, spacing: 'disabled', indent: 'disabled', media: false },
  mixed: { colors: 'disabled', tables: 'disabled', links: 'hidden', images: 'disabled' },
  'no toolbar (Notion)': { toolbar: false },
  'no menus': { slashMenu: false, bubbleMenu: false, blockHandle: false },
}
const preset = ref('full')
const presetItems = Object.keys(presets).map((k) => ({ label: k, value: k }))
const flagValue = ref(null)

const themeValue = ref(clone(sampleEnvelope))

const ed = ref(null)
const apiValue = ref(null)
const apiResult = ref('')
const runtimeEditable = ref(true)
const call = (label, fn) => { apiResult.value = `${label}\n${pretty(fn())}` }
const setEditable = (v) => { runtimeEditable.value = v; ed.value?.setEditable(v) }

const events = ref([])
const eventValue = ref(null)
const log = (name, detail = '') => {
  events.value.unshift({ id: crypto.randomUUID(), t: new Date().toLocaleTimeString(), name, detail })
  events.value.length = Math.min(events.value.length, 12)
}

const InsertDate = Extension.create({
  name: 'insertDate',
  addCommands() { return { insertToday: () => ({ commands }) => commands.insertContent(new Date().toISOString().slice(0, 10)) } },
  addKeyboardShortcuts() { return { 'Mod-Alt-d': () => this.editor.commands.insertToday() } },
})
const customExtensions = [InsertDate]
const extRef = ref(null)
const extValue = ref(null)

const shared = ref(clone(sampleEnvelope))

const width = ref('100%')
const widthItems = [{ label: '360px (phone)', value: '360px' }, { label: '640px (tablet)', value: '640px' }, { label: '100%', value: '100%' }]
const layoutValue = ref(null)

const roEditable = ref(false)
const roValue = ref(clone(sampleEnvelope))
</script>

<template>
    <div class="demo">
      <aside class="demo__nav" aria-label="Usage cases">
        <h1 class="demo__title">RVisualEditor</h1>
        <nav>
          <UButton
            v-for="c in cases"
            :key="c.value"
            :icon="c.icon"
            :label="c.label"
            :variant="current === c.value ? 'soft' : 'ghost'"
            color="neutral"
            size="sm"
            block
            class="demo__navbtn"
            :aria-current="current === c.value ? 'page' : undefined"
            @click="current = c.value"
          />
        </nav>
      </aside>

      <main class="demo__main">
          <section v-if="current === 'notion'" class="demo__case">
            <p class="demo__note"><strong>Notion mode:</strong> no toolbar, seamless page. Click the page and press <kbd>/</kbd> — every tool appears instantly. Hover a block for <b>+</b> and the drag grip; select text for the floating toolbar; drag files from your desktop onto the page.</p>
            <RVisualEditor v-model="notion" :uploader="demoUploader" :options="{ ...demoOptions, toolbar: false, footer: false, appearance: 'notion' ,fullscreen: true}" :min-height="520" />
          </section>

          <section v-else-if="current === 'ribbon'" class="demo__case">
            <p class="demo__note"><strong>Word-style ribbon:</strong> Home / Insert / Layout tabs with labelled groups, a quick-access undo/redo, a table-size grid picker, and a contextual <b>Table</b> tab that appears when the cursor is in a table (double-click a tab or use the chevron to collapse). The optional footer shows counts and upload status.</p>
            <RVisualEditor v-model="ribbon" :uploader="demoUploader" :options="{ ...demoOptions, toolbarMode: 'ribbon', appearance: 'paper', zoom: true }" :min-height="560" />
          </section>

          <section v-else-if="current === 'compact'" class="demo__case">
            <p class="demo__note"><strong>Compact toolbar</strong> (<code>toolbarMode: 'compact'</code>), like Nuxt UI's UEditor: one wrapping row, icon-only buttons with tooltips and shortcut hints, Insert tools inline.</p>
            <RVisualEditor v-model="compactDoc" :uploader="demoUploader" :options="{ ...demoOptions, toolbarMode: 'compact', appearance: 'notion' }" :min-height="420" />
          </section>

          <section v-else-if="current === 'footer'" class="demo__case">
            <p class="demo__note">The footer is optional: <code>options.footer</code>. Inside it, <code>wordCount</code> and <code>zoom</code> are independent flags.</p>
            <div class="demo__row">
              <USwitch v-model="footerOn" label="footer" />
              <USwitch v-model="footerCounts" label="wordCount" />
              <USwitch v-model="footerZoom" label="zoom" />
            </div>
            <RVisualEditor :key="`${footerOn}-${footerCounts}-${footerZoom}`" v-model="footerDoc" :uploader="demoUploader" :options="{ ...demoOptions, footer: footerOn, wordCount: footerCounts, zoom: footerZoom }" :min-height="360" />
          </section>

          <section v-else-if="current === 'robust'" class="demo__case">
            <p class="demo__note">Null, undefined, empty strings/arrays/objects, invalid options, junk extensions and hostile content. None of these may throw; bad values fall back to safe defaults (open the console in dev to see the warnings).</p>
            <div class="demo__robust">
              <div v-for="c in robustCases" :key="c.label">
                <p class="demo__note"><code>{{ c.label }}</code></p>
                <RVisualEditor v-bind="c.props" :min-height="120" :options="{ toolbar: false, footer: false, blockHandle: false, ...(c.props.options ?? {}) }" />
              </div>
            </div>
          </section>

          <section v-else-if="current === 'uploads'" class="demo__case">
            <p class="demo__note">Drop, paste (screenshots) or pick files. Try a file named <code>fail.png</code> to see the error + Retry state, remove a block mid-upload to abort it, or exceed the 2 MB limit. Resize images with the side handles; click one for align / alt text / delete; type a caption below it.</p>
            <div class="demo__row">
              <span class="demo__note">Allowed kinds:</span>
              <UCheckboxGroup v-model="uploadKinds" :items="kindItems" orientation="horizontal" />
            </div>
            <RVisualEditor mode='ribbon'
              :key="uploadKinds.join()"
              ref="uploadEd"
              v-model="uploadDoc"
              :uploader="demoUploader"
              :allowed-media="uploadKinds"
              :max-file-size="2 * 1024 * 1024"
              :options="{ ...demoOptions }"
              :min-height="420"
              @upload="logUpload"
              @error="logError"
              @media-select="(m) => log('media-select', m.kind)"
            />
            <div class="demo__buttons">
              <UButton size="sm" icon="i-lucide-upload" label="pickFiles()" @click="uploadEd?.pickFiles(null)" />
              <UButton size="sm" color="neutral" label="insertImage(url)" @click="uploadEd?.insertImage('https://picsum.photos/seed/rv/900/500')" />
              <UButton size="sm" color="neutral" :label="`isUploading(): ${uploadEd?.isUploading?.() ?? false}`" />
            </div>
            <ul class="demo__log"><li v-for="e in uploadLog" :key="e.id"><time>{{ e.t }}</time> <strong>{{ e.text }}</strong></li></ul>
          </section>

          <section v-else-if="current === 'uploadapi'" class="demo__case">
            <p class="demo__note">Production wiring. The component never stores binaries in the document: it uploads, then keeps only the persistent URL returned by your server. Blob/data URLs are rejected unless <code>allowBlobUrls</code> is set (demos only). SVGs are sanitized client-side before upload; your server must still validate content and serve user files safely.</p>
            <pre class="demo__code">{{ uploadAPIExample }}</pre>
          </section>

          <section v-else-if="current === 'progress'" class="demo__case">
            <p class="demo__note">Every editor upload is registered in the shared <code>useUploadProgress()</code> store, so the same <code>BtnShowUploadProcess</code> used across the app tracks files from this editor. The editor footer includes the same button automatically.</p>
            <div class="demo__row">
              <BtnShowUploadProcess />
              <span class="demo__note">isUploading: {{ progressStore.isUploading }} · files: {{ progressStore.allFileMoreUpload.length }} · completed: {{ Object.keys(progressStore.fileCompleted).length }} · failed: {{ progressStore.fileError.length }}</span>
            </div>
            <RVisualEditor ref="progressEd" v-model="progressDoc" :uploader="demoUploader" :options="{ ...demoOptions, wordCount: true }" :min-height="320" @upload-complete="onProgressComplete" />
            <pre class="demo__code">{{ pretty(progressComplete ?? { hint: 'Upload a file to update the shared progress store.' }) }}</pre>
          </section>

          <section v-else-if="current === 'save'" class="demo__case">
            <p class="demo__note">With <code>deferUpload: true</code>, inserted media stays local until save. Call <code>flushPendingUploads()</code>, wait for uploads to settle, then persist <code>getJSON()</code> plus the <code>fileId</code> values collected from the <code>upload</code> event.</p>
            <div class="demo__buttons">
              <UButton size="sm" icon="i-lucide-cloud-upload" label="flushPendingUploads() + snapshot" :disabled="saveEd?.isUploading?.() ?? false" @click="flushAndSave" />
              <UButton size="sm" color="neutral" :label="`isUploading(): ${saveEd?.isUploading?.() ?? false}`" />
              <UButton size="sm" color="neutral" :label="`queue: ${saveEd?.getUploadQueue?.()?.length ?? 0}`" />
            </div>
            <RVisualEditor ref="saveEd" v-model="saveDoc" :api="saveApi" :uploader="demoUploader" :options="{ ...demoOptions, footer: false, wordCount: true }" :min-height="340" @upload="trackSaveUpload" @upload-complete="onSaveComplete" />
            <pre class="demo__code">{{ saveResult || 'Upload a file, then click flush + snapshot.' }}</pre>
          </section>

          <section v-else-if="current === 'design'" class="demo__case">
            <p class="demo__note">The Fabric design canvas is built in and loaded on first use. Enable <code>canvas</code> plus the related media flags, configure the default page with <code>canvasOptions</code>, and persist <code>design-saved</code> to reopen designs later.</p>
            <RVisualEditor v-model="designDoc" :uploader="demoUploader" :canvas-options="canvasOptions" :options="{ ...demoOptions, appearance: 'paper', toolbarMode: 'ribbon', canvas: true, shapes: true, drawing: true, floatingMedia: true, wordCount: true }" :min-height="520" @design-saved="onDesignSaved" />
            <pre class="demo__code">{{ designSaved ? pretty(designSaved) : 'Insert or edit an image with the Design tool.' }}</pre>
          </section>

          <section v-else-if="current === 'novel'" class="demo__case">
            <p class="demo__note">The production recipe used by <code>NovelContentCreate.vue</code>: real file-explorer uploads, deferred chapter saves, and file IDs mapped into the chapter payload.</p>
            <pre class="demo__code">{{ novelRecipe }}</pre>
          </section>

          <section v-else-if="current === 'featureRich'" class="demo__case">
            <p class="demo__note"><strong>Feature-rich builder preset:</strong> grouped menu bar, multiline toolbar, more tools, source editing, find/replace, accessibility check, export tools, file-link preview/download, and a floating table dock that moves above or below the table depending on viewport space. Open the Link tool on <code>sample.pdf</code> to try the file actions.</p>
            <RVisualEditor v-model="featureRichDoc" :uploader="demoUploader" :options="{ ...demoOptions, preset: 'featureRich' }" :min-height="560" />
          </section>

          <section v-else-if="current === 'fullscreen'" class="demo__case">
            <p class="demo__note">Enable the full-screen button with <code>options.fullscreen: true</code>. Choose <code>options.fullscreenMode: 'body'</code> (default) to fill the browser body like CKEditor, or <code>'window'</code> to use the native Fullscreen API. It also lives under <b>View → Full screen</b> and can be controlled from the exposed <code>toggleFullscreen()</code> / <code>isFullscreen()</code> API.</p>
            <div class="demo__buttons">
              <USelect v-model="fullscreenMode" :items="fullscreenModeItems" class="demo__select" aria-label="Fullscreen mode" />
              <UButton size="sm" icon="i-lucide-maximize-2" label="toggleFullscreen()" @click="fullscreenEd?.toggleFullscreen?.()" />
              <UButton size="sm" color="neutral" :label="`isFullscreen(): ${fullscreenActive}`" />
            </div>
            <RVisualEditor ref="fullscreenEd" v-model="fullscreenDoc" :uploader="demoUploader" :options="{ ...demoOptions, fullscreen: true, fullscreenMode }" :min-height="480" @fullscreen="(active) => fullscreenActive = active" />
          </section>

          <section v-else-if="current === 'basic'" class="demo__case">
            <p class="demo__note">Minimal usage. <code>v-model</code> binds the persisted envelope.</p>
            <RVisualEditor v-model="basic" :uploader="demoUploader" :options="{ ...demoOptions }" />
            <details class="demo__debug" open><summary>v-model value</summary><pre>{{ pretty(basic) }}</pre></details>
          </section>

          <section v-else-if="current === 'draft'" class="demo__case">
            <p class="demo__note">Bind <code>v-model</code> to <code>useStorage</code>; reload the page and the draft is restored (media blob URLs do not survive a reload in this demo).</p>
            <div class="demo__row">
              <UButton size="sm" color="error" variant="soft" icon="i-lucide-trash-2" label="Discard draft" @click="draft = null" />
              <span class="demo__note">{{ draftSavedAt ? `Saved locally at ${draftSavedAt}` : 'No local changes yet' }}</span>
            </div>
            <RVisualEditor v-model="draft" :uploader="demoUploader" :options="{ ...demoOptions }" />
          </section>

          <section v-else-if="current === 'form'" class="demo__case">
            <p class="demo__note">The editor as a form field: validate with <code>getText()</code> and <code>isUploading()</code>, submit <code>getJSON()</code>.</p>
            <UInput v-model="formTitle" placeholder="Title" aria-label="Title" />
            <RVisualEditor ref="formEd" v-model="formDoc" :uploader="demoUploader" :options="{ ...demoOptions }" :min-height="260" />
            <div class="demo__row"><UButton label="Submit" icon="i-lucide-send" @click="submitForm" /></div>
            <ul v-if="formErrors.length" class="demo__errors" role="alert"><li v-for="e in formErrors" :key="e">{{ e }}</li></ul>
            <pre v-if="formResult" class="demo__code">{{ formResult }}</pre>
          </section>

          <section v-else-if="current === 'output'" class="demo__case">
            <p class="demo__note"><code>output</code> controls what v-model emits: the envelope, sanitized HTML, or both.</p>
            <USelect v-model="output" :items="outputItems" class="demo__select" aria-label="Output mode" />
            <RVisualEditor :key="output" v-model="outValue" :output="output" :options="{ wordCount: true }" :min-height="260" />
            <details class="demo__debug" open><summary>Emitted value ({{ output }})</summary><pre>{{ pretty(outValue) }}</pre></details>
          </section>

          <section v-else-if="current === 'flags'" class="demo__case">
            <p class="demo__note">Flags: <code>true</code>, <code>false</code> (absent), <code>'hidden'</code> (works via shortcuts, not shown), <code>'disabled'</code> (shown, inert). Read at creation, so presets remount with <code>:key</code>.</p>
            <USelect v-model="preset" :items="presetItems" class="demo__select" aria-label="Feature preset" />
            <pre class="demo__code">:options="{{ pretty(presets[preset]) }}"</pre>
            <RVisualEditor :key="preset" v-model="flagValue" :uploader="demoUploader" :options="{ ...demoOptions, ...presets[preset], wordCount: true }" :min-height="320" />
          </section>

          <section v-else-if="current === 'themes'" class="demo__case demo__grid">
            <div><p class="demo__note"><code>theme="light"</code></p><RVisualEditor v-model="themeValue" theme="light" :options="{ appearance: 'paper' }" :min-height="300" /></div>
            <div><p class="demo__note"><code>theme="dark"</code> (independent of the page)</p><RVisualEditor v-model="themeValue" theme="dark" :options="{ appearance: 'paper' }" :min-height="300" /></div>
            <div class="demo__wide"><p class="demo__note"><code>theme="system"</code> (default): host color mode, else OS preference.</p><RVisualEditor v-model="themeValue" theme="system" :min-height="300" /></div>
          </section>

          <section v-else-if="current === 'control'" class="demo__case">
            <p class="demo__note">Everything exposed through a template ref; safe on a destroyed or uninitialized editor.</p>
            <div class="demo__buttons">
              <UButton size="sm" label="getText()" @click="call('getText()', () => ed?.getText())" />
              <UButton size="sm" label="getHTML()" @click="call('getHTML()', () => ed?.getHTML())" />
              <UButton size="sm" label="getJSON()" @click="call('getJSON()', () => ed?.getJSON())" />
              <UButton size="sm" color="neutral" label="setContent(HTML)" @click="ed?.setContent(sampleHtml)" />
              <UButton size="sm" color="neutral" label="setContent(envelope)" @click="ed?.setContent(sampleEnvelope)" />
              <UButton size="sm" color="neutral" label="clearContent()" @click="ed?.clearContent()" />
              <UButton size="sm" color="neutral" label="undo()" @click="ed?.undo()" />
              <UButton size="sm" color="neutral" label="redo()" @click="ed?.redo()" />
              <UButton size="sm" color="neutral" label="focus('end')" @click="ed?.focus('end')" />
              <UButton size="sm" color="neutral" label="blur()" @click="ed?.blur()" />
              <UButton size="sm" color="neutral" :label="`setEditable(${!runtimeEditable})`" @click="setEditable(!runtimeEditable)" />
              <UButton size="sm" color="error" variant="soft" label="destroy()" @click="ed?.destroy()" />
            </div>
            <RVisualEditor ref="ed" v-model="apiValue" :options="{ wordCount: true }" :min-height="320" />
            <pre class="demo__code">{{ apiResult || 'Call a getter to see its result here.' }}</pre>
          </section>

          <section v-else-if="current === 'events'" class="demo__case">
            <p class="demo__note">Events: <code>ready</code>, <code>update</code> (every change), <code>change</code> (debounced, serialized), <code>focus</code>, <code>blur</code>.</p>
            <RVisualEditor v-model="eventValue" :min-height="240" @ready="log('ready')" @update="log('update')" @change="(v) => log('change', `${v.doc.content.length} top-level nodes`)" @focus="log('focus')" @blur="log('blur')" />
            <ul class="demo__log"><li v-for="e in events" :key="e.id"><time>{{ e.t }}</time> <strong>{{ e.name }}</strong> <span>{{ e.detail }}</span></li></ul>
          </section>

          <section v-else-if="current === 'extension'" class="demo__case">
            <p class="demo__note">Pass your own Tiptap extensions via <code>:extensions</code>. This one adds a command and <kbd>Ctrl/Cmd + Alt + D</kbd> to insert today's date.</p>
            <div class="demo__buttons"><UButton size="sm" label="Insert today (command)" @click="extRef?.getEditor()?.chain().focus().insertToday().run()" /></div>
            <RVisualEditor ref="extRef" v-model="extValue" :extensions="customExtensions" :min-height="240" />
          </section>

          <section v-else-if="current === 'sync'" class="demo__case demo__grid">
            <p class="demo__note demo__wide">Two editors bound to one <code>v-model</code>; edits flow across without echo loops.</p>
            <RVisualEditor v-model="shared" :min-height="300" :options="{ toolbar: false }" />
            <RVisualEditor v-model="shared" :min-height="300" :options="{ toolbar: false }" />
          </section>

          <section v-else-if="current === 'layout'" class="demo__case">
            <p class="demo__note">The layout adapts to the editor's own container width (compact under 720px: gutter handles hidden, toolbar collapses into the <b>⋯</b> row).</p>
            <USelect v-model="width" :items="widthItems" class="demo__select" aria-label="Container width" />
            <div :style="{ width, maxWidth: '100%' }"><RVisualEditor v-model="layoutValue" :min-height="300" :max-width="560" :options="{ appearance: 'paper' }" /></div>
          </section>

          <section v-else-if="current === 'readonly'" class="demo__case">
            <p class="demo__note">The <code>editable</code> prop is reactive: toolbar, menus, handles and drops disable themselves.</p>
            <USwitch v-model="roEditable" label="Editable" />
            <RVisualEditor v-model="roValue" :editable="roEditable" :min-height="300" :options="{ wordCount: true }" />
          </section>

      </main>
    </div>
</template>

<style lang="scss">
.demo { display: grid; grid-template-columns: 15rem minmax(0, 1fr); gap: 24px; max-width: 1280px; margin: 0 auto; padding: 24px 16px 64px; }
.demo__nav { position: sticky; top: 16px; align-self: start; display: grid; gap: 12px; nav { display: grid; gap: 2px; } }
.demo__navbtn { justify-content: flex-start; }
.demo__title { font-size: 1.2rem; font-weight: 650; }
.demo__main { min-width: 0; }
.demo__case { display: grid; gap: 12px; }
.demo__grid { grid-template-columns: 1fr 1fr; }
.demo__wide { grid-column: 1 / -1; }
.demo__robust { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.demo__row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.demo__note { font-size: 0.875rem; opacity: 0.85; margin: 0 0 6px; }
.demo__select { width: 14rem; }
.demo__buttons { display: flex; flex-wrap: wrap; gap: 8px; }
.demo__errors { color: var(--ui-error); font-size: 0.875rem; padding-left: 1.1rem; }
.demo__code, .demo__debug pre { max-height: 320px; overflow: auto; padding: 10px 12px; font-size: 12px; border: 1px solid var(--ui-border); border-radius: 8px; white-space: pre-wrap; }
.demo__log { list-style: none; padding: 0; margin: 0; font-size: 12px; display: grid; gap: 2px; }
.demo__log time { opacity: 0.6; margin-right: 6px; }
kbd { padding: 1px 6px; border: 1px solid var(--ui-border); border-radius: 4px; font-size: 0.8em; }
@media (max-width: 900px) {
  .demo { grid-template-columns: 1fr; }
  .demo__nav { position: static; nav { grid-auto-flow: column; overflow-x: auto; } }
  .demo__grid, .demo__robust { grid-template-columns: 1fr; }
}
</style>