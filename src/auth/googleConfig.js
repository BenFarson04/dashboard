// Google sign-in configuration using Google Identity Services (GIS).
// Token model → returns an access token in the browser. No secret, no backend.
export const GOOGLE_CLIENT_ID = (import.meta.env || {}).VITE_GOOGLE_CLIENT_ID

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
].join(' ')

export const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'
export const GMAIL_BASE = 'https://www.googleapis.com/gmail/v1'