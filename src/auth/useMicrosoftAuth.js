import { useCallback, useEffect, useState } from 'react'
import {
  MICROSOFT_EXPECTED_DOMAIN,
  MICROSOFT_EXPECTED_EMAIL,
  MICROSOFT_REDIRECT_URI,
  MICROSOFT_SCOPES,
  msalInstance,
} from './microsoftConfig'

function accountEmail(account) {
  return (account?.username || account?.idTokenClaims?.preferred_username || '').toLowerCase()
}

function publicError(error, resource = 'mailbox') {
  const code = error?.errorCode || error?.code || 'unknown_error'
  const message = String(error?.message || '').toLowerCase()
  if (code === 'user_cancelled' || code === 'user_canceled' || message.includes('cancel')) {
    return { code, message: 'Microsoft sign-in was cancelled.' }
  }
  if (/consent|admin_consent|access_denied/.test(`${code} ${message}`)) {
    return { code, message: `QUB approval is required before this dashboard can read the ${resource}.` }
  }
  if (/conditional_access|mfa|interaction/.test(`${code} ${message}`)) {
    return { code, message: 'Microsoft requires an interactive sign-in or MFA check. Reconnect QUB to continue.' }
  }
  return { code, message: 'QUB mailbox access is unavailable. Reconnect and try again.' }
}

export function useMicrosoftAuth() {
  const [ready, setReady] = useState(!msalInstance)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!msalInstance) return undefined
    let cancelled = false
    msalInstance.initialize()
      .then(() => {
        if (cancelled) return
        const match = msalInstance.getAllAccounts().find(candidate => accountEmail(candidate) === MICROSOFT_EXPECTED_EMAIL)
        setAccount(match || null)
        setReady(true)
      })
      .catch(errorValue => { if (!cancelled) { setError(publicError(errorValue)); setReady(true) } })
    return () => { cancelled = true }
  }, [])

  const connectWithScopes = useCallback(async (additionalScopes = []) => {
    if (!msalInstance) { setError({ code: 'missing_client_id', message: 'Microsoft QUB access is not configured yet. Add the public client ID in the build environment.' }); return false }
    setError(null)
    try {
      const result = await msalInstance.loginPopup({
        scopes: [...new Set(additionalScopes)],
        prompt: 'select_account',
        loginHint: MICROSOFT_EXPECTED_EMAIL,
        redirectUri: MICROSOFT_REDIRECT_URI,
      })
      const signedInEmail = accountEmail(result.account)
      if (!signedInEmail.endsWith(`@${MICROSOFT_EXPECTED_DOMAIN}`) || signedInEmail !== MICROSOFT_EXPECTED_EMAIL) {
        setError({ code: 'wrong_account', message: 'Choose the QUB account bfarson01@qub.ac.uk to connect this service.' })
        return false
      }
      setAccount(result.account)
      return true
    } catch (errorValue) {
      setError(publicError(errorValue, 'OneDrive files'))
      return false
    }
  }, [])

  const connect = useCallback(async () => {
    if (!msalInstance) { setError({ code: 'missing_client_id', message: 'Microsoft QUB email is not configured yet. Add the public client ID in the build environment.' }); return false }
    setError(null)
    try {
      const result = await msalInstance.loginPopup({
        scopes: MICROSOFT_SCOPES,
        prompt: 'select_account',
        loginHint: MICROSOFT_EXPECTED_EMAIL,
        redirectUri: MICROSOFT_REDIRECT_URI,
      })
      const signedInEmail = accountEmail(result.account)
      if (!signedInEmail.endsWith(`@${MICROSOFT_EXPECTED_DOMAIN}`) || signedInEmail !== MICROSOFT_EXPECTED_EMAIL) {
        setAccount(null)
        setError({ code: 'wrong_account', message: 'Choose the QUB account bfarson01@qub.ac.uk to connect this mailbox.' })
        return false
      }
      setAccount(result.account)
      return true
    } catch (errorValue) {
      setError(publicError(errorValue))
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setError(null)
  }, [])

  const acquireAccess = useCallback(async (scopes = MICROSOFT_SCOPES) => {
    if (!msalInstance || !account) throw Object.assign(new Error('QUB is disconnected'), { code: 'disconnected' })
    try {
      const result = await msalInstance.acquireTokenSilent({ account, scopes })
      return result.accessToken
    } catch (errorValue) {
      const details = publicError(errorValue, scopes.includes('Files.Read') ? 'OneDrive files' : 'mailbox')
      if (details.code === 'interaction_required' || /interaction/i.test(details.code)) {
        throw Object.assign(new Error('QUB needs you to reconnect.'), { code: 'interaction_required' })
      }
      throw Object.assign(new Error(details.message), { code: details.code })
    }
  }, [account])

  return {
    ready,
    account,
    accountEmail: accountEmail(account),
    error,
    connect,
    connectWithScopes,
    disconnect,
    acquireAccess,
    isConnected: !!account,
    configurationReady: !!msalInstance,
  }
}