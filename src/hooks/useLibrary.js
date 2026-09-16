import { useState, useCallback } from 'react'
import { getAllTracks, uploadTrack, deleteTrack as deleteSupabaseTrack } from '../lib/api.js'

export function useLibrary() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadTracks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllTracks()
      setTracks(data)
    } catch (err) {
      console.error('Failed to load tracks:', err)
      setError(err.message || 'Failed to load tracks')
    } finally {
      setLoading(false)
    }
  }, [])

  const addTracks = useCallback(async (files) => {
    const results = []
    for (const file of files) {
      try {
        const track = await uploadTrack({
          blob: file,
          file: file,
          originalName: file.name,
          title: undefined,
        })
        results.push(track)
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err)
      }
    }
    await loadTracks()
    return results
  }, [loadTracks])

  const removeTrack = useCallback(async (trackId) => {
    try {
      await deleteSupabaseTrack(trackId)
      await loadTracks()
    } catch (err) {
      console.error('Delete failed:', err)
      setError(err.message || 'Failed to delete track')
    }
  }, [loadTracks])

  return {
    tracks,
    loading,
    error,
    loadTracks,
    addTracks,
    removeTrack,
  }
}
