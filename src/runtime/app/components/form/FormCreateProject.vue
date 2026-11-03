<script setup lang="ts">
// FormCreateProject — Create a new project
import { ref } from 'vue'
import type { FormSchema, ProjectCreatePayload } from '@/types/form'

const props = withDefaults(defineProps<{
  modelValue: boolean
  loading?:   boolean
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  submit:  [data: ProjectCreatePayload]
  cancel:  []
}>()

const schema: FormSchema = {
  groups: [
    {
      key:  'info',
      cols: 2,
      fields: [
        {
          key:         'name',
          type:        'text',
          label:       'project.name',
          placeholder: 'My Awesome Project',
          icon:        'i-lucide-folder',
          validation:  { required: true, minLength: 2 },
          cols:        2,
        },
        {
          key:         'description',
          type:        'textarea',
          label:       'form.description',
          placeholder: 'What is this project about?',
          rows:        3,
          cols:        2,
        },
        {
          key:    'color',
          type:   'color',
          label:  'form.color',
          defaultValue: '#ff8c42',
        },
        {
          key:     'status',
          type:    'select',
          label:   'form.status',
          options: [
            { label: 'Active',   value: 'active' },
            { label: 'On Hold',  value: 'on_hold' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'active',
          validation: { required: true },
        },
      ],
    },
    {
      key:   'schedule',
      title: 'project.schedule',
      icon:  'i-lucide-calendar',
      cols:  2,
      fields: [
        {
          key:   'startDate',
          type:  'date',
          label: 'form.startDate',
          icon:  'i-lucide-calendar',
        },
        {
          key:   'endDate',
          type:  'date',
          label: 'form.endDate',
          icon:  'i-lucide-calendar-check',
        },
      ],
    },
  ],
}

const formData = ref<Partial<ProjectCreatePayload>>({
  status: 'active',
  color:  '#ff8c42',
})

function handleSubmit(data: Record<string, unknown>) {
  emit('submit', data as ProjectCreatePayload)
}
</script>

<template>
  <RFormBuilder
    :model-value="modelValue"
    :schema="schema"
    :data="formData"
    :title="$t('project.create')"
    subtitle="Set up a new project workspace"
    icon="i-lucide-folder-plus"
    :loading="loading"
    id="create-project"
    @update:model-value="$emit('update:modelValue', $event)"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  />
</template>
