<!-- app/pages/demo/format-date-diff.vue  ->  /demo/format-date-diff
  Requires <UApp> in app.vue (toasts). Adjust the two import paths if your utils live elsewhere.
  Wrapped in <ClientOnly>: dates are timezone-dependent, so this avoids hydration mismatches. -->
<script setup>
import formatDateDiff, { DATE_FORMATS } from '../../utils/formatDateDiff'
import { DATE_FORMATS as RDATE_FORMATS } from '../../utils/rdate'

useHead({ title: 'formatDateDiff demo' })

const sample = { CreatedAt: '2026-11-17T13:12:54', UpdatedAt: '2026-11-17T13:33:59' }
const LANGS = ['en', 'km', 'zh']

const cls = {
  th: 'text-left text-xs font-medium text-muted py-2 pr-4 whitespace-nowrap',
  td: 'py-2 pr-4 align-top',
  tr: 'border-t border-default',
  code: 'font-mono text-xs text-muted whitespace-nowrap',
}

// one-liner used by every table below (notify:false keeps the tables toast-free)
const out = (value, format, lang) => formatDateDiff(value, format, { lang, notify: false }).toString()
const outPattern = (pattern, lang) => formatDateDiff(sample.CreatedAt, 'default', { lang, notify: false }).format(pattern)

// ---------- 1. Playground ----------
const input = ref(sample.CreatedAt)
const shape = ref('default')
const lang = ref('auto')
const fallback = ref('-')
const pattern = ref('dddd dd-mmm-yyyy hh:mm a')

const shapeItems = [...new Set([...Object.keys(DATE_FORMATS), ...Object.keys(RDATE_FORMATS)])]
const langItems = [
  { label: 'Auto (project language)', value: 'auto' },
  { label: 'English', value: 'en' },
  { label: 'ខ្មែរ', value: 'km' },
  { label: '中文', value: 'zh' },
]
const chips = [
  { label: 'CreatedAt', value: sample.CreatedAt },
  { label: 'UpdatedAt', value: sample.UpdatedAt },
  { label: 'Empty', value: '' },
  { label: 'abc', value: 'abc' },
  { label: '2026-13-45', value: '2026-13-45' },
]

const opts = computed(() => ({
  fallback: fallback.value,
  notify: false,
  lang: lang.value === 'auto' ? undefined : lang.value,
}))
const result = computed(() => formatDateDiff(input.value, shape.value, opts.value))
const patternResult = computed(() => result.value.format(pattern.value))
const call = computed(() => {
  const l = lang.value === 'auto' ? '' : `, { lang: '${lang.value}' }`
  return `formatDateDiff(${JSON.stringify(input.value)}, '${shape.value}'${l})`
})

// ---------- 2. Usage forms ----------
const u = {
  plain: 'formatDateDiff(CreatedAt)',
  value: 'formatDateDiff(CreatedAt).value',
  format: "formatDateDiff(CreatedAt).format('dd/MM/yy')",
  literal: '`Created: ${formatDateDiff(CreatedAt)}`',
  concat: "'Created: ' + formatDateDiff(CreatedAt)",
  string: 'String(formatDateDiff(CreatedAt))',
  attr: ":title=\"formatDateDiff(CreatedAt, 'date')\"",
}
const asString = String(formatDateDiff(sample.CreatedAt))

// ---------- 4. Patterns ----------
const patterns = [
  'dd/MM/yy',
  'dd/MM/yyyy HH:mm',
  'dddd dd-mmm-yyyy hh:mm a',
  'dddd dd-mmmm-yyyy hh:mm a',
  'EEEE, dd MMMM yyyy',
  'EEE d MMM',
  'mmmm yyyy',
  "yyyy-MM-dd'T'HH:mm:ss",
  'yyyy年MM月dd日',
  'hh:mm a',
]

// ---------- 6. Option objects ----------
const objects = [
  { code: '{ date: true, time: true }', value: { date: true, time: true } },
  { code: '{ date: true, time: false }', value: { date: true, time: false } },
  { code: '{ date: false, time: true }', value: { date: false, time: true } },
  { code: "{ units: ['years', 'months'] }", value: { units: ['years', 'months'] } },
  { code: "{ units: ['hours', 'minutes', 'seconds'] }", value: { units: ['hours', 'minutes', 'seconds'] } },
]

