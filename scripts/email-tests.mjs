import assert from 'node:assert/strict'
import { normalizeEmail, stableEmailId } from '../src/services/emailModel.js'
import { normalizeGraphMessage } from '../src/services/graphEmailService.js'
import { normalizeGmailMessage } from '../src/services/emailService.js'
import { aggregateMessages } from '../src/services/unifiedEmailService.js'

const gmail = normalizeGmailMessage({
  id: 'gmail-1', labelIds: ['UNREAD', 'IMPORTANT'], internalDate: '1735689600000', snippet: 'Hello &amp; world',
  payload: { headers: [{ name: 'From', value: 'Bank <bank@example.test>' }, { name: 'Subject', value: 'Action required' }] },
})
const qub = normalizeGraphMessage({
  id: 'graph-1', from: { emailAddress: { name: 'University', address: 'office@qub.ac.uk' } },
  subject: 'Module deadline', bodyPreview: '<b>Read this</b>', receivedDateTime: '2025-01-02T10:00:00Z', isRead: false, importance: 'normal', webLink: 'https://outlook.office.com/mail/id',
}, 'stable-account', 'bfarson01@qub.ac.uk')

assert.equal(gmail.id, 'gmail:gmail-1')
assert.equal(qub.id, 'qub:graph-1')
assert.equal(gmail.provider, 'gmail')
assert.equal(qub.accountId, 'stable-account')
assert.equal(gmail.senderAddress, 'bank@example.test')
assert.equal(qub.preview, 'Read this')
assert.equal(qub.webUrl.startsWith('https://'), true)
assert.equal(normalizeEmail({ provider: 'qub', providerMessageId: 'empty', receivedAt: new Date('invalid'), subject: '', senderName: '', preview: '<i>x</i>' }).receivedAt, null)
assert.equal(normalizeEmail({ provider: 'qub', providerMessageId: 'unsafe', webUrl: 'javascript:alert(1)' }).webUrl, null)
assert.equal(stableEmailId('gmail', 'same'), 'gmail:same')

const result = aggregateMessages([
  { id: 'gmail', data: [{ ...gmail, relevanceScore: 1, receivedAt: new Date('2025-01-04') }], error: null },
  { id: 'qub', data: [{ ...qub, relevanceScore: 9, receivedAt: new Date('2025-01-01') }], error: new Error('permission denied') },
], 1)
assert.equal(result.data.length, 1)
assert.equal(result.data[0].provider, 'qub')
assert.equal(result.providers.qub.message, 'permission denied')

const sorted = aggregateMessages([{ id: 'mixed', data: [
  { ...gmail, id: 'gmail:new', relevanceScore: 2, receivedAt: new Date('2025-01-05') },
  { ...qub, id: 'qub:old', relevanceScore: 2, receivedAt: new Date('2025-01-01') },
] }], 8)
assert.equal(sorted.data[0].id, 'gmail:new')
console.log('email normalization and aggregation tests passed')