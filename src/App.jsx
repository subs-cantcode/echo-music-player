import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
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

function AppLayout() {
  const { tracks, deleteTrack, toggleFavourite, logPlay } = useLibrary()
  const [currentTrack, setCurrentTrack] = useState(null)
  const currentTrackRef = useRef(null)

  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  // The player stores its ended callback in a ref, so it can call through one of
  // ours. The handler needs the library order, which is defined further down.
  const endedHandlerRef = useRef(null)

  const {
    isPlaying, currentTime, duration, progress, volume, isMuted, loopMode,
    playTrack, togglePlay, skip, seek, setVolume, toggleMute, toggleLoop,
  } = useAudioPlayer({
    onEnded: (timeListened, mode) => endedHandlerRef.current?.(timeListened, mode),
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
    setCurrentTrack(track)
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id)
      return [track, ...filtered].slice(0, 10)
    })
    await playTrack(track.objectUrl)
  }, [playTrack])

  const handleTrackEnd = useCallback(
    (timeListened, mode) => {
      const track = currentTrackRef.current
      if (track) logPlay(track.id, timeListened)

      // Single-track repeats are handled by the audio element's own loop flag.
      if (!track || mode === 'track') return

      const index = tracks.findIndex((t) => t.id === track.id)
      const next =
        index >= 0 && index < tracks.length - 1
          ? tracks[index + 1]
          : mode === 'all'
            ? tracks[0]
            : null

      if (next) handlePlayTrack(next)
    },
    [logPlay, tracks, handlePlayTrack]
  )

  useEffect(() => {
    endedHandlerRef.current = handleTrackEnd
  }, [handleTrackEnd])

  const location = useLocation()

  return (
    <div className="min-h-screen bg-bg font-sans">
      <UserMenu />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />

      <main
        className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pt-4 pb-28 ${
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[220px]'
        }`}
      >
        <div className="max-w-[680px] mx-auto px-5">
          <Routes location={location}>
            <Route path="/" element={
              <Home tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack}
                onDelete={deleteTrack} onToggleFavourite={toggleFavourite} recentlyPlayed={recentlyPlayed} />
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
              <i className="bi bi-check-circle-fill text-accent" />
              Import complete
            </div>
          )}
        </div>
      </main>

      <NowPlayingBar
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        volume={volume}
        isMuted={isMuted}
        sidebarCollapsed={sidebarCollapsed}
        loopMode={loopMode}
        onToggleLoop={toggleLoop}
        onPlayPause={togglePlay}
        onSkipBack={() => skip(-10)}
        onSkipForward={() => skip(10)}
        onSeek={seek}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onToggleFavourite={async () => {
          if (!currentTrack) return
          const updated = await toggleFavourite(currentTrack.id)
          if (updated) setCurrentTrack((prev) => prev ? { ...prev, isFavourite: updated.isFavourite } : prev)
        }}
      />
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
