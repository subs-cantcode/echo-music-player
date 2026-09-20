import { useState, useEffect, useCallback } from 'react'
import * as localLib from '../lib/localLibrary.js'

export const useLocalLibrary = () => {
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const [tracksData, playlistsData] = await Promise.all([
          localLib.getAllTracks(),
          localLib.getAllPlaylists(),
        ])
        setTracks(tracksData)
        setPlaylists(playlistsData)
      } catch (error) {
        console.error('Failed to load library:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLibrary()
  }, [])

  const addTrack = useCallback(async (file, metadata = {}) => {
    const newTrack = await localLib.addTrack(file, metadata)
    setTracks((prev) => [...prev, newTrack])
    return newTrack
  }, [])

  const deleteTrack = useCallback(async (trackId) => {
    await localLib.deleteTrack(trackId)
    setTracks((prev) => prev.filter((t) => t.id !== trackId))
    setPlaylists((prev) =>
      prev.map((p) =>
        (p.trackIds || []).includes(trackId)
          ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }
          : p
      )
    )
  }, [])

  const toggleFavourite = useCallback(async (trackId) => {
    const updated = await localLib.toggleFavourite(trackId)
    if (!updated) return null
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, ...updated } : t)))
    return updated
  }, [])

  const createPlaylist = useCallback(async (name, description = '') => {
    const newPlaylist = await localLib.createPlaylist(name, description)
    setPlaylists((prev) => [...prev, newPlaylist])
    return newPlaylist
  }, [])

  const deletePlaylist = useCallback(async (playlistId) => {
    await localLib.deletePlaylist(playlistId)
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
  }, [])

  const addTrackToPlaylist = useCallback(async (playlistId, trackId) => {
    const updated = await localLib.addTrackToPlaylist(playlistId, trackId)
    if (!updated) return null
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
    return updated
  }, [])

  const removeTrackFromPlaylist = useCallback(async (playlistId, trackId) => {
    const updated = await localLib.removeTrackFromPlaylist(playlistId, trackId)
    if (!updated) return null
    setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)))
    return updated
  }, [])

  const clearAllData = useCallback(async () => {
    await localLib.clearAllData()
    setTracks([])
    setPlaylists([])
  }, [])

  const logPlay = useCallback((trackId, duration = 0) => {
    localLib
      .logPlay(trackId, duration)
      .then((updated) => {
        if (!updated) return
        setTracks((prev) =>
          prev.map((t) =>
            t.id === updated.id
              ? { ...t, lastPlayed: updated.lastPlayed, playCount: updated.playCount }
              : t
          )
        )
      })
      .catch((error) => console.error('Failed to log play:', error))
  }, [])

  const getListeningHistory = useCallback(() => localLib.getListeningHistory(), [])

  const updateTrack = useCallback(async (trackId, updates) => {
    return localLib.updateTrack(trackId, updates)
  }, [])

  return {
    tracks,
    playlists,
    loading,
    addTrack,
    deleteTrack,
    toggleFavourite,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    clearAllData,
    logPlay,
    getListeningHistory,
    updateTrack,
  }
}
