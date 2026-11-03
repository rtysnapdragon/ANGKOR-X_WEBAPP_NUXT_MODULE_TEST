<script setup lang="ts">
// FormInviteUser — Invite a user by email
import { ref } from 'vue'
import type { FormSchema } from '@/types/form'
import type { UserInvitePayload } from '@/types/form'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  modelValue: boolean
  loading?:   boolean
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  submit:  [data: UserInvitePayload]
  cancel:  []
}>()

const { t } = useI18n()

const schema: FormSchema = {
  groups: [
    {
      key:  'invite',
      cols: 1,
      fields: [
        {
          key:         'email',
          type:        'email',
          label:       'form.email',
          placeholder: 'user.inviteEmail',
          icon:        'i-lucide-mail',
          validation:  { required: true, email: true },
        },
        {
          key:     'role',
          type:    'select',
          label:   'form.role',
          placeholder: 'user.inviteRole',
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
          key:         'message',
          type:        'textarea',
          label:       'form.message',
          placeholder: 'user.inviteMessage',
          rows:        3,
        },
      ],
    },
  ],
}

const formData = ref<Partial<UserInvitePayload>>({
  role: 'viewer',
})

function handleSubmit(data: Record<string, unknown>) {
  emit('submit', data as UserInvitePayload)
}
</script>

<template>
  <RFormBuilder
    :model-value="modelValue"
    :schema="schema"
    :data="formData"
    :title="$t('user.invite')"
    subtitle="Send an invitation link via email"
    icon="i-lucide-user-plus"
    :submit-label="'user.inviteSend'"
    :loading="loading"
    id="invite-user"
    @update:model-value="$emit('update:modelValue', $event)"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  />
</template>
