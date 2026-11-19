<template>
  <div class="demo-page">
    <header class="demo-page__head">
      <NuxtLink to="/demo/buttons" class="demo-page__back"><i class="ri-arrow-left-s-line" /> All button demos</NuxtLink>
      <h1>RBtns</h1>
      <p>
        A group of <code>RBtn</code> driven by one <code>data</code> array. It renders inline buttons on desktop, a single
        3-dot menu when asked, and a 3-dot popover on mobile. One <code>click</code> event reports which item was pressed.
      </p>
    </header>

    <DemoLog :entries="entries" @clear="clear" />

    <DemoCase title="Read first" layout="column">
      <ol class="demo-rules">
        <li>
          <b>The event signature is <code>(type, item)</code></b>: <code>@click="(type, item) => …"</code>. <code>item</code> is
          the object you put in <code>data</code>, so extra fields (an <code>id</code>, a payload) come back to you.
        </li>
        <li>
          <b>Each item is an RBtn.</b> The fields are <code>type, icon, label, variant, size, color, isLabelBold, isIconRight, noIcon,
          typeButton, disabled, loading, permission, showIfAllowed, class</code>, with the same rules as RBtn (icon needed to
          show an icon, colour from type). Inside <code>data</code> plain objects hold real booleans, so write
          <code>disabled: true</code>.
        </li>
        <li>
          <b>The component's own props are an untyped array</b>, so bind booleans: <code>:three-dot-only="true"</code>. A bare
          <code>three-dot-only</code> is the string "" and does nothing.
        </li>
        <li>
          <b>Layout depends on the screen.</b> Desktop = inline buttons. Mobile (screen store <code>isMobile</code>, about
          ≤ 768px) = a 3-dot popover. Resize the window to see it.
        </li>
      </ol>
    </DemoCase>

    <DemoCase
      title="1 · Basic inline group"
      description="One object per button. Click reports (type, item)."
      :code="code.basic"
    >
      <RBtns :data="basic" @click="onClick" />
    </DemoCase>

    <DemoCase
      title="2 · Per-item look"
      description="Every RBtn option can be set per item: variant, size, label weight, icon side, no icon, button type and colour."
      :code="code.look"
    >
      <RBtns :data="look" @click="onClick" />
    </DemoCase>

    <DemoCase
      title="3 · Disabled and loading items"
      description="Flags are per item, so one action can be busy while the rest stay usable."
      :code="code.states"
    >
      <RBtns :data="states" @click="onClick" />
      <RBtn type="save" icon="save" label="Toggle loading" variant="outline" :permission="PERMISSION" @click="toggleLoading" />
    </DemoCase>

    <DemoCase
      title="4 · 3-dot menu only"
      description="threeDotOnly collapses every item into one popover. iconThreeDot swaps the trigger icon."
      :code="code.dots"
    >
      <RBtns :data="basic" :three-dot-only="true" @click="onClick" />
      <RBtns :data="basic" :three-dot-only="true" icon-three-dot="ri-more-fill" @click="onClick" />
      <RBtns :data="basic" :three-dot-only="true" icon-three-dot="ri-equalizer-line" @click="onClick" />
    </DemoCase>

    <DemoCase
      title="5 · Permissions"
      description="permission / showIfAllowed work exactly like on RBtn, per item."
      :code="code.permission"
    >
      <RBtns :data="permissions" @click="onClick" />

      <template #note>
        Items with <code>showIfAllowed: false</code> and no access are not rendered at all. Denied items that stay visible
        show the warning toast and never reach your handler.
      </template>
    </DemoCase>

    <DemoCase
      title="6 · Custom icon through slots"
      description="Slots are named #<type>icon and are forwarded to the matching RBtn (and to the popover rows)."
      :code="code.slots"
    >
      <RBtns :data="basic" @click="onClick">
        <template #editicon><div class="icon"><i class="ri-heart-line" /></div></template>
        <template #deleteicon><div class="icon"><i class="ri-fire-line" /></div></template>
      </RBtns>
    </DemoCase>

    <DemoCase
      title="7 · Passing your own data back"
      description="The whole item is returned, so rows in a table can share one handler."
      :code="code.payload"
    >
      <RBtns :data="payload" @click="(type, item) => push('payload', { type, id: item.id, row: item.row })" />
    </DemoCase>

    <DemoCase
      title="8 · Mobile behaviour"
      description="Under the mobile breakpoint the same data becomes a 3-dot popover. use decides which popover style is used."
      :code="code.mobile"
    >
      <RBtns :data="basic" use="nuxtui" @click="onClick" />

      <template #note>
        Resize this window below ~768px (or open it on a phone). <code>use="nuxtui"</code> uses the Nuxt UI popover;
        any other value uses the headless one. The desktop layout ignores <code>use</code>.
      </template>
    </DemoCase>

    <DemoCase title="Props, events and slots" layout="column" :code="code.api">
      <table class="demo-table">
        <thead>
          <tr><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in propRows" :key="r[0]">
            <td><code>{{ r[0] }}</code></td>
            <td>{{ r[1] }}</td>
            <td>{{ r[2] }}</td>
            <td>{{ r[3] }}</td>
          </tr>
        </tbody>
      </table>
    </DemoCase>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'navbar'})

const { entries, push, clear } = useDemoLog()

// RBtn only emits `click` when menuStore.getActionPermission(PERMISSION) === 1.
const PERMISSION = 'demo.buttons'
const DENIED = 'demo.__denied__'

const onClick = (type, item) => push('RBtns click', `${type} (${item.label})`)

