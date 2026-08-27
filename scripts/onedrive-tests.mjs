import assert from 'node:assert/strict'
import { normalizeDriveItem, getRecentFiles, searchFiles } from '../src/services/oneDriveService.js'

const item = normalizeDriveItem({
  id: 'file-1', name: 'Research.pdf', size: 2048,
  file: { mimeType: 'application/pdf' }, webUrl: 'https://files.test/file-1',
  lastModifiedDateTime: '2025-01-02T10:00:00Z', createdDateTime: '2025-01-01T10:00:00Z',
  lastModifiedBy: { user: { displayName: 'Synthetic User' } }, parentReference: { path: '/drive/root:' },
}, 'stable-account', 'QUB')
assert.equal(item.id, 'qub:file-1')
assert.equal(item.category, 'pdfs')
assert.equal(item.size, 2048)
assert.equal(item.webUrl.startsWith('https://'), true)
assert.equal(item.modifiedBy, 'Synthetic User')
assert.equal(normalizeDriveItem({ id: 'unsafe', name: 'x.txt', webUrl: 'javascript:alert(1)' }).webUrl, null)
assert.equal(normalizeDriveItem({ id: 'folder', name: 'Folder' , folder: {} }).category, 'folders')
assert.equal(normalizeDriveItem({ id: 'unknown', name: 'README' }).extension, '')
assert.equal(normalizeDriveItem({ id: 'bad' }), null)

const requests = []
const fetchImpl = async url => {
  requests.push(url)
  if (requests.length === 1) return { ok: true, json: async () => ({ value: [
    { id: 'one', name: 'one.docx', file: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, webUrl: 'https://files.test/one' },
  ], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/drive/recent?$skiptoken=next' }) }
  return { ok: true, json: async () => ({ value: [
    { id: 'two', name: 'two.xlsx', file: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, webUrl: 'https://files.test/two' },
    { id: 'one', name: 'one.docx', file: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, webUrl: 'https://files.test/one' },
  ] }) }
}
const acquireAccess = async scopes => { assert.deepEqual(scopes, ['Files.Read']); return 'test-token' }
const recent = await getRecentFiles({ acquireAccess, accountId: 'account', accountLabel: 'QUB', fetchImpl })
assert.deepEqual(recent.map(file => file.id), ['qub:one', 'qub:two'])
assert.equal(requests.length, 2)
assert.deepEqual(await searchFiles({ acquireAccess, query: '  ', fetchImpl }), [])
const searchResult = await searchFiles({ acquireAccess, query: "budget & plan", fetchImpl: async url => {
  assert.match(url, /search\(q='budget%20%26%20plan'/)
  return { ok: true, json: async () => ({ value: [] }) }
} })
assert.deepEqual(searchResult, [])
for (const status of [401, 403]) {
  await assert.rejects(
    () => getRecentFiles({ acquireAccess, fetchImpl: async () => ({ ok: false, status, json: async () => ({ error: { code: `HTTP_${status}` } }) }) }),
    error => error.status === status && error.code === `HTTP_${status}`,
  )
}
console.log('OneDrive normalization, pagination, filtering inputs, and safe search tests passed')
