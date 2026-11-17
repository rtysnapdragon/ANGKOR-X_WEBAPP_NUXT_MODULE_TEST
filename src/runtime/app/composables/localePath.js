import { useCookie } from '#imports'

export default (path) => {
  const locale = useCookie('i18n_redirected').value

  if (!path.startsWith('/')) {
    path = `/${path}`
  }

  return locale && locale !== 'en'
    ? `/${locale}${path}`
    : path
}