// 1 ─ basic
const basic = [
  { type: 'create', icon: 'create', label: 'Create', permission: PERMISSION },
  { type: 'edit', icon: 'edit', label: 'Edit', permission: PERMISSION },
  { type: 'delete', icon: 'delete', label: 'Delete', permission: PERMISSION },
]

// 2 ─ look
const look = [
  { type: 'save', icon: 'save', label: 'Outline', variant: 'outline', permission: PERMISSION },
  { type: 'create', icon: 'create', label: 'Small', size: 's', permission: PERMISSION },
  { type: 'next', icon: 'next', label: 'Icon right', isIconRight: true, permission: PERMISSION },
  { type: 'apply', label: 'No icon', noIcon: true, permission: PERMISSION },
  { type: 'send', icon: 'send', label: 'Bold', isLabelBold: true, permission: PERMISSION },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'Green', permission: PERMISSION },
]

// 3 ─ states
const busy = ref(false)
const states = computed(() => [
  { type: 'save', icon: 'save', label: 'Save', loading: busy.value, permission: PERMISSION },
  { type: 'delete', icon: 'delete', label: 'Disabled', disabled: true, permission: PERMISSION },
  { type: 'edit', icon: 'edit', label: 'Normal', permission: PERMISSION },
])
function toggleLoading() {
  busy.value = !busy.value
  push('loading', String(busy.value))
}

// 5 ─ permissions
const permissions = [
  { type: 'approve', icon: 'approve', label: 'Granted', permission: PERMISSION },
  { type: 'void', icon: 'void', label: 'Denied (toast)', permission: DENIED , showIfAllowed: true},
  { type: 'void', icon: 'void', label: 'Denied (hidden)', permission: DENIED, showIfAllowed: false },
]

// 7 ─ payload
const payload = [
  { type: 'view', icon: 'view', label: 'View row 42', id: 42, row: { name: 'Sok Dara' }, permission: PERMISSION },
  { type: 'edit', icon: 'edit', label: 'Edit row 42', id: 42, row: { name: 'Sok Dara' }, permission: PERMISSION },
]

const propRows = [
  ['data', 'Array<item>', '', 'The actions. Item fields are listed in rule 2 above, plus any extra fields you want back in the event.'],
  ['threeDotOnly', 'boolean (bind it)', 'false', 'One 3-dot popover instead of inline buttons.'],
  ['iconThreeDot', 'string', '"ri-more-2-fill"', 'Icon class for the 3-dot trigger.'],
  ['use', '"nuxtui" | other', '', 'Mobile popover style: "nuxtui" or headless.'],
  ['@click', '(type, item)', '', 'Fired for inline buttons and popover rows alike.'],
  ['slot #<type>icon', '', '', 'Custom icon for items of that type.'],
]

const code = {
  basic: `<RBtns :data="actions" @click="onClick" />

const actions = [
  { type: 'create', icon: 'create', label: 'Create', permission: 'orders.create' },
  { type: 'edit',   icon: 'edit',   label: 'Edit',   permission: 'orders.edit' },
  { type: 'delete', icon: 'delete', label: 'Delete', permission: 'orders.delete' },
]

// signature: (type, item)
const onClick = (type, item) => { /* ... */ }`,

  look: `const actions = [
  { type: 'save',  icon: 'save',  label: 'Outline',    variant: 'outline' },
  { type: 'create', icon: 'create', label: 'Small',     size: 's' },
  { type: 'next',  icon: 'next',  label: 'Icon right', isIconRight: true },
  { type: 'apply',               label: 'No icon',    noIcon: true },
  { type: 'send',  icon: 'send',  label: 'Bold',       isLabelBold: true },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'Green' },
]`,

  states: `const busy = ref(false)
const actions = computed(() => [
  { type: 'save',   icon: 'save',   label: 'Save',     loading: busy.value },
  { type: 'delete', icon: 'delete', label: 'Disabled', disabled: true },
  { type: 'edit',   icon: 'edit',   label: 'Normal' },
])`,

  dots: `<RBtns :data="actions" :three-dot-only="true" @click="onClick" />
<RBtns :data="actions" :three-dot-only="true" icon-three-dot="ri-more-fill" @click="onClick" />`,

  permission: `const actions = [
  { type: 'approve', icon: 'approve', label: 'Granted',        permission: 'orders.approve' },
  { type: 'void',    icon: 'void',    label: 'Denied (toast)', permission: 'orders.void' },
  { type: 'void',    icon: 'void',    label: 'Denied (hidden)', permission: 'orders.void', showIfAllowed: false },
]`,

  slots: `<RBtns :data="actions" @click="onClick">
  <template #editicon><div class="icon"><i class="ri-heart-line" /></div></template>
  <template #deleteicon><div class="icon"><i class="ri-fire-line" /></div></template>
</RBtns>`,

  payload: `<RBtns :data="rowActions(row)" @click="(type, item) => handle(type, item.id)" />

const rowActions = (row) => [
  { type: 'view', icon: 'view', label: 'View', id: row.id, row, permission: 'orders.view' },
  { type: 'edit', icon: 'edit', label: 'Edit', id: row.id, row, permission: 'orders.edit' },
]`,

  mobile: `<!-- same data; under ~768px it becomes a 3-dot popover -->
<RBtns :data="actions" use="nuxtui" @click="onClick" />`,

  api: `<RBtns
  :data="actions"
  :three-dot-only="false"
  icon-three-dot="ri-more-2-fill"
  use="nuxtui"
  @click="(type, item) => {}"
>
  <template #editicon>…custom icon…</template>
</RBtns>`,
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
