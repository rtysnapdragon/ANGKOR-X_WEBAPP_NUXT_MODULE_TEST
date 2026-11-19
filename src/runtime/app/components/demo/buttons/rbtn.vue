<template>
  <div class="demo-page">
    <header class="demo-page__head">
      <NuxtLink to="/demo/buttons" class="demo-page__back"><i class="ri-arrow-left-s-line" /> All button demos</NuxtLink>
      <h1>RBtn</h1>
      <p>
        The action button: a coloured, permission-aware button whose colour and icon come from its
        <code>type</code>. Every case below is live; the code under it is exactly what produces it.
      </p>
    </header>

    <DemoLog :entries="entries" @clear="clear" />

    <!-- READ FIRST -->
    <DemoCase title="Read first: 4 rules that explain most surprises" layout="column">
      <ol class="demo-rules">
        <li>
          <b>Bind booleans explicitly.</b> RBtn declares its props as an untyped array, so a bare attribute arrives as an
          empty string and is ignored. Write <code>:disabled="true"</code>, <code>:loading="true"</code>,
          <code>:no-icon="true"</code>, <code>:is-icon-right="true"</code>, <code>:is-label-bold="true"</code>.
        </li>
        <li>
          <b>An icon only renders when <code>icon</code> is non-empty.</b> <code>type="create"</code> alone shows no icon;
          add <code>icon="create"</code> (any non-empty value works when the type is a known keyword).
        </li>
        <li>
          <b>Colour comes from <code>type</code>.</b> A solid button with an unknown type has no background, and an outline
          button with an unknown type has white text. Use a known type, or <code>color="dark-green"</code>.
        </li>
        <li>
          <b>Clicks are permission-gated.</b> <code>click</code> is only emitted when
          <code>menuStore.getActionPermission(permission) === 1</code>; otherwise a warning toast is shown. These demos use
          <code>{{ PERMISSION }}</code>. If clicks only toast, grant that action or change the constant at the top of this file.
        </li>
      </ol>
    </DemoCase>

    <!-- 1 BASIC -->
    <DemoCase
      title="1 · Basic"
      description="type decides colour and icon, label is the text, @click gives you the native MouseEvent."
      :code="code.basic"
    >
      <RBtn type="create" icon="create" label="Create" :permission="PERMISSION" @click="push('RBtn click', 'create')" />
      <RBtn type="edit" icon="edit" label="Edit" :permission="PERMISSION" @click="push('RBtn click', 'edit')" />
      <RBtn type="delete" icon="delete" label="Delete" :permission="PERMISSION" @click="push('RBtn click', 'delete')" />
      <RBtn type="save" icon="save" label="Save" :permission="PERMISSION" @click="(e) => push('RBtn click', e.type)" />
    </DemoCase>

    <!-- 2 GALLERY -->
    <DemoCase
      title="2 · Every action type"
      description="All types the component maps to an icon. Switch the variant to see which types have a colour in each variant."
      layout="grid"
      :code="code.gallery"
    >
      <div class="demo-seg" style="grid-column: 1 / -1">
        <button
          v-for="v in ['solid', 'outline']"
          :key="v"
          type="button"
          :class="{ 'is-on': galleryVariant === v }"
          @click="galleryVariant = v"
        >
          {{ v }}
        </button>
      </div>

      <div v-for="t in ACTION_TYPES" :key="t" class="demo-cell">
        <RBtn :type="t" :icon="t" :label="t" :variant="galleryVariant" :permission="PERMISSION" @click="push('RBtn click', t)" />
        <small v-if="isUnstyled(t)" class="demo-cell__warn">no {{ galleryVariant }} colour</small>
      </div>

      <template #note>
        Types marked <i>no colour</i> still work (icon + click) but have no background (solid) or an invisible white label
        (outline). Give them a style in RBtn.vue, or use <code>color="dark-green"</code> / the icon slot instead.
        <code>addStudent</code> and <code>closeModal</code> in the icon map can never match because the check lower-cases
        the type first.
      </template>
    </DemoCase>

    <!-- 3 VARIANT -->
    <DemoCase
      title="3 · Variants and dark-green"
      description="variant is solid (default) or outline. color adds an extra class; only dark-green has styles."
      :code="code.variant"
    >
      <RBtn type="save" icon="save" label="Solid" :permission="PERMISSION" />
      <RBtn type="save" icon="save" label="Outline" variant="outline" :permission="PERMISSION" />
      <RBtn color="dark-green" icon="ri-leaf-line" label="dark-green solid" :permission="PERMISSION" />
      <RBtn color="dark-green" icon="ri-leaf-line" label="dark-green outline" variant="outline" :permission="PERMISSION" />
    </DemoCase>

    <!-- 4 SIZE -->
    <DemoCase title="4 · Sizes" description="Default 36px, s = 33px, xs = 30px." :code="code.size">
      <RBtn type="create" icon="create" label="Default" :permission="PERMISSION" />
      <RBtn type="create" icon="create" label="Small (s)" size="s" :permission="PERMISSION" />
      <RBtn type="create" icon="create" label="Extra small (xs)" size="xs" :permission="PERMISSION" />
    </DemoCase>

    <!-- 5 ICON -->
    <DemoCase
      title="5 · Icon position, no icon, bold label"
      description="All three props are 'any non-empty value' flags: pass true."
      :code="code.icon"
    >
      <RBtn type="next" icon="next" label="Icon on the right" :is-icon-right="true" :permission="PERMISSION" />
      <RBtn type="apply" label="No icon" :no-icon="true" :permission="PERMISSION" />
      <RBtn type="send" icon="send" label="Bold label" :is-label-bold="true" :permission="PERMISSION" />
      <RBtn type="save" label="Missing icon prop: no icon" :permission="PERMISSION" />
    </DemoCase>

    <!-- 6 CUSTOM ICON -->
    <DemoCase
      title="6 · Custom icon"
      description="Three ways: a free icon class (no type), a colour class with the icon slot, or the default slot."
      :code="code.customIcon"
    >
      <!-- a) any CSS icon class, coloured through `color` -->
      <RBtn color="dark-green" icon="ri-heart-line" label="icon class" :permission="PERMISSION" />

      <!-- b) keep the type's colour, replace the icon through the #<type>icon slot -->
      <RBtn type="save" label="icon slot" :permission="PERMISSION">
        <template #saveicon>
          <div class="icon"><i class="ri-star-smile-line" /></div>
        </template>
      </RBtn>

      <!-- c) default slot: rendered before the label -->
      <RBtn type="create" icon="create" label="after slot" :permission="PERMISSION">
        <b>NEW</b>
      </RBtn>

      <template #note>
        If <code>type</code> is a known keyword the mapped icon wins over a custom <code>icon</code> class
        (<code>type="create" icon="ri-heart-line"</code> still shows the plus). Use the slot to override it.
      </template>
    </DemoCase>

    <!-- 7 LOADING -->
    <DemoCase
      title="7 · Loading"
      description="loading swaps the icon for a spinner and applies the disabled look, so the button cannot be clicked again."
      :code="code.loading"
    >
      <RBtn type="save" icon="save" label="Click to save (2s)" :loading="saving" :permission="PERMISSION" @click="fakeSave" />
      <RBtn type="save" icon="save" label="Always loading" :loading="true" :permission="PERMISSION" />
      <RBtn type="save" label="Loading, no icon: no spinner" :no-icon="true" :loading="true" :permission="PERMISSION" />
    </DemoCase>

    <!-- 8 DISABLED -->
    <DemoCase title="8 · Disabled" description="Greyed out, pointer-events off, no click and no permission toast." :code="code.disabled">
      <RBtn type="delete" icon="delete" label="Disabled solid" :disabled="true" :permission="PERMISSION" />
      <RBtn type="delete" icon="delete" label="Disabled outline" variant="outline" :disabled="true" :permission="PERMISSION" />
      <RBtn type="save" icon="save" label="Bare attribute: NOT disabled" disabled :permission="PERMISSION" />
    </DemoCase>

    <!-- 9 FORM -->
    <DemoCase
      title="9 · Inside a form (typeButton)"
      description="typeButton is the native button type: button (default), submit or reset."
      :code="code.form"
    >
      <form class="demo-form" @submit.prevent="push('form submit', draft)" @reset="draft = ''">
        <input v-model="draft" class="demo-input" placeholder="Type something…" />
        <RBtn type="save" icon="save" label="Submit" type-button="submit" :permission="PERMISSION" />
        <RBtn type="reset" icon="reset" label="Reset" type-button="reset" variant="outline" :permission="PERMISSION" />
      </form>

      <template #note>
        The permission check lives in the click handler. A <code>submit</code> button still submits the form natively
        even when the permission toast appears, so also guard the submit handler itself.
      </template>
    </DemoCase>

    <!-- 10 PERMISSION -->
    <DemoCase
      title="10 · Permission and showIfAllowed"
      description="permission is the action key. Without access the click only shows a toast; showIfAllowed=false hides the button entirely."
      :code="code.permission"
    >
      <RBtn type="approve" icon="approve" label="Granted action" :permission="PERMISSION" @click="push('RBtn click', 'granted')" />
      <RBtn type="void" icon="void" label="Denied: click for toast" :permission="DENIED" @click="push('should not fire')" />
      <RBtn type="void" icon="void" label="Denied + hidden (you will not see me)" :permission="DENIED" :show-if-allowed="false" />

      <template #note>
        The permission is read once when the button is created (not reactive). If the permission data loads later, key the
        button or render it after the data is ready.
      </template>
    </DemoCase>

    <!-- PROPS -->
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
definePageMeta({ layout: 'navbar', middleware: 'auth' })

