import assert from 'node:assert/strict'
import { filterAndSortEpisodes, formatEpisodeDuration, formatReleaseAge, getPodcastUpdates } from '../src/services/podcastService.js'

const NOW = Date.parse('2026-08-27T12:00:00Z')
const response = data => ({ ok: true, json: async () => data })
const episode = (id, hoursAgo, durationMs, name = id) => ({
  id, name, release_date: new Date(NOW - hoursAgo * 3600000).toISOString(), duration_ms: durationMs,
  external_urls: { spotify: `https://open.spotify.com/episode/${id}` },
})

async function load(episodes, status = 200) {
  const calls = []
  const fetchImpl = async url => {
    calls.push(url)
    if (status !== 200) return { ok: false, status, json: async () => ({ error: { message: 'API unavailable' } }) }
    if (url.includes('/following')) return response({ items: [{ show: { id: 'show-1', name: 'The Fighting Cock' } }] })
    if (url.includes('/me/shows')) return response({ items: [{ show: { id: 'show-1', name: 'The Fighting Cock' } }] })
    return response({ items: episodes.map(item => ({ ...item, show: { name: 'The Fighting Cock' } })) })
  }
  return { result: await getPodcastUpdates({ accessToken: 'test-token', now: NOW, fetchImpl }), calls }
}

assert.rejects(() => getPodcastUpdates({ fetchImpl: async () => response({}) }), error => error.code === 'disconnected')
assert.deepEqual(filterAndSortEpisodes([episode('old', 73, 600000)], NOW), [])
const empty = await load([])
assert.deepEqual(empty.result.items, [])
const one = await load([episode('one', 2, 42 * 60000)])
assert.equal(one.result.items.length, 1)
assert.equal(one.result.items[0].podcastName, 'The Fighting Cock')
const many = await load([episode('older', 73, 600000), episode('newer', 4, 600000), episode('middle', 27, 600000)])
assert.deepEqual(many.result.items.map(item => item.id), ['newer', 'middle'])
assert.equal(formatEpisodeDuration(83 * 60000), '1h 23m')
assert.equal(formatEpisodeDuration(58 * 60000), '58m')
assert.equal(formatReleaseAge(NOW - 2 * 3600000, NOW), '2h ago')
assert.equal(formatReleaseAge(NOW - 30 * 3600000, NOW), 'Yesterday')
assert.equal(formatReleaseAge(NOW - 50 * 3600000, NOW), '2 days ago')
await assert.rejects(() => load([], 500), /API unavailable/)
console.log('✓ Spotify podcast service tests passed (disconnected, empty, recent, sorting, 72h filter, duration, age, errors).')
