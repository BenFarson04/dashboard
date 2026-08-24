import { useCallback, useEffect, useState } from 'react'
import { msal, loginRequest } from './msalConfig'

export function useAuth() {
  const [ready, setReady] = useState(false)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await msal.initialize()
        await msal.handleRedirectPromise()
        const existing = msal.getAllAccounts()[0] || null
        if (!cancelled) { setAccount(existing); setReady(true) }
      } catch (e) {
        if (!cancelled) { setError(e.message); setReady(true) }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const signIn = useCallback(async () => {
    try {
      const res = await msal.loginPopup(loginRequest)
      msal.setActiveAccount(res.account)
      setAccount(res.account)
    } catch (e) { setError(e.message) }
  }, [])

  const signOut = useCallback(async () => {
    const acc = msal.getActiveAccount() || msal.getAllAccounts()[0]
    await msal.logoutPopup({ account: acc })
    setAccount(null)
  }, [])

  const getToken = useCallback(async () => {
    const acc = msal.getActiveAccount() || msal.getAllAccounts()[0]
    if (!acc) throw new Error('Not signed in')
    try {
      const res = await msal.acquireTokenSilent({ ...loginRequest, account: acc })
      return res.accessToken
    } catch {
      const res = await msal.acquireTokenPopup(loginRequest)
      return res.accessToken
    }
  }, [])

  return { ready, account, error, signIn, signOut, getToken, isSignedIn: !!account }
}