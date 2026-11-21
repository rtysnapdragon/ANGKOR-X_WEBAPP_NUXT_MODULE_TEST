import { onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useBreadCrumb } from './breadCrumb'
import { useHttp } from './https'

const resolveValue = (value) => {
  if (typeof value === 'function') return value()
  return unref(value)
}

const resolveRaw = value => unref(value)

const getPath = (source, path) => {
  if (!path || source == null) return undefined
  return String(path)
    .split('.')
    .reduce((current, key) => (current == null ? undefined : current[key]), source)
}

const firstDefined = (...values) => values.find(value => value !== undefined && value !== null && value !== '')

const commonRecord = (payload) => {
  if (!payload || typeof payload !== 'object') return {}
  return payload.Data?.Item
    ?? payload.data?.item
    ?? payload.Data
    ?? payload.data
    ?? payload.Response
    ?? payload.response
    ?? payload.Result
    ?? payload.result
    ?? payload.Item
    ?? payload.item
    ?? payload
}

const defaultApiPatch = (payload) => {
  if (typeof payload === 'string') return { title: payload }
  const record = commonRecord(payload)
  return {
    title: firstDefined(record.Title, record.Name, record.Label, record.PageName, record.FeatureName),
    description: firstDefined(record.Description, record.Desc, record.Note, record.Remark),
    icon: firstDefined(record.Icon, record.PageIcon),
  }
}

const pickApiPatch = (payload, pick) => {
  if (typeof pick === 'function') return pick(payload)
  if (!pick || typeof pick !== 'object') return defaultApiPatch(payload)
  const patch = {}
  for (const [target, path] of Object.entries(pick)) {
    const value = getPath(payload, path)
    if (value !== undefined) patch[target] = value
  }
  return patch
}

const normalizePatch = (patch) => {
  if (!patch || typeof patch !== 'object') return {}
  const aliases = {
    title: patch.title,
    description: firstDefined(patch.description, patch.desc),
    icon: patch.icon,
    hasBack: firstDefined(patch.showBack, patch.hasBack),
    backTooltip: patch.backTooltip,
    fnBack: firstDefined(patch.backAction, patch.fnBack),
    items: patch.items,
    actions: patch.actions,
    rightTemplate: patch.rightTemplate,
    leftButton: patch.leftButton,
    separatorIcon: patch.separatorIcon,
  }
  return Object.fromEntries(Object.entries(aliases).filter(([, value]) => value !== undefined))
}

const buildState = (raw = {}) => {
  const feature = resolveValue(raw.feature)
  const flow = resolveValue(raw.flow ?? raw.page)
  const parts = [feature, flow].filter(value => value !== undefined && value !== null && value !== '')
  const title = firstDefined(resolveValue(raw.title), parts.join(' - '))
  const items = firstDefined(resolveValue(raw.items), parts.map(label => ({ label })))
  const showBack = firstDefined(resolveValue(raw.showBack), resolveValue(raw.hasBack))
  const backAction = firstDefined(resolveRaw(raw.backAction), resolveRaw(raw.fnBack))

  return normalizePatch({
    title,
    description: resolveValue(raw.description),
    icon: resolveValue(raw.icon),
    hasBack: showBack,
    backTooltip: resolveValue(raw.backTooltip),
    fnBack: backAction,
    items,
    actions: resolveValue(raw.actions),
    rightTemplate: resolveRaw(raw.rightTemplate),
    leftButton: resolveValue(raw.leftButton),
    separatorIcon: resolveValue(raw.separatorIcon),
  })
}

export const useMountedBreadcrumb = (config = {}) => {
  const state = ref({})
  const reloading = ref(false)
  const resolveConfig = () => resolveValue(config) ?? {}
  let mounted = false
  let crumb
  let stopConfigWatch

  const loadApi = async (raw = resolveConfig()) => {
    const api = resolveValue(raw.api)
    if (!mounted || !api || api.enabled === false) return

    reloading.value = true
    try {
      let payload
      if (typeof api.load === 'function') {
        payload = await api.load()
      }
      else {
        const url = resolveValue(api.url)
        if (!url) return
        const options = resolveValue(api.options) ?? {}
        const response = await useHttp(url, options)
        const error = unref(response?.error)
        if (error) {
          await api.onError?.(error)
          return
        }
        payload = unref(response?.data)
      }

      if (!mounted) return
      const patch = pickApiPatch(payload, api.pick ?? api.map)
      state.value = { ...state.value, ...normalizePatch(patch) }
      await api.onSuccess?.(payload)
    }
    catch (error) {
      await api.onError?.(error)
    }
    finally {
      reloading.value = false
    }
  }

  onMounted(() => {
    mounted = true
    const raw = resolveConfig()
    state.value = buildState(raw)
    crumb = useBreadCrumb(() => state.value)

    stopConfigWatch = watch(
      () => resolveConfig(),
      (next) => {
        if (!mounted) return
        state.value = buildState(next)
        void loadApi(next)
      },
      { deep: true },
    )

    void loadApi(raw)
  })

  onBeforeUnmount(() => {
    mounted = false
    stopConfigWatch?.()
    crumb?.clear()
  })

  return {
    state,
    reloading,
    reload: () => loadApi(),
  }
}

export default useMountedBreadcrumb