// ---------- 7. Input safety ----------
const EMPTY = '∅'
const cases = [
  { code: 'null', value: null },
  { code: 'undefined', value: undefined },
  { code: "''", value: '' },
  { code: "'   '", value: '   ' },
  { code: "'abc'", value: 'abc' },
  { code: "'2026-13-45'", value: '2026-13-45' },
  { code: "'1700000000000' (numeric string)", value: '1700000000000' },
  { code: 'NaN', value: NaN },
  { code: "new Date('nope')", value: new Date('nope') },
  { code: '{}', value: {} },
  { code: '[]', value: [] },
  { code: 'true', value: true },
  { code: "'2026-11-17T13:12:54'", value: '2026-11-17T13:12:54' },
  { code: "'2026-11-17 13:12:54' (space)", value: '2026-11-17 13:12:54' },
  { code: "'2026-11-17T13:12:54+00:00'", value: '2026-11-17T13:12:54+00:00' },
  { code: '1763384400000 (ms timestamp)', value: 1763384400000 },
  { code: 'new Date(2026, 10, 17, 13, 12, 54)', value: new Date(2026, 10, 17, 13, 12, 54) },
]
const isBlank = v => v == null || (typeof v === 'string' && !v.trim())
const safety = computed(() =>
  cases.map((c) => {
    const text = formatDateDiff(c.value, 'default', { fallback: EMPTY, notify: false }).toString()
    const status = isBlank(c.value)
      ? { label: 'empty, silent', color: 'neutral' }
      : text === EMPTY
        ? { label: 'invalid, warns', color: 'warning' }
        : { label: 'valid', color: 'success' }
    return { ...c, text, status }
  }),
)

// dev toasts (util shows them only when notify is true; default is dev mode only)
const toastCases = [
  { label: 'Invalid date', run: () => formatDateDiff('2026-13-45', 'default', { notify: true }) },
  { label: 'Wrong type', run: () => formatDateDiff({}, 'default', { notify: true }) },
  { label: 'Unknown pattern', run: () => formatDateDiff(sample.CreatedAt, 'foo', { notify: true }) },
  { label: 'Bad format argument', run: () => formatDateDiff(sample.CreatedAt, 123, { notify: true }) },
]
const custom = ref('not-a-date')

// ---------- 8. Table ----------
const rows = [
  { id: 1, name: 'Order 1001', CreatedAt: '2026-11-17T13:12:54', UpdatedAt: '2026-11-17T13:33:59' },
  { id: 2, name: 'Order 1002', CreatedAt: '2026-11-18 09:05:00', UpdatedAt: null },
  { id: 3, name: 'Order 1003', CreatedAt: 1763384400000, UpdatedAt: '' },
  { id: 4, name: 'Order 1004', CreatedAt: 'not-a-date', UpdatedAt: undefined },
]
const cell = v => formatDateDiff(v, 'datetimeShort', { fallback: '-', notify: false }).toString()
const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'CreatedAt', header: 'Created', cell: ({ row }) => cell(row.original.CreatedAt) },
  { accessorKey: 'UpdatedAt', header: 'Updated', cell: ({ row }) => cell(row.original.UpdatedAt) },
]
</script>

