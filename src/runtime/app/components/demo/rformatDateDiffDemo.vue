<script setup>
import { ref } from 'vue'
import rformatDateDiff, { DATE_PATTERNS } from '../../utils/rformatDateDiff'

const SAMPLE = '2026-11-17T13:12:54'
const REF = new Date('2026-11-21T10:00:00') // fixed "now" -> stable relative demo

const LOCALES = [
  { label: 'English', value: 'en' },
  { label: 'ខ្មែរ', value: 'km' },
  { label: '中文', value: 'zh' },
  { label: 'Français', value: 'fr' },
  { label: '日本語', value: 'ja' },
]
const PATTERNS = [...Object.keys(DATE_PATTERNS), 'relative']

/* 1. Playground */
const value = ref(SAMPLE)
const pattern = ref('datetimeFull')
const locale = ref('en')
const utc = ref(false)
const playground = computed(() =>
  rformatDateDiff(value.value, pattern.value, { locale: locale.value, utc: utc.value, to: REF }))

/* helpers */
const show = (v) =>
  v instanceof Date ? `new Date('${v.toISOString()}')`
  : v === undefined ? 'undefined'
  : typeof v === 'number' && Number.isNaN(v) ? 'NaN'
  : JSON.stringify(v)

const run = (rows) => rows.map((r) => ({
  ...r,
  input: show(r.input),
  out: rformatDateDiff(r.input, r.pattern, r.opts),
}))

/* 2. Presets x locales */
const presetRows = computed(() => Object.entries(DATE_PATTERNS).map(([name, p]) => ({
  name, pattern: p,
  en: rformatDateDiff(SAMPLE, name, { locale: 'en' }),
  km: rformatDateDiff(SAMPLE, name, { locale: 'km' }),
  zh: rformatDateDiff(SAMPLE, name, { locale: 'zh' }),
})))
const presetCols = [
  { accessorKey: 'name', header: 'Preset' },
  { accessorKey: 'pattern', header: 'Pattern' },
  { accessorKey: 'en', header: 'en' },
  { accessorKey: 'km', header: 'km' },
  { accessorKey: 'zh', header: 'zh' },
]

/* 3. Relative */
const ago = (ms) => new Date(REF.getTime() + ms)
const S = 1e3, M = 60 * S, H = 60 * M, D = 24 * H
const relRows = computed(() => run([
  ['30 seconds ago', -30 * S], ['5 minutes ago', -5 * M], ['3 hours ago', -3 * H],
  ['yesterday', -1 * D], ['3 days ago', -3 * D], ['2 months ago', -62 * D],
  ['2 years ago', -740 * D], ['in 22 hours', 22 * H], ['tomorrow', 1 * D], ['in 10 days', 10 * D],
].flatMap(([label, ms]) => ['en', 'km', 'zh'].map((l) => ({
  label: `${label} [${l}]`, input: ago(ms), pattern: 'relative', opts: { to: REF, locale: l },
})))))

/* 4. Input types */
const inputRows = computed(() => run([
  { label: 'ISO string', input: '2026-11-17T13:12:54', pattern: 'datetime' },
  { label: 'ISO + offset', input: '2026-11-17T13:12:54+07:00', pattern: 'datetime' },
  { label: 'Space separated', input: '2026-11-17 13:12:54', pattern: 'datetime' },
  { label: 'Date only (local, no TZ shift)', input: '2026-11-17', pattern: 'datetime' },
  { label: 'Date object', input: new Date('2026-11-17T13:12:54'), pattern: 'datetime' },
  { label: 'Timestamp (ms)', input: 1795199627537, pattern: 'datetime' },
  { label: 'No TZ, local (default)', input: '2026-11-17T13:12:54', pattern: 'iso' },
  { label: 'No TZ, { utc: true }', input: '2026-11-17T13:12:54', pattern: 'iso', opts: { utc: true } },
]))

/* 5. Custom patterns */
const customRows = computed(() => run([
  'dd/MM/yy', 'EEEE, d MMM yyyy', "yyyy-MM-dd'T'HH:mm", 'QQQ yyyy', 'dddd dd-mmm-yyyy', "d MMMM yyyy 'at' HH:mm", 'hh:mm a',
].map((p) => ({ label: p, input: SAMPLE, pattern: p }))
  .concat([{ label: 'km: dateFull', input: SAMPLE, pattern: 'dateFull', opts: { locale: 'km' } },
           { label: 'km: readableFull', input: SAMPLE, pattern: 'readableFull', opts: { locale: 'km' } }])))

/* 6. Invalid input (fires dev toasts; same message toasts once) */
const invalidRows = ref([])
const runInvalid = () => {
  invalidRows.value = run([
    { label: 'null', input: null }, { label: 'undefined', input: undefined }, { label: 'empty string', input: '' },
    { label: 'text', input: 'abc' }, { label: 'impossible date', input: '2026-13-45' },
    { label: 'NaN', input: NaN }, { label: 'object', input: {} }, { label: 'boolean', input: true },
    { label: 'unknown preset', input: SAMPLE, pattern: 'dateLng' },
    { label: 'pattern not string', input: SAMPLE, pattern: 5 },
    { label: 'bad locale', input: SAMPLE, pattern: 'dateLong', opts: { locale: 'x@@' } },
  ])
}
const cols = [
  { accessorKey: 'label', header: 'Case' },
  { accessorKey: 'input', header: 'Input' },
  { accessorKey: 'out', header: 'Output' },
]
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <div>
      <h1 class="text-2xl font-bold">rformatDateDiff demo</h1>
      <p class="text-muted text-sm">Sample: <code>{{ SAMPLE }}</code> · Relative reference: <code>{{ REF.toISOString() }}</code></p>
    </div>

    <ClientOnly>
      <RCard>
        <template #header><h2 class="font-semibold">1. Playground</h2></template>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UFormField label="Value"><UInput v-model="value" class="w-full" /></UFormField>
          <UFormField label="Pattern / preset">
            <UInputMenu v-model="pattern" :items="PATTERNS" create-item class="w-full"
                        @create="(p) => (pattern = p)" />
          </UFormField>
          <UFormField label="Locale"><USelect v-model="locale" :items="LOCALES" class="w-full" /></UFormField>
          <UFormField label="utc"><USwitch v-model="utc" /></UFormField>
        </div>
        <p class="mt-4 text-xl font-mono">{{ playground || '∅ (empty)' }}</p>
      </RCard>

      <RCard>
        <template #header><h2 class="font-semibold">2. All presets × locales</h2></template>
        <UTable :data="presetRows" :columns="presetCols" />
      </RCard>

      <RCard>
        <template #header><h2 class="font-semibold">3. Relative (fixed reference time)</h2></template>
        <UTable :data="relRows" :columns="cols" />
      </RCard>

      <RCard>
        <template #header><h2 class="font-semibold">4. Input types</h2></template>
        <UTable :data="inputRows" :columns="cols" />
      </RCard>

      <RCard>
        <template #header><h2 class="font-semibold">5. Custom patterns &amp; localized tokens</h2></template>
        <UTable :data="customRows" :columns="cols" />
      </RCard>

      <RCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">6. Invalid input (never throws)</h2>
            <UButton icon="i-lucide-play" @click="runInvalid">Run</UButton>
          </div>
        </template>
        <p class="text-sm text-muted mb-3">
          Empty values are silent. Everything else returns <code>''</code> and shows a dev toast (each message once per page load).
        </p>
        <UTable v-if="invalidRows.length" :data="invalidRows" :columns="cols" />
      </RCard>
    </ClientOnly>
  </UContainer>
</template>