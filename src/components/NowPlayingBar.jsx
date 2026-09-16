import { useState, useRef, useCallback, useEffect } from 'react'
import { formatTime } from './NowPlaying.jsx'

export default function NowPlayingBar({
  track,
  isPlaying,
  currentTime,
  duration,
  progress,
  volume,
  isMuted,
  sidebarCollapsed,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleFavourite,
}) {
  const [volumeDragging, setVolumeDragging] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const [shuffleKey, setShuffleKey] = useState(0)
  const [repeatMode, setRepeatMode] = useState(0)
  const [repeatKey, setRepeatKey] = useState(0)
  const [heartKey, setHeartKey] = useState(0)
  const volumeBarRef = useRef(null)
  const volumeDraggingRef = useRef(false)

  const handleVolumeBarMouseDown = useCallback((e) => {
    if (!volumeBarRef.current || !onSetVolume) return
    e.preventDefault()
    volumeDraggingRef.current = true
    setVolumeDragging(true)
    const rect = volumeBarRef.current.getBoundingClientRect()
    const pos = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    onSetVolume(pos)

    const handleMouseMove = (ev) => {
      const r = volumeBarRef.current?.getBoundingClientRect()
      if (!r) return
      const p = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width))
      onSetVolume(p)
    }

    const handleMouseUp = () => {
      volumeDraggingRef.current = false
      setVolumeDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [onSetVolume])

  useEffect(() => {
    return () => {
      volumeDraggingRef.current = false
    }
  }, [])

  const effectiveVolume = isMuted ? 0 : volume
  const volumeIcon = effectiveVolume === 0
    ? 'bi-volume-mute'
    : effectiveVolume < 0.5
      ? 'bi-volume-down'
      : 'bi-volume-up'

  const repeatIcon = repeatMode === 2 ? 'bi-repeat-1' : 'bi-repeat'
  const isFavourite = track?.is_favorite ?? false

  return (
    <div
      className={`fixed bottom-4 z-40 transition-all duration-250 ease-in-out ${
        sidebarCollapsed ? 'left-[88px]' : 'left-[256px]'
      } right-4`}
    >
      <div className="max-w-player mx-auto bg-panel border border-border rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">

          {/* ── Left: Artwork + Track info ── */}
          <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-border/60 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {track ? (
                <i className="bi bi-music-note-beamed text-text-secondary text-sm" />
              ) : (
                <i className="bi bi-disc text-text-secondary text-sm" />
              )}
            </div>
            <div className="min-w-0 w-[120px]">
              {track ? (
                <>
                  <div className="font-serif text-sm font-medium text-text-primary truncate">
                    {track.title}
                  </div>
                  <div className="text-text-secondary text-[11px] truncate">
                    {track.artist || ''}
                  </div>
                </>
              ) : (
                <div className="text-text-secondary text-sm">No track selected</div>
              )}
            </div>
          </div>

          {/* ── Center: Like · Shuffle · Prev · Play · Next · Repeat ── */}
          <div className="flex-1 flex items-center justify-center gap-1.5">
            <button
              onClick={() => {
                onToggleFavourite()
                setHeartKey((k) => k + 1)
              }}
              className={`player-btn w-8 h-8 ${isFavourite ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
              aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <i key={heartKey} className={`text-base heart-pop ${isFavourite ? 'bi-heart-fill' : 'bi-heart'}`} />
            </button>

            <button
              onClick={() => {
                setShuffled((s) => !s)
                setShuffleKey((k) => k + 1)
              }}
              className={`player-btn w-8 h-8 ${shuffled ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
              aria-label="Shuffle"
            >
              <i key={shuffleKey} className="bi bi-shuffle text-sm icon-spin" />
            </button>

            <button
              onClick={onSkipBack}
              className="player-btn w-9 h-9 text-text-secondary hover:text-text-primary"
              aria-label="Rewind 10 seconds"
            >
              <i className="bi bi-skip-backward-fill text-base" />
            </button>

            <button
              onClick={onPlayPause}
              className="player-btn player-btn-play w-10 h-10 bg-text-primary text-background hover:bg-text-primary/80"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <i className="bi bi-pause-fill text-base" />
              ) : (
                <i className="bi bi-play-fill text-base ml-0.5" />
              )}
            </button>

            <button
              onClick={onSkipForward}
              className="player-btn w-9 h-9 text-text-secondary hover:text-text-primary"
              aria-label="Forward 10 seconds"
            >
              <i className="bi bi-skip-forward-fill text-base" />
            </button>

            <button
              onClick={() => {
                setRepeatMode((r) => (r + 1) % 3)
                setRepeatKey((k) => k + 1)
              }}
              className={`player-btn w-8 h-8 ${repeatMode > 0 ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
              aria-label="Repeat"
            >
              <i key={repeatKey} className={`bi ${repeatIcon} text-sm icon-spin`} />
            </button>
          </div>

          {/* ── Right: Volume icon + slider (always visible) ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleMute}
              className="player-btn w-9 h-9 text-text-secondary hover:text-text-primary relative z-10"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <i className={`bi ${volumeIcon} text-xl`} />
            </button>
            <div
              ref={volumeBarRef}
              className="relative h-5 w-[90px] flex items-center cursor-pointer group"
              onMouseDown={handleVolumeBarMouseDown}
            >
              <div className="w-full h-1 bar-track rounded-full relative overflow-visible">
                <div
                  className="absolute left-0 top-0 h-full bg-accent rounded-full bar-fill"
                  style={{ width: `${effectiveVolume * 100}%` }}
                />
                <div
                  className={`absolute top-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-panel shadow-sm pointer-events-none bar-thumb opacity-0 ${
                    volumeDragging ? 'dragging' : ''
                  }`}
                  style={{ left: `${effectiveVolume * 100}%`, transform: `translate(-50%, -50%) scale(${volumeDragging ? 1.15 : 0.8})` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Progress bar (below controls) ── */}
        <div className="flex items-center gap-2.5 mt-2.5 px-1">
          <span className="text-text-secondary text-[10px] w-8 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-1 bar-track bg-border rounded-full cursor-pointer group relative overflow-visible"
            onClick={(e) => {
              if (!duration || !onSeek) return
              const rect = e.currentTarget.getBoundingClientRect()
              const pos = (e.clientX - rect.left) / rect.width
              onSeek(pos * duration)
            }}
          >
            <div
              className="h-full bg-accent rounded-full bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-text-secondary text-[10px] w-8 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
