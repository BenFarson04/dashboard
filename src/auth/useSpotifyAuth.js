import { useCallback, useEffect, useRef, useState } from 'react'
import { SPOTIFY_AUTHORITY, SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPES } from './spotifyConfig'

const STATE_KEY = 'pd.spotify.oauth.state'
const VERIFIER_KEY = 'pd.spotify.oauth.verifier'

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

async function challengeFor(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

async function exchangeCode(code, verifier) {
  const response = await fetch(`${SPOTIFY_AUTHORITY}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID, grant_type: 'authorization_code', code,
      redirect_uri: SPOTIFY_REDIRECT_URI, code_verifier: verifier,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error_description || 'Spotify authorization failed.')
  return data
}

async function fetchProfile(accessToken) {
  const response = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) return null
  return response.json()
}

export function useSpotifyAuth() {
  const [ready, setReady] = useState(!SPOTIFY_CLIENT_ID)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState(null)
  const tokenRef = useRef(null)

  const finishCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const storedState = sessionStorage.getItem(STATE_KEY)
    const verifier = sessionStorage.getItem(VERIFIER_KEY)
    if (!code && !params.get('error')) return
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash)
    sessionStorage.removeItem(STATE_KEY)
    sessionStorage.removeItem(VERIFIER_KEY)
    if (params.get('error')) throw new Error('Spotify connection was cancelled.')
    if (!state || state !== storedState || !verifier) throw new Error('Spotify authorization state could not be verified.')
    const token = await exchangeCode(code, verifier)
    tokenRef.current = { accessToken: token.access_token, expiresAt: Date.now() + (token.expires_in - 60) * 1000 }
    setAccount(await fetchProfile(token.access_token))
  }, [])

  useEffect(() => {
    if (!SPOTIFY_CLIENT_ID) return undefined
    finishCallback().catch(errorValue => setError(errorValue.message)).finally(() => setReady(true))
    return undefined
  }, [finishCallback])

  const connect = useCallback(async () => {
    if (!SPOTIFY_CLIENT_ID) { setError('Spotify is not configured yet. Add VITE_SPOTIFY_CLIENT_ID.'); return false }
    setError(null)
    const state = randomString(32)
    const verifier = randomString(64)
    sessionStorage.setItem(STATE_KEY, state)
    sessionStorage.setItem(VERIFIER_KEY, verifier)
    const challenge = await challengeFor(verifier)
    const params = new URLSearchParams({
      response_type: 'code', client_id: SPOTIFY_CLIENT_ID, redirect_uri: SPOTIFY_REDIRECT_URI,
      scope: SPOTIFY_SCOPES.join(' '), state, code_challenge_method: 'S256', code_challenge: challenge,
    })
    window.location.assign(`${SPOTIFY_AUTHORITY}/authorize?${params}`)
    return true
  }, [])

  const disconnect = useCallback(() => {
    tokenRef.current = null
    setAccount(null)
    setError(null)
  }, [])

  const getToken = useCallback(async () => {
    const token = tokenRef.current
    if (token && Date.now() < token.expiresAt) return token.accessToken
    throw Object.assign(new Error('Spotify is disconnected.'), { code: 'disconnected' })
  }, [])

  return { ready, account, error, connect, disconnect, getToken, isConnected: !!account, configurationReady: !!SPOTIFY_CLIENT_ID }
}
