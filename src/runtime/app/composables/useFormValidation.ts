// ============================================================
// SARIKA — useFormValidation composable
// ============================================================
import { ref, computed } from 'vue'
import type { FormField } from '@/types/form'

export function useFormValidation(fields: FormField[]) {
  const errors  = ref<Record<string, string>>({})
  const touched = ref<Record<string, boolean>>({})

  function validateField(field: FormField, value: unknown): string | null {
    const v = field.validation
    if (!v) return null

    if (v.required && (value === null || value === undefined || value === ''))
      return 'validation.required'

    if (typeof value === 'string') {
      if (v.minLength && value.length < v.minLength)
        return `Minimum ${v.minLength} characters required`
      if (v.maxLength && value.length > v.maxLength)
        return `Maximum ${v.maxLength} characters allowed`
      if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return 'validation.email'
      if (v.url) {
        try { new URL(value) } catch { return 'validation.url' }
      }
      if (v.pattern && !new RegExp(v.pattern).test(value))
        return 'validation.pattern'
    }

    if (typeof value === 'number') {
      if (v.min !== undefined && value < v.min) return `Minimum value is ${v.min}`
      if (v.max !== undefined && value > v.max) return `Maximum value is ${v.max}`
    }

    if (v.custom) {
      const res = v.custom(value)
      if (typeof res === 'string') return res
      if (res === false) return 'Invalid value'
    }

    return null
  }

  function validate(data: Record<string, unknown>): boolean {
    errors.value = {}
    let valid = true

    for (const field of fields) {
      if (field.type === 'divider' || field.type === 'heading' || field.hidden) continue
      const err = validateField(field, data[field.key])
      if (err) {
        errors.value[field.key] = err
        valid = false
      }
    }

    return valid
  }

  function touchField(key: string, value: unknown, field: FormField) {
    touched.value[key] = true
    const err = validateField(field, value)
    if (err) errors.value[key] = err
    else delete errors.value[key]
  }

  function reset() {
    errors.value  = {}
    touched.value = {}
  }

  const hasErrors = computed(() => Object.keys(errors.value).length > 0)
  const isValid   = computed(() => !hasErrors.value)

  return {
    errors,
    touched,
    validate,
    touchField,
    reset,
    hasErrors,
    isValid,
  }
}
