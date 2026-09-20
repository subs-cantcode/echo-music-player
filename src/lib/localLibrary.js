import { getDB } from './indexedDB.js'

const HISTORY_KEY = 'echoHistory'
const DEMO_SEEDED_KEY = 'echo-demo-seeded'
const MAX_HISTORY_ENTRIES = 1000

// Object URLs are session-scoped: they cannot be persisted, so we keep one
// cached blob URL per track id and regenerate it from the stored File on load.
const objectUrls = new Map()

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function stripExtension(fileName) {
  return String(fileName || '').replace(/\.[^/.]+$/, '')
}

// Whether an incoming file looks like it already exists in the library, so the
// import flow can ask before silently creating a duplicate.
export const findPotentialDuplicate = (tracks, fileName, extractedTitle, extractedArtist) => {
  const normalizedFileName = stripExtension(fileName).toLowerCase().trim()

  return (
    tracks.find((t) => {
      const titleMatch =
        (extractedTitle && t.title.toLowerCase().trim() === extractedTitle.toLowerCase().trim()) ||
        t.title.toLowerCase().trim() === normalizedFileName

      const artistMatch =
        !extractedArtist || t.artist.toLowerCase().trim() === extractedArtist.toLowerCase().trim()

      return titleMatch && artistMatch
    }) || null
  )
}

const getDb = () => getDB()

function storeOperation(storeName, mode, action) {
  return getDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], mode)
        const store = transaction.objectStore(storeName)
        const request = action(store)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
  )
}

function revokeObjectUrl(trackId) {
  const url = objectUrls.get(trackId)
  if (url) {
    URL.revokeObjectURL(url)
    objectUrls.delete(trackId)
  }
}

function withObjectUrl(track) {
  if (!track) return null

  let url = objectUrls.get(track.id)
  if (!url && track.file instanceof Blob) {
    url = URL.createObjectURL(track.file)
    objectUrls.set(track.id, url)
  }

  return { ...track, objectUrl: url || track.objectUrl || '' }
}

function readAudioDuration(file) {
  return new Promise((resolve) => {
    if (!file || typeof document === 'undefined') {
      resolve(0)
      return
    }

    const url = URL.createObjectURL(file)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'

    let settled = false
    const done = (value) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(value) && value > 0 ? value : 0)
    }

    audio.onloadedmetadata = () => done(audio.duration)
    audio.onerror = () => done(0)
    setTimeout(() => done(0), 10000)
    audio.src = url
  })
}

// Builds a playable silent WAV clip so first-visit demo tracks behave like real
// audio instead of returning a playback error.
function createSilentWavFile(fileName, seconds) {
  const sampleRate = 8000
  const frameCount = Math.max(1, Math.floor(seconds * sampleRate))
  const dataSize = frameCount // 8-bit mono = 1 byte per sample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true) // byte rate
  view.setUint16(32, 1, true) // block align
  view.setUint16(34, 8, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // 8-bit PCM silence is 128 (unsigned midpoint)
  new Uint8Array(buffer, 44).fill(128)

  return new File([buffer], fileName, { type: 'audio/wav' })
}

/* -------------------------------------------------------------------------- */
/* Library lifecycle                                                          */
/* -------------------------------------------------------------------------- */

export const initializeLibrary = async () => {
  await getDb()
  await seedDemoLibrary()
}

/* -------------------------------------------------------------------------- */
/* Tracks                                                                     */
/* -------------------------------------------------------------------------- */

export async function addTrack(file, metadata = {}) {
  const duration = metadata.duration ?? (await readAudioDuration(file))

  const track = {
    id: generateId(),
    file,
    title: metadata.title || stripExtension(file?.name) || 'Untitled',
    artist: metadata.artist || 'Unknown Artist',
    album: metadata.album || 'Unknown Album',
    duration: Number(duration) || 0,
    genre: metadata.genre || 'Uncategorized',
    year: metadata.year || new Date().getFullYear(),
    isFavourite: false,
    dateAdded: new Date().toISOString(),
    lastPlayed: null,
    playCount: 0,
    lyrics: metadata.lyrics || null,
    artwork: metadata.artwork || null,
  }

  await storeOperation('tracks', 'readwrite', (store) => store.add(track))
  return withObjectUrl(track)
}

export async function getAllTracks() {
  const rows = await storeOperation('tracks', 'readonly', (store) => store.getAll())
  return rows.map(withObjectUrl)
}

export async function getTrackById(trackId) {
  const track = await storeOperation('tracks', 'readonly', (store) => store.get(trackId))
  return withObjectUrl(track)
}

export async function deleteTrack(trackId) {
  await storeOperation('tracks', 'readwrite', (store) => store.delete(trackId))
  revokeObjectUrl(trackId)
}

export async function toggleFavourite(trackId) {
  const track = await storeOperation('tracks', 'readonly', (store) => store.get(trackId))
  if (!track) return null

  const updated = { ...track, isFavourite: !track.isFavourite }
  await storeOperation('tracks', 'readwrite', (store) => store.put(updated))
  return withObjectUrl(updated)
}

export async function updateTrack(trackId, updates) {
  const track = await storeOperation('tracks', 'readonly', (store) => store.get(trackId))
  if (!track) return null

  const allowedFields = ['title', 'artist', 'album', 'genre', 'year', 'lyrics', 'artwork']
  const filteredUpdates = {}
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key]
    }
  }

  const updated = { ...track, ...filteredUpdates }
  await storeOperation('tracks', 'readwrite', (store) => store.put(updated))
  return withObjectUrl(updated)
}

