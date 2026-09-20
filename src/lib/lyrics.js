const LRCLIB_BASE = 'https://lrclib.net/api'
const LYRICS_OVH_BASE = 'https://api.lyrics.ovh/v1'

export async function fetchLyrics(artist, title, duration) {
  try {
    const params = new URLSearchParams({
      artist_name: artist,
      track_name: title,
    })
    if (duration) params.set('duration', Math.round(duration))

    const res = await fetch(`${LRCLIB_BASE}/get?${params}`)
    if (!res.ok) return null

    const data = await res.json()
    if (data.syncedLyrics) return { synced: true, text: data.syncedLyrics }
    if (data.plainLyrics) return { synced: false, text: data.plainLyrics }
    return null
  } catch (e) {
    console.warn('Lyrics fetch failed:', e)
    return null
  }
}

// Plain-text fallback. lyrics.ovh is CORS-friendly and key-free, but returns no
// timestamps, so anything from here renders static rather than synced.
export async function fetchLyricsOvh(artist, title) {
  try {
    if (!artist || !title) return null

    const res = await fetch(
      `${LYRICS_OVH_BASE}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    if (!res.ok) return null

    const data = await res.json()
    const text = String(data?.lyrics || '')
      .replace(/\r\n/g, '\n')
      .trim()
    if (!text) return null

    return { synced: false, text, source: 'lyrics.ovh' }
  } catch (e) {
    console.warn('lyrics.ovh fetch failed:', e)
    return null
  }
}

export async function searchLyrics(query) {
  try {
    const params = new URLSearchParams({ q: query })
    const res = await fetch(`${LRCLIB_BASE}/search?${params}`)
    if (!res.ok) return []

    const data = await res.json()
    return data.map((item) => ({
      artist: item.artistName,
      title: item.trackName,
      album: item.albumName,
      duration: item.duration,
      syncedLyrics: item.syncedLyrics,
      plainLyrics: item.plainLyrics,
    }))
  } catch (e) {
    console.warn('Lyrics search failed:', e)
    return []
  }
}

// Matches [mm:ss], [mm:ss.xx], [mm:ss.xxx] and the single-digit variants people
// paste (e.g. [1:5.5]); section headers like [Verse 1] have no colon so miss it.
const LRC_TIME = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

export function isSyncedLyrics(text) {
  if (typeof text !== 'string') return false
  LRC_TIME.lastIndex = 0
  return LRC_TIME.test(text)
}

export function parseSyncedLyrics(lrcText) {
  const lines = lrcText.split('\n')
  const result = []

  for (const line of lines) {
    const pattern = new RegExp(LRC_TIME.source, 'g')
    const matches = [...line.matchAll(pattern)]
    const text = line.replace(pattern, '').trim()

    if (!text) continue

    for (const match of matches) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const hundredths = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2), 10) : 0
      const time = minutes * 60 + seconds + hundredths / 100
      result.push({ time, text })
    }
  }

  result.sort((a, b) => a.time - b.time)
  return result
}

export function getCurrentLyricLine(parsedLyrics, currentTime) {
  if (!parsedLyrics?.length) return null

  let currentLine = null
  for (const line of parsedLyrics) {
    if (line.time <= currentTime) {
      currentLine = line
    } else {
      break
    }
  }
  return currentLine
}