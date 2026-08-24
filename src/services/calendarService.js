// Calendar data service.
// -----------------------------------------------------------------------------
// CURRENT: returns mock events.
// FUTURE:  replace getEvents() with a Microsoft Graph call, e.g.
//          GET /me/calendarView?startDateTime=...&endDateTime=...
//          using a read-only delegated token (scope: Calendars.Read).
//          Token acquisition must happen via MSAL; do NOT store secrets here.
// -----------------------------------------------------------------------------
import { mockEvents } from '../data/mockData'
import { delay, maybeFail } from './_helpers'

export const meta = { key: 'calendar', name: 'Calendar', source: 'mock' }

export async function getEvents({ failRate = 0 } = {}) {
  await delay(400)
  maybeFail(failRate)
  // Sorted chronologically so the UI can rely on order.
  return [...mockEvents].sort((a, b) => new Date(a.start) - new Date(b.start))
}
