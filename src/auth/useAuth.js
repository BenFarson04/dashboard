// Google auth hook using Google Identity Services (GIS).
import { useCallback, useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from './googleConfig'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
    if (existing) { existing.addEventListener('load', () => resolve()); return }
    const s = document.createElement('script')
    s.src = GIS_SRC; s.async = true; s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google sign-in script'))
    document.head.appendChild(s)
  })
}

export function useAuth() {
  const [ready, setReady] = useState(false)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState(null)
  const tokenRef = useRef(null)
  const clientRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled) return
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPES,
          callback: () => {},
        })
        setReady(true)
      })
      .catch(e => { if (!cancelled) { setError(e.message); setReady(true) } })
    return () => { cancelled = true }
  }, [])

  const requestToken = useCallback((prompt = '') => {
    return new Promise((resolve, reject) => {
      const client = clientRef.current
      if (!client) return reject(new Error('Google sign-in not ready yet'))
      client.callback = (resp) => {
        if (resp.error) return reject(new Error(resp.error))
        const token = { accessToken: resp.access_token, expiresAt: Date.now() + (resp.expires_in - 60) * 1000 }
        tokenRef.current = token
        resolve(token.accessToken)
      }
      try { client.requestAccessToken({ prompt }) } catch (e) { reject(e) }
    })
  }, [])

  const signIn = useCallback(async () => {
    try {
      const at = await requestToken('consent')
      const email = await fetchEmail(at)
      setAccount({ email, username: email })
    } catch (e) { setError(e.message) }
  }, [requestToken])

  const signOut = useCallback(() => {
    const at = tokenRef.current?.accessToken
    if (at && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(at, () => {})
    tokenRef.current = null
    setAccount(null)
  }, [])

  const getToken = useCallback(async () => {
    const t = tokenRef.current
    if (t && Date.now() < t.expiresAt) return t.accessToken
    return requestToken('')
  }, [requestToken])

  return { ready, account, error, signIn, signOut, getToken, isSignedIn: !!account }
}

async function fetchEmail(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return 'Google account'
    const d = await res.json()
    return d.email || 'Google account'
  } catch { return 'Google account' }
}