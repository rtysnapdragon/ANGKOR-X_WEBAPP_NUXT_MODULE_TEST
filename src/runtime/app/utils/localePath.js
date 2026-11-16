// With strategy: "no_prefix", all locales share the same URLs.
// localePath is always an identity function — no prefix added.
export default function localePath(path) {
  if (!path || typeof path !== 'string') return '/'
  return path.startsWith('/') ? path : `/${path}`
}
