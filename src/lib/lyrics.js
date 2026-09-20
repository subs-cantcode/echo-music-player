const LRCLIB_BASE = 'https://lrclib.net/api'

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

export function parseSyncedLyrics(lrcText) {
  const lines = lrcText.split('\n')
  const result = []
  const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    const text = line.replace(timeRegex, '').trim()

    if (!text) continue

    for (const match of matches) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const centiseconds = parseInt(match[3].padEnd(3, '0').slice(0, 2), 10)
      const time = minutes * 60 + seconds + centiseconds / 100
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