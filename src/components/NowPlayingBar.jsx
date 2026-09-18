import { useState, useRef, useCallback, useEffect } from 'react'
import { formatTime } from './NowPlaying.jsx'

export default function NowPlayingBar({
  track, isPlaying, currentTime, duration, progress, volume, isMuted,
  sidebarCollapsed, onPlayPause, onSkipBack, onSkipForward, onSeek,
  onSetVolume, onToggleMute, onToggleFavourite,
}) {
  const [volDrag, setVolDrag] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState(0)
  const [heartKey, setHeartKey] = useState(0)
  const volRef = useRef(null)
  const volDragRef = useRef(false)

  const handleVolMouseDown = useCallback((e) => {
    if (!volRef.current || !onSetVolume) return
    e.preventDefault()
    volDragRef.current = true
    setVolDrag(true)
    const rect = volRef.current.getBoundingClientRect()
    const pos = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    onSetVolume(pos)

    const onMove = (ev) => {
      const r = volRef.current?.getBoundingClientRect()
      if (!r) return
      onSetVolume(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)))
    }
    const onUp = () => {
      volDragRef.current = false
      setVolDrag(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onSetVolume])

  useEffect(() => () => { volDragRef.current = false }, [])

  const effectiveVol = isMuted ? 0 : volume
  const volIcon = effectiveVol === 0 ? 'bi-volume-mute' : effectiveVol < 0.5 ? 'bi-volume-down' : 'bi-volume-up'
  const repeatIcon = repeatMode === 2 ? 'bi-repeat-1' : 'bi-repeat'
  const isFav = track?.isFavourite ?? false

  return (
    <div
      className={`fixed bottom-3 z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        sidebarCollapsed ? 'left-[80px]' : 'left-[232px]'
      } right-3`}
    >
      <div className="max-w-[680px] mx-auto bg-surface border border-border-subtle rounded-2xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Track info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0 w-[160px]">
            <div className="w-8 h-8 rounded-lg bg-border flex items-center justify-center flex-shrink-0">
              <i className="bi bi-music-note-beamed text-fg-faint text-xs" />
            </div>
            <div className="min-w-0">
              {track ? (
                <>
                  <div className="text-sm font-medium text-fg truncate">{track.title}</div>
                  <div className="text-fg-muted text-[11px] truncate">{track.artist || ''}</div>
                </>
              ) : (
                <div className="text-fg-faint text-sm">No track</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex items-center justify-center gap-1">
            <button
              onClick={() => { onToggleFavourite(); setHeartKey((k) => k + 1) }}
              className={`player-btn w-7 h-7 ${isFav ? 'text-accent' : ''}`}
              aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            >
              <i key={heartKey} className={`text-sm heart-pop ${isFav ? 'bi-heart-fill' : 'bi-heart'}`} />
            </button>

            <button
              onClick={() => setShuffled((s) => !s)}
              className={`player-btn w-7 h-7 ${shuffled ? 'text-accent' : ''}`}
              aria-label="Shuffle"
            >
              <i className="bi bi-shuffle text-xs" />
            </button>

            <button onClick={onSkipBack} className="player-btn w-8 h-8" aria-label="Rewind 10 seconds">
              <i className="bi bi-skip-backward-fill text-sm" />
            </button>

            <button
              onClick={onPlayPause}
              className="player-btn w-9 h-9 bg-fg text-bg hover:bg-fg/85"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <i className="bi bi-pause-fill text-sm" /> : <i className="bi bi-play-fill text-sm ml-0.5" />}
            </button>

            <button onClick={onSkipForward} className="player-btn w-8 h-8" aria-label="Forward 10 seconds">
              <i className="bi bi-skip-forward-fill text-sm" />
            </button>

            <button
              onClick={() => setRepeatMode((r) => (r + 1) % 3)}
              className={`player-btn w-7 h-7 ${repeatMode > 0 ? 'text-accent' : ''}`}
              aria-label="Repeat"
            >
              <i className={`bi ${repeatIcon} text-xs`} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onToggleMute} className="player-btn w-7 h-7" aria-label={isMuted ? 'Unmute' : 'Mute'}>
              <i className={`bi ${volIcon} text-sm`} />
            </button>
            <div
              ref={volRef}
              className="relative h-4 w-[80px] flex items-center cursor-pointer group"
              onMouseDown={handleVolMouseDown}
            >
              <div className="bar-track w-full">
                <div className="bar-fill" style={{ width: `${effectiveVol * 100}%` }} />
                <div
                  className={`bar-thumb ${volDrag ? 'scale-110 !opacity-100' : ''}`}
                  style={{ left: `${effectiveVol * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2.5 mt-1.5 px-0.5">
          <span className="text-fg-faint text-[10px] w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div className="flex-1 group cursor-pointer" onClick={(e) => {
            if (!duration || !onSeek) return
            const rect = e.currentTarget.getBoundingClientRect()
            onSeek(((e.clientX - rect.left) / rect.width) * duration)
          }}>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${progress}%` }} />
              <div className="bar-thumb" style={{ left: `${progress}%` }} />
            </div>
          </div>
          <span className="text-fg-faint text-[10px] w-8 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
