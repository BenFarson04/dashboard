const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const PAGE_SIZE = 30
const MAX_PAGES = 4

function graphError(status, code) {
  const message = status === 401
    ? 'QUB needs you to reconnect before OneDrive can be read.'
    : status === 403
      ? 'QUB administrator approval may be required before this dashboard can read OneDrive files.'
      : status === 404
        ? 'This QUB account does not have a provisioned OneDrive.'
        : status === 429
          ? 'Microsoft Graph is temporarily throttling requests. Try again shortly.'
          : 'OneDrive could not be loaded. Check your connection and try again.'
  const error = new Error(message)
  error.code = code || `graph_http_${status}`
  error.status = status
  return error
}

function safeWebUrl(value) {
  return /^https:\/\//i.test(value || '') ? value : null
}

function extensionFor(name = '') {
  const match = name.toLowerCase().match(/\.([a-z0-9]{1,12})$/)
  return match ? match[1] : ''
}

function categoryFor(item, extension) {
  if (item.folder) return 'folders'
  const mime = item.file?.mimeType || ''
  if (mime === 'application/pdf' || extension === 'pdf') return 'pdfs'
  if (/word|document|text|rtf/.test(mime) || /docx?|odt|txt|rtf|md/.test(extension)) return 'documents'
  if (/spreadsheet|excel|csv/.test(mime) || /xlsx?|csv|ods/.test(extension)) return 'spreadsheets'
  if (/presentation|powerpoint/.test(mime) || /pptx?|odp/.test(extension)) return 'presentations'
  if (mime.startsWith('image/') || /gif|jpe?g|png|svg|webp|bmp|tiff?/.test(extension)) return 'images'
  return 'other'
}

export function normalizeDriveItem(item, accountId = 'test-account', accountLabel = 'QUB') {
  if (!item || typeof item !== 'object' || !item.id || typeof item.name !== 'string') return null
  const extension = extensionFor(item.name)
  const modified = new Date(item.lastModifiedDateTime || '')
  const created = new Date(item.createdDateTime || '')
  return {
    id: `qub:${item.id}`, graphId: item.id, name: item.name, extension,
    mimeType: item.file?.mimeType || null, size: Number.isFinite(item.size) ? item.size : null,
    modifiedAt: Number.isNaN(modified.valueOf()) ? null : modified.toISOString(),
    createdAt: Number.isNaN(created.valueOf()) ? null : created.toISOString(),
    modifiedBy: item.lastModifiedBy?.user?.displayName || null, isFolder: !!item.folder,
    parentPath: item.parentReference?.path || null, webUrl: safeWebUrl(item.webUrl),
    canDownload: !!item.file, category: categoryFor(item, extension), provider: 'qub-onedrive',
    accountId, accountLabel,
  }
}

async function graphJson(url, token, fetchImpl = fetch) {
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    let code = ''
    try { code = (await response.json()).error?.code || '' } catch { /* ignore malformed error response */ }
    throw graphError(response.status, code)
  }
  return response.json()
}

async function collectItems(url, token, accountId, accountLabel, fetchImpl) {
  const items = []
  let nextUrl = url
  for (let page = 0; nextUrl && page < MAX_PAGES; page += 1) {
    const payload = await graphJson(nextUrl, token, fetchImpl)
    for (const item of payload.value || []) {
      const normalized = normalizeDriveItem(item, accountId, accountLabel)
      if (normalized) items.push(normalized)
    }
    nextUrl = payload['@odata.nextLink']
    if (nextUrl && !/^https:\/\/graph\.microsoft\.com\//i.test(nextUrl)) nextUrl = null
  }
  return [...new Map(items.map(item => [item.id, item])).values()]
}

const select = 'id,name,size,file,folder,webUrl,lastModifiedDateTime,createdDateTime,lastModifiedBy,parentReference'

export async function getDrive({ acquireAccess, fetchImpl = fetch }) {
  const token = await acquireAccess(['Files.Read'])
  const params = new URLSearchParams({ '$select': 'webUrl' })
  const payload = await graphJson(`${GRAPH_BASE}/me/drive?${params}`, token, fetchImpl)
  return safeWebUrl(payload.webUrl)
}

export async function getRecentFiles({ acquireAccess, accountId, accountLabel, fetchImpl = fetch }) {
  const token = await acquireAccess(['Files.Read'])
  const params = new URLSearchParams({ '$top': String(PAGE_SIZE), '$select': select })
  return collectItems(`${GRAPH_BASE}/me/drive/recent?${params}`, token, accountId, accountLabel, fetchImpl)
}

export async function searchFiles({ acquireAccess, query, accountId, accountLabel, fetchImpl = fetch }) {
  const term = String(query || '').trim()
  if (!term) return []
  const token = await acquireAccess(['Files.Read'])
  const escaped = term.replace(/'/g, "''")
  const params = new URLSearchParams({ '$top': String(PAGE_SIZE), '$select': select })
  return collectItems(`${GRAPH_BASE}/me/drive/root/search(q='${encodeURIComponent(escaped)}')?${params}`, token, accountId, accountLabel, fetchImpl)
}