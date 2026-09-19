import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar.jsx'
import NowPlayingBar from './components/NowPlayingBar.jsx'
import UserMenu from './components/UserMenu.jsx'
import { useAudioPlayer } from './hooks/useAudioPlayer.js'
import { LibraryProvider, useLibrary } from './lib/LibraryContext.jsx'

import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Playlists, { PlaylistDetail } from './pages/Playlists.jsx'
import Favourites from './pages/Favourites.jsx'
import Upload from './pages/Upload.jsx'
import Settings from './pages/Settings.jsx'

// Fisher-Yates shuffle of track ids, optionally keeping one id at the front.
function buildShuffleOrder(tracks, firstId) {
  const ids = tracks.map((t) => t.id).filter((id) => id !== firstId)

  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = ids[i]
    ids[i] = ids[j]
    ids[j] = swap
  }

  return firstId ? [firstId, ...ids] : ids
}

function AppLayout() {
  const { tracks, deleteTrack, toggleFavourite, logPlay } = useLibrary()
  const [currentTrack, setCurrentTrack] = useState(null)
  const currentTrackRef = useRef(null)
  const [shuffleOn, setShuffleOn] = useState(false)
  // Track ids for the current shuffled pass; empty when shuffle is off.
  const playOrderRef = useRef([])

  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  // The player stores its ended callback in a ref, so it can call through one of
  // ours. The handler needs the library order, which is defined further down.
  const endedHandlerRef = useRef(null)

  const {
    isPlaying, currentTime, duration, progress, volume, isMuted, loopMode,
    playTrack, togglePlay, seek, setVolume, toggleMute, toggleLoop,
  } = useAudioPlayer({
    onEnded: (timeListened, mode) => endedHandlerRef.current?.(timeListened, mode),
  })

  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [uploadToast, setUploadToast] = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setUploadToast(true)
    toastTimer.current = setTimeout(() => setUploadToast(false), 2500)
  }, [])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault()
        togglePlay()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [togglePlay])

  const handlePlayTrack = useCallback(async (track) => {
    if (!track) return
    // Picking a track by hand mid-shuffle restarts the shuffled pass from it.
    if (shuffleOn && !playOrderRef.current.includes(track.id)) {
      playOrderRef.current = buildShuffleOrder(tracks, track.id)
    }
    setCurrentTrack(track)
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id)
      return [track, ...filtered].slice(0, 10)
    })
    await playTrack(track.objectUrl)
  }, [playTrack, shuffleOn, tracks])

  // Home: play the whole library in a fresh random order.
  const handleShuffleAll = useCallback(() => {
    if (tracks.length === 0) return
    playOrderRef.current = buildShuffleOrder(tracks)
    setShuffleOn(true)
    const first = tracks.find((t) => t.id === playOrderRef.current[0])
    if (first) handlePlayTrack(first)
  }, [tracks, handlePlayTrack])

  // Player bar: toggle shuffle without interrupting the current track.
  const toggleShuffle = useCallback(() => {
    const next = !shuffleOn
    playOrderRef.current = next ? buildShuffleOrder(tracks, currentTrackRef.current?.id) : []
    setShuffleOn(next)
  }, [shuffleOn, tracks])

  const handleTrackEnd = useCallback(
    (timeListened, mode) => {
      const track = currentTrackRef.current
      if (track) logPlay(track.id, timeListened)

      // Single-track repeats are handled by the audio element's own loop flag.
      if (!track || mode === 'track') return

      let next = null

      if (shuffleOn) {
        const order = playOrderRef.current
        const position = order.indexOf(track.id)
        const nextId = position >= 0 ? order[position + 1] : null

        if (nextId) {
          next = tracks.find((t) => t.id === nextId) || null
        } else if (mode === 'all' && tracks.length > 0) {
          // Loop all: start a fresh shuffled pass.
          playOrderRef.current = buildShuffleOrder(tracks)
          next = tracks.find((t) => t.id === playOrderRef.current[0]) || null
        }
      } else {
        const index = tracks.findIndex((t) => t.id === track.id)
        next =
          index >= 0 && index < tracks.length - 1
            ? tracks[index + 1]
            : mode === 'all'
              ? tracks[0]
              : null
      }

      if (next) handlePlayTrack(next)
    },
    [logPlay, tracks, handlePlayTrack, shuffleOn]
  )

  // Player bar skip buttons move whole tracks. Shuffle follows the current
  // shuffled pass; both directions wrap around the queue.
  const goToAdjacentTrack = useCallback(
    (step) => {
      const track = currentTrackRef.current
      if (!track || tracks.length === 0) return

      let next = null

      if (shuffleOn) {
        let order = playOrderRef.current
        // Shuffle may have been switched on since this track started.
        if (!order.includes(track.id)) {
          order = buildShuffleOrder(tracks, track.id)
          playOrderRef.current = order
        }
        const position = order.indexOf(track.id)
        const nextId = order[(position + step + order.length) % order.length]
        next = tracks.find((t) => t.id === nextId) || null
      } else {
        const index = tracks.findIndex((t) => t.id === track.id)
        if (index < 0) return
        next = tracks[(index + step + tracks.length) % tracks.length]
      }

      // A one-track library lands back on itself: no-op rather than a restart.
      if (next && next.id !== track.id) handlePlayTrack(next)
    },
    [tracks, shuffleOn, handlePlayTrack]
  )

  const handleNextTrack = useCallback(() => goToAdjacentTrack(1), [goToAdjacentTrack])
  const handlePreviousTrack = useCallback(() => goToAdjacentTrack(-1), [goToAdjacentTrack])

  useEffect(() => {
    endedHandlerRef.current = handleTrackEnd
  }, [handleTrackEnd])

  const location = useLocation()

  return (
    <div className="min-h-screen bg-bg font-sans app-layout grid grid-cols-[80px_1fr]">
      <UserMenu />
      <Sidebar />

      <main className="main-content flex flex-col min-w-0 overflow-x-hidden">
        <div className="max-w-[680px] mx-auto px-5 w-full">
          <Routes location={location}>
            <Route path="/" element={
              <Home tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack}
                onDelete={deleteTrack} onToggleFavourite={toggleFavourite} recentlyPlayed={recentlyPlayed}
                onShuffleAll={handleShuffleAll} />
            } />
            <Route path="/search" element={
              <Search tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack}
                onDelete={deleteTrack} onToggleFavourite={toggleFavourite} />
            } />
            <Route path="/playlists" element={
              <Playlists tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack} />
            } />
            <Route path="/playlists/:id" element={
              <PlaylistDetail tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack} />
            } />
            <Route path="/favourites" element={
              <Favourites tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack}
                onDelete={deleteTrack} onToggleFavourite={toggleFavourite} />
            } />
            <Route path="/upload" element={
              <Upload onUploaded={showToast} />
            } />
            <Route path="/settings" element={<Settings />} />
          </Routes>

          {uploadToast && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border rounded-xl px-4 py-2.5 shadow-lg text-sm text-fg flex items-center gap-2 fade-in">
              <i className="bi bi-check-circle-fill text-accent-text" />
              Import complete
            </div>
          )}
        </div>

        <NowPlayingBar
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          progress={progress}
          volume={volume}
          isMuted={isMuted}
          loopMode={loopMode}
          onToggleLoop={toggleLoop}
          shuffleOn={shuffleOn}
          onToggleShuffle={toggleShuffle}
          onPlayPause={togglePlay}
          onSkipBack={handlePreviousTrack}
          onSkipForward={handleNextTrack}
          onSeek={seek}
          onSetVolume={setVolume}
          onToggleMute={toggleMute}
          onToggleFavourite={async () => {
            if (!currentTrack) return
            const updated = await toggleFavourite(currentTrack.id)
            if (updated) setCurrentTrack((prev) => prev ? { ...prev, isFavourite: updated.isFavourite } : prev)
          }}
        />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LibraryProvider>
        <AppLayout />
      </LibraryProvider>
    </BrowserRouter>
  )
}
