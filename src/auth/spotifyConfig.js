export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
export const SPOTIFY_AUTHORITY = 'https://accounts.spotify.com'
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
export const SPOTIFY_SCOPES = ['user-follow-read', 'user-library-read']
export const SPOTIFY_REDIRECT_URI = `${window.location.origin}${import.meta.env.BASE_URL}`
