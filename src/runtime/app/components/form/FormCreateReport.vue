<script setup lang="ts">
// FormCreateReport — Create a scheduled report
import { ref } from 'vue'
import type { FormSchema, ReportCreatePayload } from '@/types/form'

const props = withDefaults(defineProps<{
  modelValue: boolean
  loading?:   boolean
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  submit:  [data: ReportCreatePayload]
  cancel:  []
}>()

const schema: FormSchema = {
  groups: [
    {
      key:  'report',
      cols: 2,
      fields: [
        {
          key:         'title',
          type:        'text',
          label:       'report.title',
          placeholder: 'Monthly Revenue Report',
          icon:        'i-lucide-file-bar-chart',
          validation:  { required: true },
          cols:        2,
        },
        {
          key:     'type',
          type:    'select',
          label:   'report.type',
          icon:    'i-lucide-layout-dashboard',
          options: [
            { label: 'Revenue',      value: 'revenue' },
            { label: 'Users',        value: 'users' },
            { label: 'Engagement',   value: 'engagement' },
            { label: 'Performance',  value: 'performance' },
            { label: 'Custom',       value: 'custom' },
          ],
          validation: { required: true },
        },
        {
          key:     'schedule',
          type:    'select',
          label:   'report.schedule',
          icon:    'i-lucide-clock',
          options: [
            { label: 'Once',      value: 'once' },
            { label: 'Daily',     value: 'daily' },
            { label: 'Weekly',    value: 'weekly' },
            { label: 'Monthly',   value: 'monthly' },
            { label: 'Quarterly', value: 'quarterly' },
          ],
          defaultValue: 'once',
        },
      ],
    },
    {
      key:   'period',
      title: 'report.period',
      icon:  'i-lucide-calendar-range',
      cols:  2,
      fields: [
        {
          key:   'dateFrom',
          type:  'date',
          label: 'form.startDate',
          icon:  'i-lucide-calendar',
        },
        {
          key:   'dateTo',
          type:  'date',
          label: 'form.endDate',
          icon:  'i-lucide-calendar-check',
        },
      ],
    },
  ],
}

const formData = ref<Partial<ReportCreatePayload>>({
  schedule: 'once',
})

function handleSubmit(data: Record<string, unknown>) {
  emit('submit', data as ReportCreatePayload)
}
</script>

<template>
  <RFormBuilder
    :model-value="modelValue"
    :schema="schema"
    :data="formData"
    :title="$t('report.create')"
    subtitle="Configure and generate a new report"
    icon="i-lucide-file-bar-chart-2"
    :submit-label="'report.generate'"
    :loading="loading"
    id="create-report"
    @update:model-value="$emit('update:modelValue', $event)"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  />
</template>
