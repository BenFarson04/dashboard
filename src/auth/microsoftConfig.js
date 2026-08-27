import { PublicClientApplication } from '@azure/msal-browser'

export const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
export const MICROSOFT_EXPECTED_EMAIL = 'bfarson01@qub.ac.uk'
export const MICROSOFT_EXPECTED_DOMAIN = 'qub.ac.uk'
export const MICROSOFT_SCOPES = ['User.Read', 'Mail.Read']
export const ONEDRIVE_SCOPES = ['Files.Read']
export const MICROSOFT_AUTHORITY = 'https://login.microsoftonline.com/organizations'
export const MICROSOFT_REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}`

export const msalInstance = MICROSOFT_CLIENT_ID
  ? new PublicClientApplication({
      auth: {
        clientId: MICROSOFT_CLIENT_ID,
        authority: MICROSOFT_AUTHORITY,
        redirectUri: MICROSOFT_REDIRECT_URI,
      },
      cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
    })
  : null