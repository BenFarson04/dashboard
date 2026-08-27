const DEFAULT_NEW_CARD_VISIBILITY = { podcasts: true }
const OBSOLETE_CARD_IDS = new Set(['fund'])

export function migrateDashboardSettings(settings, defaults = DEFAULT_NEW_CARD_VISIBILITY) {
  const cards = settings?.cards
  const order = Array.isArray(cards?.order) ? cards.order.filter(id => !OBSOLETE_CARD_IDS.has(id)) : []
  const visible = cards?.visible && typeof cards.visible === 'object' ? { ...cards.visible } : {}
  delete visible.fund
  let changed = !cards || !Array.isArray(cards.order) || !cards.visible || typeof cards.visible !== 'object'
  changed ||= order.length !== cards.order.length || Object.prototype.hasOwnProperty.call(cards?.visible || {}, 'fund')

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