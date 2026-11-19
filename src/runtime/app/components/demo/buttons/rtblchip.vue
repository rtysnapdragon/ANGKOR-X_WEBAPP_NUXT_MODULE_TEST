<template>
  <div class="demo-page">
    <header class="demo-page__head">
      <NuxtLink to="/demo/buttons" class="demo-page__back"><i class="ri-arrow-left-s-line" /> All button demos</NuxtLink>
      <h1>RTblChip</h1>
      <p>
        Small removable chips, typically the active filters above a table. It edits the array you give it with
        <code>v-model</code>, reports removals with <code>on-remove</code> and can remember its chips between pages.
      </p>
    </header>

    <DemoLog :entries="entries" @clear="clear" />

    <DemoCase title="Read first" layout="column">
      <ol class="demo-rules">
        <li>
          <b><code>v-model</code> is an array of chips:</b>
          <code>{ value, icon, src, isNotRemove }</code>. <code>value</code> is the label, <code>icon</code> is the
          <i>text</i> shown in the round badge (an initial, not an icon class), <code>src</code> is an avatar image that
          replaces the badge, <code>isNotRemove: true</code> hides the ✕.
        </li>
        <li>
          <b>Removing does not delete the item.</b> The chip emits <code>on-remove</code> with the item, then sets
          <code>item.value = null</code>; empty chips are hidden. Read what you need from the item <i>inside the handler</i>
          (it is blanked right after), and filter the array yourself if you want it gone.
        </li>
        <li>
          <b>Chips with an empty <code>value</code> are hidden</b>, so you can show / hide a chip by setting its value.
        </li>
        <li>
          <b><code>state-key</code> persists the chips</b> in the chip store. On mount, if the store already holds chips for that key
          they <i>replace</i> your array; otherwise yours are saved. Use a unique key per table.
        </li>
        <li>
          <b>Client-only.</b> It reads the page's primary colour from the DOM, so wrap it in <code>&lt;ClientOnly&gt;</code>.
        </li>
      </ol>
    </DemoCase>

    <ClientOnly>
      <DemoCase title="1 · Basic" description="icon is the text inside the round badge. Each chip can be removed with its ✕." :code="code.basic">
        <RTblChip v-model="basic" />
      </DemoCase>

      <DemoCase title="2 · Avatars" description="src replaces the badge with an image." :code="code.avatar">
        <RTblChip v-model="avatars" />
      </DemoCase>

      <DemoCase title="3 · Locked chips" description="isNotRemove hides the ✕, so a mandatory filter cannot be dismissed." :code="code.locked">
        <RTblChip v-model="locked" />
      </DemoCase>

      <DemoCase
        title="4 · on-remove"
        description="The handler gets the item. Read its fields right away: value is set to null immediately afterwards."
        :code="code.remove"
      >
        <RTblChip v-model="removable" @on-remove="onRemove" />
        <RBtn type="reset" icon="reset" label="Restore chips" variant="outline" size="s" :permission="PERMISSION" @click="restore" />

        <template #note>
          Removed chips stay in the array with <code>value: null</code>. Clean up with
          <code>list = list.filter((c) =&gt; c.value)</code> after the event (next case).
        </template>
      </DemoCase>

      <DemoCase title="5 · Clean the array after removal" :code="code.clean">
        <RTblChip v-model="cleanable" @on-remove="onCleanRemove" />
        <small class="demo-muted">Items in the array: <b>{{ cleanable.length }}</b></small>
      </DemoCase>

      <DemoCase title="6 · Show / hide by value" description="A chip with an empty value is not rendered." :code="code.hidden">
        <RTblChip v-model="toggled" />
        <button type="button" class="demo-btn" @click="toggled[1].value = toggled[1].value ? '' : 'Branch: Phnom Penh'">
          Toggle second chip
        </button>
      </DemoCase>

      <DemoCase
        title="7 · Filter chips (typical use)"
        description="Chips mirror the active filters. Removing a chip clears the matching filter."
        layout="column"
        :code="code.filters"
      >
        <RTblChip v-model="filterChips" @on-remove="onFilterRemove" />
        <pre class="demo-json">{{ filters }}</pre>
        <button type="button" class="demo-btn" @click="resetFilters">Reset filters</button>
      </DemoCase>

      <DemoCase
        title="8 · state-key (remember chips)"
        description="With state-key the chips are saved in the chip store and restored when the component mounts again."
        :code="code.stateKey"
      >
        <RTblChip v-model="persisted" state-key="demo-chips" />
        <button type="button" class="demo-btn" @click="forgetStored">Forget stored chips</button>

        <template #note>
          Remove a chip, open another page, then come back: the removed state is restored from the store. Because stored chips
          override your array on mount, change the key (or clear it) when the source data changes.
        </template>
      </DemoCase>

      <DemoCase title="Props, events and chip fields" layout="column" :code="code.api">
        <table class="demo-table">
          <thead><tr><th>Name</th><th>Type</th><th>Notes</th></tr></thead>
          <tbody>
            <tr v-for="r in propRows" :key="r[0]">
              <td><code>{{ r[0] }}</code></td>
              <td>{{ r[1] }}</td>
              <td>{{ r[2] }}</td>
            </tr>
          </tbody>
        </table>

        <template #note>
          The component calls <code>defineEmits("onRemove")</code> with a string; it works, but declaring
          <code>defineEmits(['onRemove'])</code> avoids a dev warning.
        </template>
      </DemoCase>
    </ClientOnly>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'navbar'})