<template>
  <UContainer class="max-w-5xl space-y-6 py-10">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold text-highlighted">formatDateDiff</h1>
      <p class="max-w-prose text-sm text-muted">
        Shape formats, localized tokens in km, en and zh, and safe handling of bad input.
        Every output on this page is computed live by the real utility.
      </p>
    </header>

    <ClientOnly>
      <!-- 1. Playground -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Playground</h2>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Date value" help="Date, ms timestamp or ISO string">
            <UInput v-model="input" class="w-full" />
          </UFormField>
          <UFormField label="Shape or rdate format key">
            <USelect v-model="shape" :items="shapeItems" class="w-full" />
          </UFormField>
          <UFormField label="Language">
            <USelect v-model="lang" :items="langItems" class="w-full" />
          </UFormField>
          <UFormField label="Fallback" help="Returned for empty or invalid input">
            <UInput v-model="fallback" class="w-full" />
          </UFormField>
          <UFormField label="Pattern for .format()" class="sm:col-span-2">
            <UInput v-model="pattern" class="w-full" />
          </UFormField>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            v-for="c in chips"
            :key="c.label"
            :label="c.label"
            size="xs"
            color="neutral"
            variant="outline"
            @click="input = c.value"
          />
        </div>

        <div class="mt-5 space-y-3 rounded-md bg-elevated p-4">
          <div>
            <p class="font-mono text-xs text-muted">{{ call }}</p>
            <p class="text-lg text-highlighted">{{ result.value }}</p>
          </div>
          <div>
            <p class="font-mono text-xs text-muted">.format('{{ pattern }}')</p>
            <p class="text-lg text-highlighted">{{ patternResult }}</p>
          </div>
        </div>
      </RCard>

      <!-- 2. Usage forms -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Using it in templates</h2>
        </template>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-muted">created_at</p>
            <p class="font-semibold text-highlighted">{{ formatDateDiff(sample.CreatedAt) }}</p>
          </div>
          <div>
            <p class="text-sm text-muted">updated_at</p>
            <p class="font-semibold text-highlighted">{{ formatDateDiff(sample.UpdatedAt) }}</p>
          </div>
        </div>

        <div class="mt-5 overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr><th :class="cls.th">Code</th><th :class="cls.th">Result</th></tr></thead>
            <tbody>
              <tr :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ u.plain }}</code></td>
                <td :class="cls.td">{{ formatDateDiff(sample.CreatedAt) }}</td>
              </tr>
              <tr :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ u.value }}</code></td>
                <td :class="cls.td">{{ formatDateDiff(sample.CreatedAt).value }}</td>
              </tr>
              <tr :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ u.format }}</code></td>
                <td :class="cls.td">{{ formatDateDiff(sample.CreatedAt).format('dd/MM/yy') }}</td>
              </tr>
              <tr :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ u.literal }}</code></td>
                <td :class="cls.td">{{ `Created: ${formatDateDiff(sample.CreatedAt)}` }}</td>
              </tr>
              <tr :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ u.concat }}</code></td>
                <td :class="cls.td">{{ 'Created: ' + formatDateDiff(sample.CreatedAt) }}</td>
              </tr>
              <tr :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ u.string }}</code></td>
                <td :class="cls.td">{{ asString }}</td>
              </tr>
              <tr :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ u.attr }}</code></td>
                <td :class="cls.td">
                  <span :title="formatDateDiff(sample.CreatedAt, 'date')" class="cursor-help underline decoration-dotted">
                    Hover for the tooltip
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </RCard>

      <!-- 3. Shapes x languages -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Shape formats in each language</h2>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th :class="cls.th">Call</th>
                <th v-for="l in LANGS" :key="l" :class="cls.th">{{ l }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in Object.keys(DATE_FORMATS)" :key="key" :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">formatDateDiff(CreatedAt, '{{ key }}')</code></td>
                <td v-for="l in LANGS" :key="l" :class="cls.td">{{ out(sample.CreatedAt, key, l) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </RCard>

      <!-- 4. Patterns -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Custom patterns and localized tokens</h2>
        </template>
        <p class="mb-3 text-sm text-muted">
          dddd, ddd, mmmm and mmm (and EEEE, EEE, MMMM, MMM) use the project's day and month names.
          ddd and mmm shorten to 3 letters in English only. Any other date-fns token works as usual.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th :class="cls.th">.format(pattern)</th>
                <th v-for="l in LANGS" :key="l" :class="cls.th">{{ l }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in patterns" :key="p" :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ p }}</code></td>
                <td v-for="l in LANGS" :key="l" :class="cls.td">{{ outPattern(p, l) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </RCard>

      <!-- 5. rdate keys -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">rdate format keys</h2>
        </template>
        <p class="mb-3 text-sm text-muted">
          Any key from rdate's DATE_FORMATS works in .format() and as the format argument.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th :class="cls.th">Key</th>
                <th :class="cls.th">Pattern</th>
                <th v-for="l in LANGS" :key="l" :class="cls.th">{{ l }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, key) in RDATE_FORMATS" :key="key" :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ key }}</code></td>
                <td :class="cls.td"><code :class="cls.code">{{ p }}</code></td>
                <td v-for="l in LANGS" :key="l" :class="cls.td">{{ outPattern(key, l) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </RCard>

      <!-- 6. Option objects -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Option objects</h2>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th :class="cls.th">formatDateDiff(CreatedAt, …)</th>
                <th v-for="l in LANGS" :key="l" :class="cls.th">{{ l }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in objects" :key="o.code" :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ o.code }}</code></td>
                <td v-for="l in LANGS" :key="l" :class="cls.td">{{ out(sample.CreatedAt, o.value, l) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </RCard>

      <!-- 7. Input safety -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Input safety</h2>
        </template>
        <p class="mb-3 text-sm text-muted">
          Fallback is set to {{ EMPTY }} here. Empty values are expected, so they stay silent.
          Invalid values return the fallback and warn.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th :class="cls.th">Input</th>
                <th :class="cls.th">Output</th>
                <th :class="cls.th">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in safety" :key="c.code" :class="cls.tr">
                <td :class="cls.td"><code :class="cls.code">{{ c.code }}</code></td>
                <td :class="cls.td">{{ c.text }}</td>
                <td :class="cls.td">
                  <UBadge :label="c.status.label" :color="c.status.color" variant="subtle" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <USeparator class="my-5" />

        <h3 class="text-sm font-medium text-highlighted">Dev warnings (useToast)</h3>
        <p class="mt-1 text-sm text-muted">
          Each distinct message appears once per page load, so a bad value in a long list doesn't flood the screen.
          Reload to see them again.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            v-for="t in toastCases"
            :key="t.label"
            :label="t.label"
            color="warning"
            variant="subtle"
            size="sm"
            @click="t.run()"
          />
        </div>
        <div class="mt-3 flex max-w-md gap-2">
          <UInput v-model="custom" placeholder="Type any value" class="flex-1" />
          <UButton label="Check value" size="sm" @click="formatDateDiff(custom, 'default', { notify: true })" />
        </div>
      </RCard>

      <!-- 8. Table -->
      <RCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">In a UTable</h2>
        </template>
        <p class="mb-3 text-sm text-muted">
          Row 2 has a null date, row 3 an empty string, row 4 an invalid string. None of them break the table.
        </p>
        <UTable :data="rows" :columns="columns" />
      </RCard>

      <template #fallback>
        <p class="text-sm text-muted">Loading demo…</p>
      </template>
    </ClientOnly>
  </UContainer>
</template>
