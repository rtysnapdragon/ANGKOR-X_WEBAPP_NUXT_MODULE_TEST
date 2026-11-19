<template>
  <div class="demo-page">
    <header class="demo-page__head">
      <NuxtLink to="/demo/buttons" class="demo-page__back"><i class="ri-arrow-left-s-line" /> All button demos</NuxtLink>
      <h1>RTblBtns</h1>
      <p>
        Compact square icon buttons for table rows. They show a tooltip, adapt to the width of the screen, and move extra
        actions into a "more" menu. One <code>actionClick</code> event reports the pressed action.
      </p>
    </header>

    <DemoLog :entries="entries" @clear="clear" />

    <DemoCase title="Read first" layout="column">
      <ol class="demo-rules">
        <li>
          <b>Layout is automatic.</b> Fewer than 4 items = all inline. 4 or more = the first 2 inline and the rest in a
          3-dot "more" menu. At 768px or narrower <i>everything</i> goes in the menu.
        </li>
        <li>
          <b>The event is <code>@action-click="(type, item) => …"</code>.</b> You can also put a callback on the item itself:
          <code>actionClick: () => …</code> runs first, then the event is emitted.
        </li>
        <li>
          <b>Colour and icon are separate.</b> <code>color</code> picks the palette (see the gallery), <code>icon</code> is either a
          keyword (<code>edit, delete, view…</code>) or any icon class (<code>ri-heart-line</code>).
        </li>
        <li>
          <b>Client-only.</b> The component reads <code>window.innerWidth</code> while it is created, so render it inside
          <code>&lt;ClientOnly&gt;</code> (done on this page) or the server render fails.
        </li>
        <li>
          <b>Pass <code>use="nuxtui"</code>.</b> That is the supported popover; <code>use="flowbite"</code> switches to the Flowbite
          dropdown. Bind <code>:close-inside="true"</code> (not a bare attribute) to close the menu on item click.
        </li>
      </ol>
    </DemoCase>

    <ClientOnly>
      <DemoCase title="1 · Basic (fewer than 4 items = all inline)" description="Hover a button for its tooltip (label)." :code="code.basic">
        <RTblBtns :items="basic" use="nuxtui" @action-click="onAction" />
      </DemoCase>

      <DemoCase
        title="2 · Four or more items: 2 inline + more menu"
        description="The extra items live in the 3-dot menu. Disabled and loading rows are shown inside it too."
        :code="code.more"
      >
        <RTblBtns :items="many" use="nuxtui" @action-click="onAction" />
      </DemoCase>

      <DemoCase
        title="3 · Colour gallery"
        description="Every colour palette the component has. Left = outline, right = fill: true."
        layout="grid"
        :code="code.colors"
      >
        <div v-for="c in COLORS" :key="c.color" class="demo-cell demo-cell--row">
          <RTblBtns :items="[one(c)]" use="nuxtui" @action-click="onAction" />
          <RTblBtns :items="[one(c, true)]" use="nuxtui" @action-click="onAction" />
          <small>{{ c.color }}</small>
        </div>
      </DemoCase>

      <DemoCase
        title="4 · Icons: keywords or any class"
        description="Keywords map to Remix icons. Any string starting with ri- is used as is."
        :code="code.icons"
      >
        <RTblBtns :items="iconKeywords" use="nuxtui" @action-click="onAction" />
        <RTblBtns :items="iconClasses" use="nuxtui" @action-click="onAction" />

        <template #note>
          Keywords: add, view, edit, delete, approve, setting, print, more, review, release, clone / copy, unuser, chat, adduser,
          send, run, phone, split, merge, change, folder, void, return, message.
        </template>
      </DemoCase>

      <DemoCase title="5 · Disabled, rotate and tooltip placement" :code="code.flags">
        <RTblBtns :items="flags" use="nuxtui" @action-click="onAction" />

        <template #note>
          <code>disabled</code> greys the button and blocks the click. <code>isRotate</code> flips the icon 180° (handy for an
          expand / collapse toggle). <code>placement</code> positions the tooltip (top, bottom, left, right).
        </template>
      </DemoCase>

      <DemoCase
        title="6 · Permissions"
        description="Same rules as RBtn: no access = warning toast and no event; showIfAllowed:false hides it."
        :code="code.permission"
      >
        <RTblBtns :items="permissions" use="nuxtui" @action-click="onAction" />
      </DemoCase>

      <DemoCase
        title="7 · Inline callback or event"
        description="Use actionClick on an item for a local callback, or handle everything in one @action-click."
        :code="code.callback"
      >
        <RTblBtns :items="callbacks" use="nuxtui" @action-click="onAction" />
      </DemoCase>

      <DemoCase
        title="8 · Table row example"
        description="One handler for every row: put the row id on the item and read it back from the event."
        layout="column"
        :code="code.row"
      >
        <table class="demo-table">
          <thead><tr><th>Name</th><th>Status</th><th style="width: 140px; text-align: center">Actions</th></tr></thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.name }}</td>
              <td>{{ row.status }}</td>
              <td>
                <RTblBtns :items="rowActions(row)" use="nuxtui" @action-click="(t, i) => onAction(t, { ...i, label: `${i.label} #${row.id}` })" />
              </td>
            </tr>
          </tbody>
        </table>
      </DemoCase>

      <DemoCase
        title="9 · Flowbite dropdown and closeInside"
        description="use='flowbite' renders the more-menu with the Flowbite dropdown. closeInside controls closing on item click."
        :code="code.flowbite"
      >
        <RTblBtns :items="many" use="flowbite" :close-inside="true" @action-click="onAction" />
      </DemoCase>

      <DemoCase title="Props, events and item fields" layout="column" :code="code.api">
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
          Known quirk: the component has <code>watch(() =&gt; use, …)</code>, which receives the computed object instead of its value,
          so it shows an "Incorrect usage!" toast on mount for every <code>use</code> value. Change it to <code>watch(use, …)</code>
          in RTblBtns.vue to silence it.
        </template>
      </DemoCase>
    </ClientOnly>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'navbar'})