const { entries, push, clear } = useDemoLog()
const PERMISSION = 'demo.buttons'

// tiny inline avatar so the demo needs no network
const avatar = (letter, bg) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="${bg}"/><text x="50%" y="54%" font-size="20" font-family="sans-serif" fill="#fff" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`,
  )}`

// 1 ─ basic
const basic = ref([
  { value: 'Status: Active', icon: 'S' },
  { value: 'Branch: Phnom Penh', icon: 'B' },
  { value: 'Keyword: math', icon: 'K' },
])

// 2 ─ avatars
const avatars = ref([
  { value: 'Sok Dara', src: avatar('S', '#6366f1') },
  { value: 'Chan Nita', src: avatar('C', '#ec4899') },
  { value: 'Vann Rith', src: avatar('V', '#10b981') },
])

// 3 ─ locked
const locked = ref([
  { value: 'Year: 2026', icon: 'Y', isNotRemove: true },
  { value: 'Term: 1', icon: 'T' },
])

// 4 ─ on-remove
const seed = () => [
  { value: 'Alpha', icon: 'A' },
  { value: 'Beta', icon: 'B' },
  { value: 'Gamma', icon: 'G' },
]
const removable = ref(seed())
function onRemove(item) {
  push('on-remove', item.value) // read now: the component sets item.value = null right after
}

function restore() {
  removable.value = seed()
  push('restored')
}

// 5 ─ clean
const cleanable = ref(seed())
function onCleanRemove(item) {
  push('removed', item.value)
  nextTick(() => {
    cleanable.value = cleanable.value.filter((c) => c.value)
  })
}

// 6 ─ show / hide
const toggled = ref([
  { value: 'Always visible', icon: 'A' },
  { value: 'Branch: Phnom Penh', icon: 'B' },
])

// 7 ─ filters
const defaults = () => ({ status: 'Active', branch: 'Phnom Penh', keyword: 'math' })
const filters = reactive(defaults())
const chipsFromFilters = () => [
  { key: 'status', value: filters.status, icon: 'S' },
  { key: 'branch', value: filters.branch, icon: 'B' },
  { key: 'keyword', value: filters.keyword, icon: 'K' },
]
const filterChips = ref(chipsFromFilters())
function onFilterRemove(item) {
  filters[item.key] = '' // item.key stays; only item.value is blanked
  push('filter cleared', item.key)
}
function resetFilters() {
  Object.assign(filters, defaults())
  filterChips.value = chipsFromFilters()
}

// 8 ─ state-key
const persisted = ref([
  { value: 'Saved A', icon: 'A' },
  { value: 'Saved B', icon: 'B' },
])
const chipStore = useRChipDataStore()
function forgetStored() {
  chipStore.setData({ ...(chipStore.data ?? {}), 'demo-chips': undefined })
  persisted.value = [
    { value: 'Saved A', icon: 'A' },
    { value: 'Saved B', icon: 'B' },
  ]
  push('stored chips cleared')
}

const propRows = [
  ['v-model', 'Array<chip>', 'The chips. The component mutates it (item.value = null on remove).'],
  ['stateKey', 'string', 'Persist / restore the chips in the chip store under this key.'],
  ['@on-remove', '(item)', 'Fired before item.value is set to null.'],
  ['chip.value', 'string | null', 'Label. Empty / null = chip hidden.'],
  ['chip.icon', 'string', 'Text in the round badge (an initial). Ignored when src is set.'],
  ['chip.src', 'string', 'Avatar image URL, replaces the badge.'],
  ['chip.isNotRemove', 'boolean', 'Hide the ✕.'],
  ['chip.*', 'any', 'Extra fields (like key) are kept and handed back in on-remove.'],
]

