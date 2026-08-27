import assert from 'node:assert/strict'
import { articleStateRecord, normalizeNewsState, sortNewsItems, toggleNewsState } from '../src/services/newsState.js'

const article = (id, published) => ({ id, url: `https://example.com/${id}`, headline: id, source: 'Test', published })
const first = article('first', '2026-08-27T10:00:00Z')
const second = article('second', '2026-08-27T09:00:00Z')

const migrated = normalizeNewsState(['first', 'first', { id: 'second', savedAt: 12 }], 'savedAt')
assert.deepEqual(migrated.map(record => record.id), ['first', 'second'])
assert.equal(migrated[1].savedAt, 12)

let saved = toggleNewsState([], first, 'savedAt')
assert.equal(saved.length, 1)
saved = toggleNewsState(saved, first, 'savedAt')
assert.equal(saved.length, 0)
saved = toggleNewsState([], first, 'savedAt')
assert.equal(toggleNewsState(saved, first, 'savedAt').length, 0)

let pinned = toggleNewsState([], second, 'pinnedAt')
pinned = toggleNewsState(pinned, first, 'pinnedAt')
pinned = pinned.map((record, index) => ({ ...record, pinnedAt: index === 0 ? 2 : 1 }))
assert.deepEqual(sortNewsItems([first, second], pinned).map(item => item.id), ['first', 'second'])
assert.deepEqual(sortNewsItems([first, second], pinned, 'pinned').map(item => item.id), ['second', 'first'])
assert.deepEqual(sortNewsItems([first, second], [articleStateRecord(first, 'pinnedAt')]).map(item => item.id), ['first', 'second'])
assert.deepEqual(sortNewsItems([first, second], pinned).slice(0, 1).map(item => item.id), ['first'])

assert.deepEqual(sortNewsItems([first, second], []).map(item => item.id), ['first', 'second'])
console.log('news saved and pinned state tests passed')