const { entries, push, clear } = useDemoLog()

// Permission key given to every demo button. RBtn only emits `click` when
// menuStore.getActionPermission(PERMISSION) === 1. Change it to a key your user really has.
const PERMISSION = 'demo.buttons'
const DENIED = 'demo.__denied__'

// ── gallery ───────────────────────────────────────────────────────────────
const ACTION_TYPES = [
  'create', 'add', 'view', 'print', 'upload', 'camera', 'change', 'run', 'scan', 'void', 'void1',
  'delete', 'approve', 'release', 'hold', 'close', 'share', 'setting', 'copy', 'cancel', 'apply',
  'update', 'edit', 'save', 'save-update', 'helper', 'reset', 'next', 'back', 'send', 'email', 'key',
  'phone', 'draft', 'review', 'deposit', 'withdraw', 'return', 'cash', 'previous', 'import', 'export',
]
// types that have no colour rule in RBtn.vue for the given variant
const SOLID_UNSTYLED = ['upload', 'camera', 'void1', 'close', 'draft', 'review', 'previous']
const OUTLINE_UNSTYLED = ['deposit', 'withdraw', 'upload', 'camera', 'void1', 'close', 'draft', 'helper', 'previous']

const galleryVariant = ref('solid')
const isUnstyled = (t) => (galleryVariant.value === 'solid' ? SOLID_UNSTYLED : OUTLINE_UNSTYLED).includes(t)

