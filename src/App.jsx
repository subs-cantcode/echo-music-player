import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import NowPlayingBar from './components/NowPlayingBar.jsx'
import { useAudioPlayer } from './hooks/useAudioPlayer.js'
import { useLibrary } from './hooks/useLibrary.js'
import { getAllTracks } from './lib/api.js'

import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Playlists, { PlaylistDetail } from './pages/Playlists.jsx'
import Favourites from './pages/Favourites.jsx'
import Upload from './pages/Upload.jsx'
import Settings from './pages/Settings.jsx'

function UploadSuccess({ visible }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 text-accent text-sm font-medium transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!visible}
    >
      <i className="bi bi-check-circle-fill" />
      Upload complete
    </div>
  )
}

function AppLayout() {
  const navigate = useNavigate()
  const { tracks, loading, error, loadTracks, addTracks, removeTrack, toggleFavourite } = useLibrary()
  const {
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    playTrack,
    togglePlay,
    pause,
    skip,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer()
  const [currentTrack, setCurrentTrack] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [uploadSuccessVisible, setUploadSuccessVisible] = useState(false)
  const uploadSuccessTimer = useRef(null)

  const showUploadSuccess = () => {
    if (uploadSuccessTimer.current) clearTimeout(uploadSuccessTimer.current)
    setUploadSuccessVisible(true)
    uploadSuccessTimer.current = setTimeout(() => {
      setUploadSuccessVisible(false)
      uploadSuccessTimer.current = null
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (uploadSuccessTimer.current) clearTimeout(uploadSuccessTimer.current)
    }
  }, [])

  useEffect(() => {
    loadTracks()
  }, [loadTracks])

  // Keyboard shortcut: Space to toggle play
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [togglePlay])

  const handlePlayTrack = useCallback(async (track) => {
    setCurrentTrack(track)
    // Track recently played
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id)
      return [track, ...filtered].slice(0, 10)
    })
    if (!track.src) {
      const all = await getAllTracks()
      const fresh = all.find((t) => t.id === track.id)
      if (fresh?.src) {
        await playTrack(fresh.src)
      }
    } else {
      await playTrack(track.src)
    }
  }, [playTrack])

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main content */}
      <main
        className={`transition-all duration-250 ease-in-out pt-4 pb-32 ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'
        }`}
      >
        <div className="max-w-player mx-auto px-5">
          {error && (
            <div className="bg-panel border border-border p-6 text-text-secondary text-center mb-6">
              {error}
            </div>
          )}

          <Routes>
            <Route
              path="/"
              element={
                <Home
                  tracks={tracks}
                  currentTrack={currentTrack}
                  onPlay={handlePlayTrack}
                  onDelete={removeTrack}
                  onToggleFavourite={toggleFavourite}
                  recentlyPlayed={recentlyPlayed}
                />
              }
            />
            <Route
              path="/search"
              element={
                <Search
                  tracks={tracks}
                  currentTrack={currentTrack}
                  onPlay={handlePlayTrack}
                  onDelete={removeTrack}
                  onToggleFavourite={toggleFavourite}
                />
              }
            />
            <Route
              path="/playlists"
              element={
                <Playlists
                  tracks={tracks}
                  currentTrack={currentTrack}
                  onPlay={handlePlayTrack}
                />
              }
            />
            <Route
              path="/playlists/:id"
              element={
                <PlaylistDetail
                  tracks={tracks}
                  currentTrack={currentTrack}
                  onPlay={handlePlayTrack}
                />
              }
            />
            <Route
              path="/favourites"
              element={
                <Favourites
                  tracks={tracks}
                  currentTrack={currentTrack}
                  onPlay={handlePlayTrack}
                  onDelete={removeTrack}
                  onToggleFavourite={toggleFavourite}
                />
              }
            />
            <Route
              path="/upload"
              element={
                <Upload
                  onUploaded={async () => {
                    await loadTracks()
                    showUploadSuccess()
                  }}
                />
              }
            />
            <Route path="/settings" element={<Settings />} />
          </Routes>

          {/* Upload success toast */}
          <UploadSuccess visible={uploadSuccessVisible} />
        </div>
      </main>

      {/* Persistent now-playing bar */}
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
