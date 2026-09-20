const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'
const LASTFM_AUTH = 'https://www.last.fm/api/auth/'

const API_KEY = 'YOUR_LASTFM_API_KEY'
const API_SECRET = 'YOUR_LASTFM_API_SECRET'

const SESSION_KEY = 'lastfm-session'
const TOKEN_KEY = 'lastfm-token'

export function isLastFmConfigured() {
  return API_KEY !== 'YOUR_LASTFM_API_KEY' && API_SECRET !== 'YOUR_LASTFM_API_SECRET'
}

export function getLastFmSession() {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function setLastFmSession(key) {
  localStorage.setItem(SESSION_KEY, key)
}

export function clearLastFmSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getAuthUrl() {
  return `${LASTFM_AUTH}?api_key=${API_KEY}&cb=${encodeURIComponent(window.location.origin + '/lastfm-callback')}`
}

export async function getSessionKey(token) {
  const params = new URLSearchParams({
    method: 'auth.getSession',
    api_key: API_KEY,
    token,
    format: 'json',
  })

  const sig = await generateSignature({ method: 'auth.getSession', api_key: API_KEY, token })
  params.set('api_sig', sig)

  const res = await fetch(`${LASTFM_API}?${params}`, { method: 'POST' })
  const data = await res.json()
  return data.session?.key || null
}

async function generateSignature(params) {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('') + API_SECRET
  const encoder = new TextEncoder()
  const data = encoder.encode(sorted)
  const hash = await crypto.subtle.digest('MD5', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function signedRequest(method, extraParams = {}, requireAuth = true) {
  const params = {
    method,
    api_key: API_KEY,
    format: 'json',
    ...extraParams,
  }

  if (requireAuth) {
    const sessionKey = getLastFmSession()
    if (!sessionKey) throw new Error('Not authenticated')
    params.sk = sessionKey
  }

  params.api_sig = await generateSignature(params)

  const res = await fetch(`${LASTFM_API}?${new URLSearchParams(params)}`, { method: 'POST' })
  return res.json()
}

export async function scrobbleTrack(track, timestamp = Math.floor(Date.now() / 1000)) {
  if (!isLastFmConfigured()) return { success: false, error: 'Last.fm not configured' }

  try {
    const res = await signedRequest('track.scrobble', {
      artist: track.artist,
      track: track.title,
      album: track.album || '',
      timestamp: timestamp.toString(),
      duration: track.duration ? Math.round(track.duration).toString() : undefined,
    })

    return { success: !!res.scrobbles }
  } catch (e) {
    console.error('Scrobble failed:', e)
    return { success: false, error: e.message }
  }
}

export async function updateNowPlaying(track) {
  if (!isLastFmConfigured()) return { success: false }

  try {
    const res = await signedRequest('track.updateNowPlaying', {
      artist: track.artist,
      track: track.title,
      album: track.album || '',
      duration: track.duration ? Math.round(track.duration).toString() : undefined,
    })
    return { success: !!res.nowplaying }
  } catch (e) {
    console.error('Now playing update failed:', e)
    return { success: false, error: e.message }
  }
}

export async function loveTrack(track) {
  if (!isLastFmConfigured()) return { success: false }

  try {
    const res = await signedRequest('track.love', {
      artist: track.artist,
      track: track.title,
    })
    return { success: !!res }
  } catch (e) {
    console.error('Love track failed:', e)
    return { success: false, error: e.message }
  }
}

export async function unloveTrack(track) {
  if (!isLastFmConfigured()) return { success: false }

  try {
    const res = await signedRequest('track.unlove', {
      artist: track.artist,
      track: track.title,
    })
    return { success: !!res }
  } catch (e) {
    console.error('Unlove track failed:', e)
    return { success: false, error: e.message }
  }
}