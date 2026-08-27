const DEFAULT_NEW_CARD_VISIBILITY = {
  podcasts: true,
  fund: true,
}

export function migrateDashboardSettings(settings, defaults = DEFAULT_NEW_CARD_VISIBILITY) {
  const cards = settings?.cards
  const order = Array.isArray(cards?.order) ? [...cards.order] : []
  const visible = cards?.visible && typeof cards.visible === 'object' ? { ...cards.visible } : {}
  let changed = !cards || !Array.isArray(cards.order) || !cards.visible || typeof cards.visible !== 'object'

  Object.entries(defaults).forEach(([id, defaultVisible]) => {
    if (!order.includes(id)) {
      const quickLinksIndex = order.indexOf('quicklinks')
      order.splice(quickLinksIndex < 0 ? order.length : quickLinksIndex, 0, id)
      changed = true
    }
    if (!Object.prototype.hasOwnProperty.call(visible, id)) {
      visible[id] = defaultVisible
      changed = true
    }
  })

  return changed ? { ...settings, cards: { ...cards, order, visible } } : settings
}