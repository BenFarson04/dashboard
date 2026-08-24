import { PublicClientApplication } from '@azure/msal-browser'

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID || 'common'}`,
    // Uses your GitHub Pages sub-path automatically (must match what you registered).
    redirectUri: window.location.origin + import.meta.env.BASE_URL,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

// Read-only, least-privilege scopes.
export const loginRequest = {
  scopes: ['User.Read', 'Calendars.Read', 'Mail.Read'],
}

export const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

export const msal = new PublicClientApplication(msalConfig)