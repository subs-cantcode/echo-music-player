import { useState, useEffect, useRef } from 'react'
import NowPlaying from './components/NowPlaying.jsx'
import PlayerControls from './components/PlayerControls.jsx'
import UploadZone from './components/UploadZone.jsx'
import Library from './components/Library.jsx'
import { useAudioPlayer } from './hooks/useAudioPlayer.js'
import { useLibrary } from './hooks/useLibrary.js'
import { getAllTracks } from './lib/api.js'

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

export default function App() {
  const { tracks, loading, error, loadTracks, addTracks, removeTrack } = useLibrary()
  const {
    isPlaying,
    currentTime,
    duration,
    progress,
    playTrack,
    togglePlay,
    pause,
    skip,
    seek,
  } = useAudioPlayer()
  const [currentTrack, setCurrentTrack] = useState(null)
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

  const handlePlayTrack = async (track) => {
    setCurrentTrack(track)
    if (!track.src) {
      // Signed URLs expire — fetch a fresh one before playing.
      const all = await getAllTracks()
      const fresh = all.find((t) => t.id === track.id)
      if (fresh?.src) {
        await playTrack(fresh.src)
      }
    } else {
      await playTrack(track.src)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-player mx-auto px-5 py-10 flex flex-col gap-7">
        {error && (
          <div className="bg-panel border border-border p-6 text-text-secondary text-center">
            {error}
          </div>
        )}

        <NowPlaying
          track={currentTrack}
          progress={progress}
          currentTime={currentTime}
          totalTime={duration}
          onSeek={seek}
        />

        <PlayerControls
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onSkipBack={() => skip(-10)}
          onSkipForward={() => skip(10)}
        />

        <UploadZone
          onUpload={async (files) => {
            await addTracks(files)
            showUploadSuccess()
          }}
        />

        <UploadSuccess visible={uploadSuccessVisible} />

        <Library
          tracks={tracks}
          currentTrack={currentTrack}
          onPlay={handlePlayTrack}
          onDelete={removeTrack}
          loading={loading}
        />
      </div>
    </div>
  )
}
