<script setup lang="ts">
// FormCreateUser — Create a new user (full form)
import { ref } from 'vue'
import type { FormSchema, UserCreatePayload } from '@/types/form'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  modelValue: boolean
  loading?:   boolean
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  submit:  [data: UserCreatePayload]
  cancel:  []
}>()

const { t } = useI18n()

const schema: FormSchema = {
  groups: [
    {
      key:   'identity',
      title: 'Personal Information',
      icon:  'i-lucide-user',
      cols:  2,
      fields: [
        {
          key:         'name',
          type:        'text',
          label:       'form.name',
          placeholder: 'John Doe',
          icon:        'i-lucide-user',
          validation:  { required: true, minLength: 2 },
          cols:        2,
        },
        {
          key:         'email',
          type:        'email',
          label:       'form.email',
          placeholder: 'john@example.com',
          icon:        'i-lucide-mail',
          validation:  { required: true, email: true },
        },
        {
          key:         'phone',
          type:        'tel',
          label:       'form.phone',
          placeholder: '+855 xx xxx xxx',
          icon:        'i-lucide-phone',
        },
      ],
    },
    {
      key:   'role',
      title: 'Role & Access',
      icon:  'i-lucide-shield',
      cols:  2,
      fields: [
        {
          key:     'role',
          type:    'select',
          label:   'form.role',
          icon:    'i-lucide-shield',
          options: [
            { label: t('user.roles.admin'),   value: 'admin' },
            { label: t('user.roles.manager'), value: 'manager' },
            { label: t('user.roles.editor'),  value: 'editor' },
            { label: t('user.roles.viewer'),  value: 'viewer' },
            { label: t('user.roles.guest'),   value: 'guest' },
          ],
          validation: { required: true },
        },
        {
          key:     'department',
          type:    'text',
          label:   'form.department',
          icon:    'i-lucide-building',
          placeholder: 'Engineering',
        },
        {
          key:   'active',
          type:  'toggle',
          label: 'common.active',
          defaultValue: true,
        },
      ],
    },
  ],
}

const formData = ref<Partial<UserCreatePayload>>({
  active: true,
  role:   'viewer',
})

function handleSubmit(data: Record<string, unknown>) {
  emit('submit', data as UserCreatePayload)
}
</script>

<template>
  <RFormBuilder
    :model-value="modelValue"
    :schema="schema"
    :data="formData"
    :title="$t('user.create')"
    subtitle="Fill in the details to create a new account"
    icon="i-lucide-user-plus-2"
    :loading="loading"
    id="create-user"
    @update:model-value="$emit('update:modelValue', $event)"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  />
</template>
