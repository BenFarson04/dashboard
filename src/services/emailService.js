// Email data service.
// -----------------------------------------------------------------------------
// CURRENT: returns a curated mock shortlist.
// FUTURE:  replace with Microsoft Graph, e.g. GET /me/messages?$top=25&$select=...
//          scored client-side (or in a backend) to produce a "relevant" shortlist.
//          Scope: Mail.Read (read-only delegated). Never send message content to
//          an AI service in this first version.
// -----------------------------------------------------------------------------
import { mockEmails } from '../data/mockData'
import { delay, maybeFail } from './_helpers'

export const meta = { key: 'email', name: 'Email', source: 'mock' }

export async function getRelevantEmails({ failRate = 0 } = {}) {
  await delay(500)
  maybeFail(failRate)
  return [...mockEmails].sort((a, b) => new Date(b.received) - new Date(a.received))
}