const { entries, push, clear } = useDemoLog()

// An action's click is accepted only when menuStore.getActionPermission(permission) === 1.
const PERMISSION = 'demo.buttons'
const DENIED = 'demo.__denied__'

const onAction = (type, item) => push('actionClick', `${type} (${item?.label ?? ''})`)

// 1 ─ basic
const basic = [
  { type: 'view', icon: 'view', color: 'view', label: 'View', permission: PERMISSION },
  { type: 'edit', icon: 'edit', color: 'edit', label: 'Edit', permission: PERMISSION },
  { type: 'delete', icon: 'delete', color: 'delete', label: 'Delete', permission: PERMISSION },
]

// 2 ─ many (>= 4)
const many = [
  { type: 'view', icon: 'view', color: 'view', label: 'View', permission: PERMISSION },
  { type: 'edit', icon: 'edit', color: 'edit', label: 'Edit', permission: PERMISSION },
  { type: 'copy', icon: 'copy', color: 'copy', label: 'Duplicate', permission: PERMISSION },
  { type: 'print', icon: 'print', color: 'print', label: 'Print', permission: PERMISSION },
  { type: 'run', icon: 'run', color: 'run', label: 'Disabled in menu', disabled: true, permission: PERMISSION },
  { type: 'delete', icon: 'delete', color: 'delete', label: 'Delete', permission: PERMISSION },
]

// 3 ─ colour gallery
const COLORS = [
  { color: 'view', icon: 'view' }, { color: 'add', icon: 'add' }, { color: 'return', icon: 'return' },
  { color: 'change', icon: 'change' }, { color: 'edit', icon: 'edit' }, { color: 'approve', icon: 'approve' },
  { color: 'delete', icon: 'delete' }, { color: 'void', icon: 'void' }, { color: 'run', icon: 'run' },
  { color: 'print', icon: 'print' }, { color: 'chat', icon: 'chat' }, { color: 'setting', icon: 'setting' },
  { color: 'release', icon: 'release' }, { color: 'copy', icon: 'copy' }, { color: 'clone', icon: 'clone' },
  { color: 'folder', icon: 'folder' }, { color: 'split', icon: 'split' }, { color: 'merge', icon: 'merge' },
  { color: 'message', icon: 'message' }, { color: 'helper', icon: 'ri-customer-service-2-fill' },
  { color: 'employee', icon: 'ri-user-star-line' }, { color: 'change-en', icon: 'ri-translate-2' },
  { color: 'formula', icon: 'ri-functions' }, { color: 'resume', icon: 'ri-file-user-line' },
]
const one = (c, fill = false) => ({
  type: c.color,
  icon: c.icon,
  color: c.color,
  fill,
  label: `${c.color}${fill ? ' (fill)' : ''}`,
  permission: PERMISSION,
})

