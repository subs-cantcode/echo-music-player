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

function md5(str) {
  function rotateLeft(n, s) {
    return (n << s) | (n >>> (32 - s))
  }
  function addUnsigned(a, b) {
    const lsw = (a & 0xffff) + (b & 0xffff)
    const msw = (a >> 16) + (b >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  function F(x, y, z) { return (x & y) | (~x & z) }
  function G(x, y, z) { return (x & z) | (y & ~z) }
  function H(x, y, z) { return x ^ y ^ z }
  function I(x, y, z) { return y ^ (x | ~z) }

  const utf8 = unescape(encodeURIComponent(str))
  const len = utf8.length
  const bytes = new Uint8Array(len + 64)
  for (let i = 0; i < len; i++) bytes[i] = utf8.charCodeAt(i)
  bytes[len] = 0x80
  const bitLen = len * 8
  bytes[len + 56] = bitLen & 0xff
  bytes[len + 57] = (bitLen >> 8) & 0xff
  bytes[len + 58] = (bitLen >> 16) & 0xff
  bytes[len + 59] = (bitLen >> 24) & 0xff

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476

  for (let i = 0; i < bytes.length; i += 64) {
    const X = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      X[j] = bytes[i + j * 4] | (bytes[i + j * 4 + 1] << 8) | (bytes[i + j * 4 + 2] << 16) | (bytes[i + j * 4 + 3] << 24)
    }
    let aa = a, bb = b, cc = c, dd = d

    const S11 = 7, S12 = 12, S13 = 17, S14 = 22
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21

    const k = [
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
      0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
      0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
      0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
      0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
      0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
      0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
      0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
      0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
      0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
      0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
      0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
      0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
      0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ]

    let idx = 0
    for (let r = 0; r < 4; r++) {
      for (let j = 0; j < 16; j++) {
        let f, g
        if (r === 0) { f = F(b, c, d); g = j }
        else if (r === 1) { f = G(b, c, d); g = (5 * j + 1) % 16 }
        else if (r === 2) { f = H(b, c, d); g = (3 * j + 5) % 16 }
        else { f = I(b, c, d); g = (7 * j) % 16 }
        const temp = d
        d = c
        c = b
        b = addUnsigned(b, rotateLeft(addUnsigned(addUnsigned(a, f), addUnsigned(X[g], k[idx])), r === 0 ? [S11, S12, S13, S14][j % 4] : r === 1 ? [S21, S22, S23, S24][j % 4] : r === 2 ? [S31, S32, S33, S34][j % 4] : [S41, S42, S43, S44][j % 4]))
        a = temp
        idx++
      }
    }
    a = addUnsigned(a, aa)
    b = addUnsigned(b, bb)
    c = addUnsigned(c, cc)
    d = addUnsigned(d, dd)
  }

  return [a, b, c, d].map(x => ('00000000' + (x >>> 0).toString(16)).slice(-8)).join('')
}

async function generateSignature(params) {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('') + API_SECRET
  return md5(sorted)
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