// ── loading / form demos ──────────────────────────────────────────────────
const saving = ref(false)
function fakeSave() {
  push('RBtn click', 'save started')
  saving.value = true
  setTimeout(() => {
    saving.value = false
    push('save finished')
  }, 2000)
}

const draft = ref('')

// ── reference table ───────────────────────────────────────────────────────
const propRows = [
  ['type', 'string', '""', 'Action key. Chooses the colour class AND the built-in icon; also the icon slot name #<type>icon.'],
  ['label', 'string', '', 'Text after the icon.'],
  ['icon', 'string', '', 'Icon renders only when non-empty. Keyword (create, view, …) or a type match → built-in icon; anything else is used as a CSS class (ri-heart-line).'],
  ['variant', '"solid" | "outline"', '"solid"', ''],
  ['size', '"" | "s" | "xs"', '""', '36px / 33px / 30px.'],
  ['color', 'string', '', 'Extra class. Only "dark-green" is styled.'],
  ['isLabelBold', 'boolean (bind it)', '', 'Medium-weight font for the label.'],
  ['noIcon', 'boolean (bind it)', '', 'Hides the icon area (also hides the loading spinner).'],
  ['isIconRight', 'boolean (bind it)', '', 'Icon after the label.'],
  ['loading', 'boolean (bind it)', '', 'Spinner instead of the icon + disabled look.'],
  ['disabled', 'boolean (bind it)', '', 'Disabled look, no click.'],
  ['typeButton', '"button" | "submit" | "reset"', '"button"', 'Native button type.'],
  ['permission', 'string', '', 'Action permission key (see rule 4).'],
  ['showIfAllowed', 'boolean', 'true', 'false hides the button unless the permission is granted.'],
  ['@click', 'MouseEvent', '', 'Only emitted when the permission is granted.'],
  ['slot default', '', '', 'Rendered in a span before the label.'],
  ['slot #<type>icon', '', '', 'Replaces the icon area, e.g. #saveicon for type="save".'],
]

