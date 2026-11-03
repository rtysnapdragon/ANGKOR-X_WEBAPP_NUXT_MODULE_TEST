# SARIKA — Component System

## Structure

```
components/R/
├── RButton.vue          Base button — variant, size, icon, loading
├── RBadge.vue           Status/label badge — color variants
├── RAvatar.vue          User avatar with initials fallback + status dot
├── RCard.vue            Glass morphism card — header/body/footer slots
├── RPageHeader.vue      Page title + subtitle + actions slot
├── RThemeToggle.vue     Dark/light toggle + km/en locale switcher
├── RToast.vue           Global toast stack (portal → body)
├── RStatCard.vue        KPI metric card with trend indicator
├── RDataTable.vue       Responsive table → card list on mobile
│
├── RForm.vue            Base form with grid layout (provides context)
├── RFormGroup.vue       Collapsible field group/section
├── RFormField.vue       Dynamic field renderer (15+ field types)
├── RFormBuilder.vue     Slideover form builder from schema
│
├── FormInviteUser.vue   Specific form: invite user by email
├── FormCreateUser.vue   Specific form: full user creation
├── FormCreateProject.vue Specific form: project setup
└── FormCreateReport.vue  Specific form: report configuration

stores/
└── ui.ts               Theme, locale, device, toasts, loading, slideovers

composables/
├── useFormValidation.ts Field-level validation engine
└── useApiData.ts        Typed fetch with loading + pagination

types/
└── form.ts              FormField, FormSchema, FormGroup, payload types

assets/scss/
├── _color.scss          CSS variables (light + dark)
├── _mixin.scss          Breakpoints, glass, flex, transition helpers
└── main.scss            Global reset + scrollbar + base styles

i18n/
├── en.ts                English translations
└── km.ts                Khmer translations
```

---

## Slideover Behavior

| Device  | Direction    | Width                          |
| ------- | ------------ | ------------------------------ |
| Desktop | RTL (right)  | max-w-xl                       |
| Tablet  | RTL (right)  | max-w-xl                       |
| Mobile  | BTT (bottom) | full width, 90dvh, rounded top |

---

## FormBuilder Usage

```vue
<script setup>
import type { FormSchema } from '@/types/form'

const open = ref(false)

const schema: FormSchema = {
  groups: [
    {
      key: 'main',
      cols: 2,
      fields: [
        {
          key: 'name',
          type: 'text',
          label: 'form.name',
          validation: { required: true }
        },
        {
          key: 'email',
          type: 'email',
          label: 'form.email',
          validation: { required: true, email: true }
        },
        {
          key: 'role',
          type: 'select',
          label: 'form.role',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Viewer', value: 'viewer' },
          ]
        },
        {
          key: 'active',
          type: 'toggle',
          label: 'common.active',
          defaultValue: true
        }
      ]
    }
  ]
}

function handleSubmit(data) {
  console.log(data)
  open.value = false
}
</script>

<template>
  <RButton @click="open = true">Open Form</RButton>

  <RFormBuilder
    v-model="open"
    :schema="schema"
    title="Create Something"
    icon="i-lucide-plus"
    @submit="handleSubmit"
  />
</template>
```

---

## Pre-built Specific Forms

```vue
<!-- Invite user -->
<FormInviteUser v-model="showInvite" @submit="onInvite" />

<!-- Create user -->
<FormCreateUser v-model="showCreate" @submit="onCreate" />

<!-- Create project -->
<FormCreateProject v-model="showProject" @submit="onProject" />

<!-- Create report -->
<FormCreateReport v-model="showReport" @submit="onReport" />
```

---

## UI Store

```ts
const ui = useUIStore();

// Theme
ui.setTheme("dark"); // 'light' | 'dark' | 'system'
ui.toggleTheme();

// Locale
ui.setLocale("km"); // 'en' | 'km'

// Toasts
ui.success("Saved!", "Your changes have been saved.");
ui.error("Failed", "Something went wrong.");

// Loading
ui.startLoading("save-user");
await saveUser();
ui.stopLoading("save-user");

// Or:
await ui.withLoading("save-user", () => saveUser());

// Device
ui.isMobile; // boolean
ui.isTablet; // boolean
ui.isDesktop; // boolean
```

---

## Field Types

| Type        | Renders                         |
| ----------- | ------------------------------- |
| text        | `<input type="text">`           |
| email       | `<input type="email">`          |
| password    | `<input type="password">`       |
| number      | `<input type="number">`         |
| tel         | `<input type="tel">`            |
| textarea    | `<textarea>`                    |
| select      | `<select>` native               |
| multiselect | USelectMenu (NuxtUI)            |
| toggle      | Custom toggle switch            |
| checkbox    | `<input type="checkbox">`       |
| radio       | Radio group                     |
| date        | `<input type="date">`           |
| datetime    | `<input type="datetime-local">` |
| file        | Styled file upload area         |
| range       | Range slider + value            |
| color       | Color picker                    |
| hidden      | Hidden input                    |
| divider     | Horizontal rule                 |
| heading     | Section heading text            |

---

## Dynamic Options from API

```ts
{
  key: 'country',
  type: 'select',
  label: 'form.country',
  optionsUrl: '/api/countries',  // fetched on mount
}
```

---

## Nuxt Config

```ts
// nuxt.config.ts
vite: {
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '@/assets/scss/_mixin' as *;`,
      }
    }
  }
}
```