// 4 ─ icons
const iconKeywords = [
  { type: 'add', icon: 'add', color: 'add', label: 'add', permission: PERMISSION },
  { type: 'chat', icon: 'chat', color: 'chat', label: 'chat', permission: PERMISSION },
  { type: 'split', icon: 'split', color: 'split', label: 'split', permission: PERMISSION },
]
const iconClasses = [
  { type: 'a', icon: 'ri-heart-line', color: 'delete', label: 'ri-heart-line', permission: PERMISSION },
  { type: 'b', icon: 'ri-rocket-line', color: 'run', label: 'ri-rocket-line', permission: PERMISSION },
]

// 5 ─ flags
const flags = [
  { type: 'edit', icon: 'edit', color: 'edit', label: 'Disabled', disabled: true, permission: PERMISSION },
  { type: 'toggle', icon: 'ri-arrow-down-s-line', color: 'view', label: 'Rotated 180°', isRotate: true, permission: PERMISSION },
  { type: 'top', icon: 'view', color: 'view', label: 'Tooltip on top', placement: 'top', permission: PERMISSION },
  { type: 'right', icon: 'view', color: 'run', label: 'Tooltip on the right', placement: 'right', permission: PERMISSION },
]

// 6 ─ permissions
const permissions = [
  { type: 'approve', icon: 'approve', color: 'approve', label: 'Granted', permission: PERMISSION },
  { type: 'void', icon: 'void', color: 'void', label: 'Denied: toast on click', permission: DENIED },
  { type: 'void', icon: 'void', color: 'void', label: 'Denied: hidden', permission: DENIED, showIfAllowed: false },
]

// 7 ─ callbacks
const callbacks = [
  { type: 'view', icon: 'view', color: 'view', label: 'Inline callback', permission: PERMISSION, actionClick: () => push('item.actionClick', 'ran first') },
  { type: 'edit', icon: 'edit', color: 'edit', label: 'Event only', permission: PERMISSION },
]

// 8 ─ rows
const rows = [
  { id: 1, name: 'Sok Dara', status: 'Active' },
  { id: 2, name: 'Chan Nita', status: 'Pending' },
]
const rowActions = (row) => [
  { type: 'view', icon: 'view', color: 'view', label: 'View', id: row.id, permission: PERMISSION },
  { type: 'edit', icon: 'edit', color: 'edit', label: 'Edit', id: row.id, permission: PERMISSION },
  { type: 'delete', icon: 'delete', color: 'delete', label: 'Delete', id: row.id, permission: PERMISSION },
]

const propRows = [
  ['items', 'Array<item>', 'The actions (fields below).'],
  ['use', '"nuxtui" | "flowbite"', 'Which popover renders the "more" menu. Pass "nuxtui".'],
  ['closeInside', 'boolean (bind it)', 'Close the more-menu when an item is clicked.'],
  ['@actionClick', '(type, item)', 'Emitted after the permission check passes.'],
  ['item.type', 'string', 'Returned as the first event argument.'],
  ['item.icon', 'string', 'Keyword or icon class.'],
  ['item.color', 'string', 'Palette: see the gallery.'],
  ['item.label', 'string', 'Tooltip text (inline) / row text (more menu).'],
  ['item.fill', 'boolean', 'Solid background instead of outline.'],
  ['item.disabled', 'boolean', 'No click; greyed out.'],
  ['item.loading', 'boolean', 'Spinner (more menu only) and no click.'],
  ['item.isRotate', 'boolean', 'Rotate the button 180°.'],
  ['item.placement', 'string', 'Tooltip placement.'],
  ['item.permission', 'string', 'Action permission key.'],
  ['item.showIfAllowed', 'boolean', 'false hides the item unless permitted.'],
  ['item.actionClick', 'function', 'Inline callback, runs before the event.'],
]

