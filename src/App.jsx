import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import NowPlayingBar from './components/NowPlayingBar.jsx'
import UserMenu from './components/UserMenu.jsx'
import { useAudioPlayer } from './hooks/useAudioPlayer.js'
import { useLibrary } from './hooks/useLibrary.js'
import { getAllTracks } from './lib/api.js'

import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Playlists, { PlaylistDetail } from './pages/Playlists.jsx'
import Favourites from './pages/Favourites.jsx'
import Upload from './pages/Upload.jsx'
import Settings from './pages/Settings.jsx'

function AppLayout() {
  const navigate = useNavigate()
  const { tracks, loading, error, loadTracks, addTracks, removeTrack, toggleFavourite } = useLibrary()
  const {
    isPlaying, currentTime, duration, progress, volume, isMuted,
    playTrack, togglePlay, pause, skip, seek, setVolume, toggleMute,
  } = useAudioPlayer()
  const [currentTrack, setCurrentTrack] = useState(null)
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
  useEffect(() => { loadTracks() }, [loadTracks])

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
    setCurrentTrack(track)
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id)
      return [track, ...filtered].slice(0, 10)
    })
    if (!track.src) {
      const all = await getAllTracks()
      const fresh = all.find((t) => t.id === track.id)
      if (fresh?.src) await playTrack(fresh.src)
    } else {
      await playTrack(track.src)
    }
  }, [playTrack])

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
          {error && (
            <div className="bg-surface border border-border rounded-2xl p-5 text-fg-muted text-center text-sm mb-5">
              {error}
            </div>
          )}

          <Routes location={location}>
            <Route path="/" element={
              <Home tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack}
                onDelete={removeTrack} onToggleFavourite={toggleFavourite} recentlyPlayed={recentlyPlayed} />
            } />
            <Route path="/search" element={
              <Search tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack}
                onDelete={removeTrack} onToggleFavourite={toggleFavourite} />
            } />
            <Route path="/playlists" element={
              <Playlists tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack} />
            } />
            <Route path="/playlists/:id" element={
              <PlaylistDetail tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack} />
            } />
            <Route path="/favourites" element={
              <Favourites tracks={tracks} currentTrack={currentTrack} onPlay={handlePlayTrack}
                onDelete={removeTrack} onToggleFavourite={toggleFavourite} />
            } />
            <Route path="/upload" element={
              <Upload onUploaded={async () => { await loadTracks(); showToast() }} />
            } />
            <Route path="/settings" element={<Settings />} />
          </Routes>

          {uploadToast && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border rounded-xl px-4 py-2.5 shadow-lg text-sm text-fg flex items-center gap-2 fade-in">
              <i className="bi bi-check-circle-fill text-accent" />
              Upload complete
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
        onPlayPause={togglePlay}
        onSkipBack={() => skip(-10)}
        onSkipForward={() => skip(10)}
        onSeek={seek}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onToggleFavourite={async () => {
          if (!currentTrack) return
          await toggleFavourite(currentTrack.id)
          setCurrentTrack((prev) => prev ? { ...prev, is_favorite: !prev.is_favorite } : prev)
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
