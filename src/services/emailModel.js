export const EMAIL_PROVIDERS = {
  gmail: { label: 'Gmail', tone: 'green' },
  qub: { label: 'QUB', tone: 'blue' },
}

export function stableEmailId(provider, providerMessageId) {
  return `${provider}:${providerMessageId}`
}

export function normalizeEmail({ provider, accountId, accountLabel, providerMessageId, senderName, senderAddress, subject, preview, receivedAt, isRead, isImportant, categories, relevanceScore, relevanceReasons, webUrl }) {
  const date = receivedAt instanceof Date && !Number.isNaN(receivedAt.valueOf()) ? receivedAt : null
  return {
    id: stableEmailId(provider, providerMessageId), provider, accountId, accountLabel,
    providerMessageId, senderName: senderName || 'Unknown sender', senderAddress: senderAddress || '',
    subject: subject || '(no subject)', preview: String(preview || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    receivedAt: date, isRead: Boolean(isRead), isImportant: Boolean(isImportant),
    categories: categories?.length ? categories : ['other'], relevanceScore: relevanceScore || 0,
    relevanceReasons: relevanceReasons || [], webUrl: /^https:\/\//i.test(webUrl || '') ? webUrl : null,
    // Compatibility fields used by the existing UI and briefing.
    sender: senderName || 'Unknown sender', senderEmail: senderAddress || '', received: date,
    unread: !isRead, importance: isImportant || (relevanceScore || 0) >= 6 ? 'high' : (relevanceScore || 0) >= 3 ? 'medium' : 'low',
    category: categories?.[0] || 'other', reason: relevanceReasons?.join(' ') || 'Recent message from your inbox.',
  }
}