const code = {
  basic: `<RTblChip v-model="chips" />

const chips = ref([
  { value: 'Status: Active',     icon: 'S' },
  { value: 'Branch: Phnom Penh', icon: 'B' },
])`,

  avatar: `const chips = ref([
  { value: 'Sok Dara',  src: '/img/sok.png' },
  { value: 'Chan Nita', src: '/img/nita.png' },
])`,

  locked: `const chips = ref([
  { value: 'Year: 2026', icon: 'Y', isNotRemove: true },   // no X
  { value: 'Term: 1',    icon: 'T' },
])`,

  remove: `<RTblChip v-model="chips" @on-remove="onRemove" />

function onRemove(item) {
  // read it NOW: the component sets item.value = null right after emitting
  console.log(item.value)
}`,

  clean: `function onRemove(item) {
  nextTick(() => {
    chips.value = chips.value.filter((c) => c.value)   // drop the emptied chips
  })
}`,

  hidden: `chips.value[1].value = ''                     // hidden
chips.value[1].value = 'Branch: Phnom Penh'   // visible again`,

  filters: `<RTblChip v-model="chips" @on-remove="onRemove" />

const filters = reactive({ status: 'Active', branch: 'Phnom Penh', keyword: 'math' })
const chips = ref([
  { key: 'status',  value: filters.status,  icon: 'S' },
  { key: 'branch',  value: filters.branch,  icon: 'B' },
  { key: 'keyword', value: filters.keyword, icon: 'K' },
])

function onRemove(item) {
  filters[item.key] = ''      // extra fields such as key are handed back
  reload()
}`,

  stateKey: `<!-- remembered between pages; use a unique key per table -->
<RTblChip v-model="chips" state-key="orders-filters" />

// to forget it (what the component itself uses):
const store = useRChipDataStore()
store.setData({ ...store.data, 'orders-filters': undefined })`,

  api: `<ClientOnly>
  <RTblChip
    v-model="chips"
    state-key="optional-unique-key"
    @on-remove="(item) => {}"
  />
</ClientOnly>

// chip = { value, icon, src, isNotRemove, ...anything }`,
}
</script>

<style lang="scss" scoped>
.demo-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 16px 48px;

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
    color: var(--c-muted, var(--ui-text-muted));
    text-decoration: none;

    &:hover {
      color: var(--c-accent, #6366f1);
    }
  }

  &__head {
    margin-bottom: 16px;

    h1 {
      margin: 6px 0 4px;
      font-size: 24px;
      font-weight: 700;
    }

    p {
      max-width: 72ch;
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--c-muted, var(--ui-text-muted));
    }
  }
}

code {
  padding: 1px 5px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--c-accent, #6366f1) 10%, transparent);
  font-size: 0.92em;
}

.demo-rules {
  margin: 0;
  padding-left: 20px;
  font-size: 13.5px;
  line-height: 1.7;

  li + li {
    margin-top: 6px;
  }
}

.demo-seg {
  display: inline-flex;
  width: fit-content;
  padding: 3px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-text, #000) 6%, transparent);

  button {
    padding: 4px 14px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    font-size: 12.5px;
    cursor: pointer;

    &.is-on {
      background: var(--c-surface, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }
  }
}

.demo-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;

  &__warn {
    font-size: 11px;
    color: #d97706;
  }
}

.demo-muted {
  color: var(--c-muted, var(--ui-text-muted));
  font-size: 12.5px;
}

.demo-btn {
  padding: 5px 12px;
  border: 1px solid var(--c-border, var(--ui-border));
  border-radius: 8px;
  background: transparent;
  font-size: 12.5px;
  cursor: pointer;

  &:hover {
    border-color: var(--c-accent, #6366f1);
    color: var(--c-accent, #6366f1);
  }
}

.demo-json {
  width: 100%;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c-text, #000) 5%, transparent);
  font-size: 12px;
}

.demo-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.demo-input {
  height: 36px;
  min-width: 220px;
  padding: 0 12px;
  border: 1px solid var(--c-border, var(--ui-border));
  border-radius: 10px;
  background: transparent;
  font-size: 13.5px;
}

.demo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;

  th,
  td {
    padding: 7px 10px;
    border-bottom: 1px solid var(--c-border, var(--ui-border));
    text-align: left;
    vertical-align: top;
  }

  th {
    font-weight: 600;
    color: var(--c-muted, var(--ui-text-muted));
  }
}
</style>
