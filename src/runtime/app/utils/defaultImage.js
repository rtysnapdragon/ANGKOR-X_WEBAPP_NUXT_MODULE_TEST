function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  )
}

export function setDefaultImage(event, type) {
  const target = event?.target

  if (!target || target.tagName !== 'IMG') return

  const fallbackMap = {
    img: '/images/defualtProfile.png',
    user: '/img/default-user.png',
    avatar: '/img/default-avatar.png',
    banner: '/img/default-banner.png',
    product: '/img/default-product.png',
  }

  const fallback = fallbackMap[type] || fallbackMap.img

  target.src = fallback
}