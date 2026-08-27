import * as gmail from './emailService.js'
import * as qub from './graphEmailService.js'

export function aggregateMessages(results, limit = 8) {
  const data = results.flatMap(result => result.data)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || (b.receivedAt?.valueOf() || 0) - (a.receivedAt?.valueOf() || 0))
    .slice(0, limit)
    .sort((a, b) => (b.receivedAt?.valueOf() || 0) - (a.receivedAt?.valueOf() || 0))
  return { data, providers: Object.fromEntries(results.map(result => [result.id, result.error])) }
}

export async function getMessages({ gmailConnected, getGmailToken, qubConnected, acquireQubAccess, qubAccount }) {
  const providers = [
    gmailConnected ? { id: 'gmail', run: () => gmail.getMessages({ getToken: getGmailToken }) } : null,
    qubConnected ? { id: 'qub', run: () => qub.getMessages({ acquireAccess: acquireQubAccess, accountId: qubAccount.homeAccountId, accountLabel: qubAccount.username }) } : null,
  ].filter(Boolean)
  const results = await Promise.all(providers.map(async provider => {
    try { return { id: provider.id, data: await provider.run(), error: null } }
    catch (error) { return { id: provider.id, data: [], error } }
  }))
  return aggregateMessages(results)
}