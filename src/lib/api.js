import { supabase } from './supabase.js'

const AUDIO_BUCKET = 'audio-files'
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

function sanitizeTitle(fileName) {
  return String(fileName || '').replace(/\.[^/.]+$/, '')
}

function bytesToLabel(bytes) {
  if (!bytes && bytes !== 0) return 'unknown size'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function extensionFromName(fileName, mimeType) {
  const fromName = String(fileName || '').split('.').pop()
  if (fromName && fromName !== fileName && fromName.length <= 8) {
    return fromName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin'
  }
  const map = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/flac': 'flac',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
  }
  return map[mimeType] || 'bin'
}

function typeLabelFromMime(mimeType) {
  if (!mimeType) return 'AUDIO'
  return mimeType.split('/')[1]?.toUpperCase() || 'AUDIO'
}

function readAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    const done = (value) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    audio.onloadedmetadata = () => {
      const duration = audio.duration
      done(Number.isFinite(duration) ? duration : null)
    }
    audio.onerror = () => done(null)
    setTimeout(() => done(null), 8000)
    audio.src = url
  })
}

function mapTrackRow(row, signedUrl) {
  const size = Number(row.file_size_bytes) || 0
  return {
    id: String(row.id),
    title: row.title || 'Untitled',
    artist: row.artist || null,
    src: signedUrl || '',
    type: typeLabelFromMime(row.mime_type),
    sizeLabel: bytesToLabel(size),
    file_path: row.file_path,
    file_size_bytes: size,
    duration_seconds: row.duration_seconds,
    is_favorite: Boolean(row.is_favorite),
    createdAt: row.created_at ? Date.parse(row.created_at) : 0,
  }
}

async function getOrCreateUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (user) return user

  try {
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
    if (!anonError && anonData.user) {
      await ensureProfile(anonData.user)
      return anonData.user
    }
  } catch {}

  return {
    id: '00000000-0000-0000-0000-000000000000',
    email: null,
    user_metadata: {},
  }
}

async function ensureProfile(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  if (data) return

  const username = String(user.user_metadata?.username || user.email || 'user')
    .split('@')[0]
    .slice(0, 40)
  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    username,
  })
  if (insertError && insertError.code !== '23505') throw insertError
}

export async function getAllTracks() {
  const user = await getOrCreateUser()
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) throw error

  const rows = data || []
  const mapped = []
  for (const row of rows) {
    let src = ''
    try {
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from(AUDIO_BUCKET)
        .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS)
      if (!urlError) src = urlData.signedUrl
    } catch {}
    mapped.push(mapTrackRow(row, src))
  }
  return mapped
}

export async function uploadTrack(record) {
  const user = await getOrCreateUser()
  const file = record.blob || record.file
  if (!file) throw new Error('No audio file to upload.')

  const id = crypto.randomUUID()
  const ext = extensionFromName(record.originalName || file.name, file.type)
  const filePath = `${user.id}/${id}.${ext}`
  const title = record.title || sanitizeTitle(file.name) || 'Untitled'
  const size = file.size || 0

  const { error: uploadError } = await supabase
    .storage
    .from(AUDIO_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
  if (uploadError) throw uploadError

  const duration = await readAudioDuration(file)

  const { data: row, error: insertError } = await supabase
    .from('tracks')
    .insert({
      id,
      user_id: user.id,
      title,
      artist: record.artist || null,
      file_path: filePath,
      duration_seconds: duration,
      file_size_bytes: size,
      original_name: record.originalName || file.name,
      mime_type: file.type || null,
      is_favorite: false,
    })
    .select('*')
    .single()

  if (insertError) {
    await supabase.storage.from(AUDIO_BUCKET).remove([filePath])
    throw insertError
  }

  const { error: usageError } = await supabase.rpc('adjust_storage_bytes', { delta: size })
  if (usageError) {
    console.warn('Could not update storage_bytes_used', usageError)
  }

  const { data: urlData, error: urlError } = await supabase
    .storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS)
  const src = urlError ? '' : urlData.signedUrl

  return mapTrackRow(row, src)
}

export async function deleteTrack(trackId) {
  const user = await getOrCreateUser()
  const { data: row, error: fetchError } = await supabase
    .from('tracks')
    .select('id, file_path, file_size_bytes')
    .eq('id', trackId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!row) return false

  if (row.file_path) {
    const { error: storageError } = await supabase
      .storage
      .from(AUDIO_BUCKET)
      .remove([row.file_path])
    if (storageError) throw storageError
  }

  const { error: deleteError } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId)
    .eq('user_id', user.id)
  if (deleteError) throw deleteError

  const size = Number(row.file_size_bytes) || 0
  if (size) {
    const { error: usageError } = await supabase.rpc('adjust_storage_bytes', { delta: -size })
    if (usageError) {
      console.warn('Could not update storage_bytes_used', usageError)
    }
  }
  return true
}

export { sanitizeTitle, bytesToLabel }