// ── code shown under each case ────────────────────────────────────────────
const code = {
  basic: `<RBtn type="create" icon="create" label="Create" permission="orders.create" @click="onCreate" />
<RBtn type="edit"   icon="edit"   label="Edit"   permission="orders.edit"   @click="onEdit" />
<RBtn type="delete" icon="delete" label="Delete" permission="orders.delete" @click="onDelete" />

// the handler receives the native MouseEvent
function onCreate(e) { /* ... */ }`,

  gallery: `<!-- icon is required for the icon to show; for a known type any non-empty value works -->
<RBtn v-for="t in types" :key="t" :type="t" :icon="t" :label="t" variant="solid" />`,

  variant: `<RBtn type="save" icon="save" label="Solid" />
<RBtn type="save" icon="save" label="Outline" variant="outline" />

<!-- no type needed when you use color + your own icon class -->
<RBtn color="dark-green" icon="ri-leaf-line" label="dark-green" />
<RBtn color="dark-green" icon="ri-leaf-line" label="dark-green" variant="outline" />`,

  size: `<RBtn type="create" icon="create" label="Default" />            <!-- 36px -->
<RBtn type="create" icon="create" label="Small" size="s" />      <!-- 33px -->
<RBtn type="create" icon="create" label="Tiny" size="xs" />      <!-- 30px -->`,

  icon: `<RBtn type="next" icon="next" label="Next" :is-icon-right="true" />
<RBtn type="apply" label="Apply" :no-icon="true" />
<RBtn type="send" icon="send" label="Send" :is-label-bold="true" />`,

  customIcon: `<!-- a) any icon class: no type, colour via color -->
<RBtn color="dark-green" icon="ri-heart-line" label="icon class" />

<!-- b) keep the type colour, replace the icon with the #<type>icon slot -->
<RBtn type="save" label="icon slot">
  <template #saveicon>
    <div class="icon"><i class="ri-star-smile-line" /></div>
  </template>
</RBtn>

<!-- c) default slot, rendered before the label -->
<RBtn type="create" icon="create" label="after slot"><b>NEW</b></RBtn>`,

  loading: `<RBtn type="save" icon="save" label="Save" :loading="saving" @click="save" />

const saving = ref(false)
async function save() {
  saving.value = true
  try { await api.save() } finally { saving.value = false }
}`,

  disabled: `<RBtn type="delete" icon="delete" label="Delete" :disabled="true" />
<RBtn type="delete" icon="delete" label="Delete" variant="outline" :disabled="isLocked" />

<!-- wrong: a bare attribute is the string "" and is ignored -->
<RBtn type="save" label="Save" disabled />`,

  form: `<form @submit.prevent="onSubmit" @reset="draft = ''">
  <input v-model="draft" />
  <RBtn type="save"  icon="save"  label="Submit" type-button="submit" permission="orders.save" />
  <RBtn type="reset" icon="reset" label="Reset"  type-button="reset" variant="outline" permission="orders.save" />
</form>`,

  permission: `<!-- click only fires when menuStore.getActionPermission('orders.approve') === 1 -->
<RBtn type="approve" icon="approve" label="Approve" permission="orders.approve" @click="approve" />

<!-- denied: a warning toast is shown instead of the click -->
<RBtn type="void" icon="void" label="Void" permission="orders.void" />

<!-- denied + hidden -->
<RBtn type="void" icon="void" label="Void" permission="orders.void" :show-if-allowed="false" />`,

  api: `<RBtn
  type="save"            <!-- colour + icon keyword + #saveicon slot name -->
  icon="save"            <!-- required for the icon to render -->
  label="Save"
  variant="solid"        <!-- solid | outline -->
  size=""                <!-- "" | s | xs -->
  color=""               <!-- dark-green -->
  :is-label-bold="false"
  :no-icon="false"
  :is-icon-right="false"
  :loading="false"
  :disabled="false"
  type-button="button"   <!-- button | submit | reset -->
  permission="module.action"
  :show-if-allowed="true"
  @click="(e) => {}"
/>`,
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
