import { useToast } from '#imports'
import queryString from 'query-string'

export const useQueryParams = () => {
  const toast = useToast()

  const encode = (key: string, value: unknown): string => {
    const currentUrl = new URL(window.location.href)
    const currentQueryParams = queryString.parse(currentUrl.search)

    if ((typeof value === 'object' || Array.isArray(value)) && key) {
      try {
        const jsonString = JSON.stringify(value)
        const base64String = btoa(unescape(encodeURIComponent(jsonString)))
        const urlSafeBase64String = encodeURIComponent(base64String)
        const newQueryParams = {
          ...currentQueryParams,
          [key]: urlSafeBase64String,
        }
        const updatedQueryString = queryString.stringify(newQueryParams)
        if (updatedQueryString.length > 2000) {
          toast.add({
            color: 'yellow',
            title: 'Query string exceeds 2000 characters, truncating.',
          })
        }
        return `?${updatedQueryString}`
      } catch {
        console.error('Error encoding object:')
        return currentUrl.href
      }
    }
    return currentUrl.href
  }

  const decode = (): Record<string, unknown> => {
    const currentUrl = new URL(window.location.href)
    const currentQueryParams = queryString.parse(currentUrl.search)

    const newObj: Record<string, unknown> = {}
    for (const paramName in currentQueryParams) {
      try {
        const base64StringDecoded = decodeURIComponent(currentQueryParams[paramName])
        const jsonStringDecoded = decodeURIComponent(escape(atob(base64StringDecoded)))
        const jsonObjectDecoded = JSON.parse(jsonStringDecoded)
        newObj[paramName] = jsonObjectDecoded
      } catch {
        newObj[paramName] = currentQueryParams[paramName]
      }
    }
    return newObj
  }

  const remove = (key: string): string => {
    const currentUrl = new URL(window.location.href)
    const currentQueryParams = queryString.parse(currentUrl.search)
    const { [key]: _removed, ...restParams } = currentQueryParams
    const updatedQueryString = queryString.stringify(restParams)
    return `?${updatedQueryString}`
  }

  const keep = (): string => {
    const currentUrl = new URL(window.location.href)
    const currentQueryParams = queryString.parse(currentUrl.search)
    const updatedQueryString = queryString.stringify(currentQueryParams)
    return `?${updatedQueryString}`
  }

  return { encode, decode, remove, keep }
}

export default useQueryParams