/* -------------------------------------------------------------------------- */
/* Playlists                                                                  */
/* -------------------------------------------------------------------------- */

export async function createPlaylist(name, description = '', trackIds = []) {
  const playlist = {
    id: generateId(),
    name,
    description,
    trackIds,
    dateCreated: new Date().toISOString(),
    coverImage: null,
  }

  await storeOperation('playlists', 'readwrite', (store) => store.add(playlist))
  return playlist
}

export async function getAllPlaylists() {
  return storeOperation('playlists', 'readonly', (store) => store.getAll())
}

export async function getPlaylistById(playlistId) {
  return storeOperation('playlists', 'readonly', (store) => store.get(playlistId))
}

export async function deletePlaylist(playlistId) {
  await storeOperation('playlists', 'readwrite', (store) => store.delete(playlistId))
}

async function updatePlaylistTrackIds(playlistId, updater) {
  const playlist = await getPlaylistById(playlistId)
  if (!playlist) return null

  const updated = { ...playlist, trackIds: updater(playlist.trackIds || []) }
  await storeOperation('playlists', 'readwrite', (store) => store.put(updated))
  return updated
}

export async function addTrackToPlaylist(playlistId, trackId) {
  return updatePlaylistTrackIds(playlistId, (trackIds) =>
    trackIds.includes(trackId) ? trackIds : [...trackIds, trackId]
  )
}

export async function removeTrackFromPlaylist(playlistId, trackId) {
  return updatePlaylistTrackIds(playlistId, (trackIds) => trackIds.filter((id) => id !== trackId))
}

/* -------------------------------------------------------------------------- */
/* Listening history                                                          */
/* -------------------------------------------------------------------------- */

export function getListeningHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function pushListeningHistory(trackId, duration) {
  const history = getListeningHistory()
  history.push({
    trackId,
    playedAt: new Date().toISOString(),
    duration: Math.max(0, Math.round(duration) || 0),
  })

  while (history.length > MAX_HISTORY_ENTRIES) history.shift()
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export async function logPlay(trackId, duration = 0) {
  pushListeningHistory(trackId, duration)

  const track = await storeOperation('tracks', 'readonly', (store) => store.get(trackId))
  if (!track) return null

  const updated = {
    ...track,
    lastPlayed: new Date().toISOString(),
    playCount: (track.playCount || 0) + 1,
  }
  await storeOperation('tracks', 'readwrite', (store) => store.put(updated))
  return withObjectUrl(updated)
}

/* -------------------------------------------------------------------------- */
/* Destructive / maintenance                                                  */
/* -------------------------------------------------------------------------- */

export async function clearAllData() {
  const db = await getDb()

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks', 'playlists'], 'readwrite')
    transaction.objectStore('tracks').clear()
    transaction.objectStore('playlists').clear()

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })

  for (const url of objectUrls.values()) URL.revokeObjectURL(url)
  objectUrls.clear()
  localStorage.removeItem(HISTORY_KEY)
}

/* -------------------------------------------------------------------------- */
/* Demo data                                                                  */
/* -------------------------------------------------------------------------- */

const DEMO_TRACKS = [
  {
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    duration: 244,
    genre: 'Synth-pop',
    year: 2011,
  },
  {
    title: 'Electric Feel',
    artist: 'MGMT',
    album: 'Oracular Spectacular',
    duration: 206,
    genre: 'Psychedelic Pop',
    year: 2007,
  },
  {
    title: 'Take On Me',
    artist: 'a-ha',
    album: 'Hunting High and Low',
    duration: 225,
    genre: 'Synth-pop',
    year: 1985,
  },
  {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    genre: 'Synthwave',
    year: 2019,
  },
  {
    title: 'Ocean Avenue',
    artist: 'Yellowcard',
    album: 'Ocean Avenue',
    duration: 240,
    genre: 'Pop Punk',
    year: 2003,
  },
]

// Seeds once ever, so "Clear all data" leaves the library empty afterwards.
async function seedDemoLibrary() {
  if (localStorage.getItem(DEMO_SEEDED_KEY)) return

  const tracks = await getAllTracks()
  if (tracks.length === 0) {
    for (const demoTrack of DEMO_TRACKS) {
      const file = createSilentWavFile(`${demoTrack.title}.wav`, demoTrack.duration)
      await addTrack(file, demoTrack)
    }
  }

  localStorage.setItem(DEMO_SEEDED_KEY, '1')
}
