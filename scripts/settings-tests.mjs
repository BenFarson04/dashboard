import assert from 'node:assert/strict'
import { migrateDashboardSettings } from '../src/services/settingsService.js'

const defaultSettings = {
  name: 'Ben',
  cards: {
    order: ['calendar', 'email', 'tasks', 'news', 'weather', 'podcasts', 'fund', 'quicklinks'],
    visible: { calendar: true, email: true, tasks: true, news: true, weather: true, podcasts: true, fund: true, quicklinks: true },
  },
}

const oldSettings = {
  ...defaultSettings,
  name: 'Existing user',
  cards: { order: ['calendar', 'fund', 'quicklinks'], visible: { calendar: true } },
  tasks: { custom: true },
  news: { custom: true },
}

const missingVisibility = migrateDashboardSettings(oldSettings)
assert.equal(missingVisibility.cards.visible.fund, true)
assert.deepEqual(missingVisibility.cards.order, ['calendar', 'fund', 'podcasts', 'quicklinks'])
assert.equal(missingVisibility.name, oldSettings.name)
assert.deepEqual(missingVisibility.tasks, oldSettings.tasks)
assert.deepEqual(missingVisibility.news, oldSettings.news)

const missingOrder = migrateDashboardSettings({ ...oldSettings, cards: { order: ['calendar', 'quicklinks'], visible: { calendar: true } } })
assert.ok(missingOrder.cards.order.includes('fund'))
assert.equal(missingOrder.cards.visible.fund, true)

assert.equal(migrateDashboardSettings({ ...oldSettings, cards: { ...oldSettings.cards, visible: { ...oldSettings.cards.visible, fund: false } } }).cards.visible.fund, false)
assert.equal(migrateDashboardSettings({ ...oldSettings, cards: { ...oldSettings.cards, visible: { ...oldSettings.cards.visible, fund: true } } }).cards.visible.fund, true)

const fresh = migrateDashboardSettings(defaultSettings)
assert.equal(fresh, defaultSettings)
assert.equal(fresh.cards.visible.fund, true)

const futureCard = migrateDashboardSettings({ ...defaultSettings, cards: { ...defaultSettings.cards, order: ['quicklinks'], visible: {} } }, { future: true })
assert.deepEqual(futureCard.cards.order, ['future', 'quicklinks'])
assert.equal(futureCard.cards.visible.future, true)

console.log('dashboard settings migration tests passed')