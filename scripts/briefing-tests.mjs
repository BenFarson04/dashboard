import assert from 'node:assert/strict'
import { generateBriefing, getBriefingMode } from '../src/services/briefingService.js'

const now = new Date('2025-01-15T09:00:00')
const event = (id, start, title) => ({ id, title, start: new Date(start), end: new Date(new Date(start).getTime() + 3600000) })
const email = (provider, receivedAt, importance = 'low') => ({
  id: `${provider}:1`, provider, sender: provider === 'qub' ? 'University' : 'Gmail sender', subject: 'Synthetic message',
  receivedAt: new Date(receivedAt), unread: true, importance,
})
const task = (id, due, priority = 'medium') => ({ id, title: `Task ${id}`, due: new Date(due), priority, completed: false })

assert.equal(getBriefingMode(new Date('2025-01-15T05:00:00')), 'morning')
assert.equal(getBriefingMode(new Date('2025-01-15T11:59:00')), 'morning')
assert.equal(getBriefingMode(new Date('2025-01-15T12:00:00')), 'afternoon')
assert.equal(getBriefingMode(new Date('2025-01-15T17:59:00')), 'afternoon')
assert.equal(getBriefingMode(new Date('2025-01-15T18:00:00')), 'evening')

const morning = generateBriefing({ now, events: [event('meeting', '2025-01-15T10:00:00', 'Planning')], emails: [email('gmail', '2025-01-14T20:00:00'), email('qub', '2025-01-15T08:00:00')], tasks: [task('overdue', '2025-01-14T09:00:00', 'high')], weather: { location: 'Belfast', current: { tempC: 12, rainProbability: 75, windKph: 10 }, forecast: [] }, news: [{ id: 'news', headline: 'AI regulation', relevanceScore: 9 }] })
assert.equal(morning.mode, 'morning')
assert.match(morning.text, /Good morning/)
assert.match(morning.text, /Gmail/)
assert.match(morning.text, /QUB/)
assert.match(morning.text, /overdue/)
assert.match(morning.text, /Rain is likely/)

const afternoon = generateBriefing({ now: new Date('2025-01-15T14:00:00'), events: [event('past', '2025-01-15T10:00:00', 'Past'), event('next', '2025-01-15T16:00:00', 'Next')], emails: [email('qub', '2025-01-15T08:00:00')], tasks: [task('open', '2025-01-20T09:00:00')], weather: null, news: [] })
assert.equal(afternoon.mode, 'afternoon')
assert.match(afternoon.text, /remaining today/)
assert.match(afternoon.text, /QUB/)

const evening = generateBriefing({ now: new Date('2025-01-15T19:00:00'), events: [event('tomorrow', '2025-01-16T09:00:00', 'Tomorrow meeting')], emails: [email('qub', '2025-01-15T19:00:00', 'high')], tasks: [task('long', '2025-01-14T09:00:00')], news: [] })
assert.equal(evening.mode, 'evening')
assert.match(evening.text, /Tomorrow has/)
assert.match(evening.text, /important unread email/)

const degraded = generateBriefing({ now, events: [], emails: [], tasks: [], weather: null, news: [] })
assert.match(degraded.text, /no meetings scheduled today/)
assert.ok(degraded.text.length < 400)
assert.equal(generateBriefing({ now, prefs: { includeTasks: false, includeEmail: false, includeNews: false } }).parts.some(part => /task|email|news/i.test(part.text)), false)
console.log('briefing mode and degradation tests passed')