const code = {
  basic: `<RTblBtns :items="actions" use="nuxtui" @action-click="onAction" />

const actions = [
  { type: 'view',   icon: 'view',   color: 'view',   label: 'View',   permission: 'orders.view' },
  { type: 'edit',   icon: 'edit',   color: 'edit',   label: 'Edit',   permission: 'orders.edit' },
  { type: 'delete', icon: 'delete', color: 'delete', label: 'Delete', permission: 'orders.delete' },
]

// signature: (type, item)
const onAction = (type, item) => { /* ... */ }`,

  more: `// 4+ items: first 2 inline, the rest in the "more" menu. <= 768px: all in the menu.
const actions = [
  { type: 'view',  icon: 'view',  color: 'view',  label: 'View' },
  { type: 'edit',  icon: 'edit',  color: 'edit',  label: 'Edit' },
  { type: 'copy',  icon: 'copy',  color: 'copy',  label: 'Duplicate' },
  { type: 'print', icon: 'print', color: 'print', label: 'Print' },
  { type: 'run',   icon: 'run',   color: 'run',   label: 'Run', disabled: true },
  { type: 'delete', icon: 'delete', color: 'delete', label: 'Delete' },
]`,

  colors: `{ type: 'edit', icon: 'edit', color: 'edit', label: 'Edit' }                  // outline
{ type: 'edit', icon: 'edit', color: 'edit', label: 'Edit', fill: true }      // filled

// colours: view add return change edit approve delete void run print chat setting release
//          copy clone folder split merge message helper employee change-en formula resume`,

  icons: `{ icon: 'add' }                // keyword
{ icon: 'ri-heart-line' }       // any Remix icon class`,

  flags: `{ type: 'edit', icon: 'edit', color: 'edit', label: 'Disabled', disabled: true }
{ type: 'toggle', icon: 'ri-arrow-down-s-line', color: 'view', label: 'Rotated', isRotate: true }
{ type: 'top', icon: 'view', color: 'view', label: 'Top tooltip', placement: 'top' }`,

  permission: `{ type: 'approve', icon: 'approve', color: 'approve', label: 'Approve', permission: 'orders.approve' }
{ type: 'void', icon: 'void', color: 'void', label: 'Void', permission: 'orders.void' }                         // toast if denied
{ type: 'void', icon: 'void', color: 'void', label: 'Void', permission: 'orders.void', showIfAllowed: false }   // hidden if denied`,

  callback: `{
  type: 'view', icon: 'view', color: 'view', label: 'Open',
  permission: 'orders.view',
  actionClick: () => openDrawer(),   // runs first
}
// then the component also emits @action-click`,

  row: `<tr v-for="row in rows" :key="row.id">
  <td>{{ row.name }}</td>
  <td>
    <RTblBtns :items="rowActions(row)" use="nuxtui" @action-click="(type, item) => handle(type, item.id)" />
  </td>
</tr>

const rowActions = (row) => [
  { type: 'view',   icon: 'view',   color: 'view',   label: 'View',   id: row.id },
  { type: 'edit',   icon: 'edit',   color: 'edit',   label: 'Edit',   id: row.id },
  { type: 'delete', icon: 'delete', color: 'delete', label: 'Delete', id: row.id },
]`,

  flowbite: `<RTblBtns :items="actions" use="flowbite" :close-inside="true" @action-click="onAction" />`,

  api: `<ClientOnly>
  <RTblBtns
    :items="actions"
    use="nuxtui"            <!-- nuxtui | flowbite -->
    :close-inside="true"
    @action-click="(type, item) => {}"
  />
</ClientOnly>`,
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

.demo-cell--row {
  flex-direction: row;
  align-items: center;
  gap: 6px;

  small {
    margin-left: 4px;
    font-size: 11.5px;
    color: var(--c-muted, var(--ui-text-muted));
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
