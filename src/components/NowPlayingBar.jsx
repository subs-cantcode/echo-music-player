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
}) {
  const [volumeOpen, setVolumeOpen] = useState(false)
  const [volumeDragging, setVolumeDragging] = useState(false)
  const volumeLeaveTimer = useRef(null)
  const volumeBarRef = useRef(null)
  const volumeDraggingRef = useRef(false)
  const volumeContainerRef = useRef(null)

  const handleVolumeEnter = useCallback(() => {
    if (volumeLeaveTimer.current) clearTimeout(volumeLeaveTimer.current)
    setVolumeOpen(true)
  }, [])

  const handleVolumeLeave = useCallback(() => {
    if (volumeDraggingRef.current) return
    volumeLeaveTimer.current = setTimeout(() => setVolumeOpen(false), 250)
  }, [])

  const handleVolumeIconClick = useCallback(() => {
    setVolumeOpen((prev) => !prev)
  }, [])

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
      if (volumeLeaveTimer.current) clearTimeout(volumeLeaveTimer.current)
    }
  }, [])

  const effectiveVolume = isMuted ? 0 : volume
  const volumeIcon = effectiveVolume === 0
    ? 'bi-volume-mute'
    : effectiveVolume < 0.5
      ? 'bi-volume-down'
      : 'bi-volume-up'

  return (
    <div
      className={`fixed bottom-4 z-40 transition-all duration-250 ease-in-out ${
        sidebarCollapsed ? 'left-[88px]' : 'left-[256px]'
      } right-4`}
    >
      <div className="max-w-player mx-auto bg-panel border border-border rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Track info */}
          <div className="min-w-0 flex-shrink-0 w-[140px]">
            {track ? (
              <>
                <div className="font-serif text-sm font-medium text-text-primary truncate">
                  {track.title}
                </div>
                <div className="text-text-secondary text-xs truncate">
                  {track.artist || ''}
                </div>
              </>
            ) : (
              <div className="text-text-secondary text-sm">No track selected</div>
            )}
          </div>

          {/* Controls + progress */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onSkipBack}
                className="player-btn w-9 h-9 text-text-secondary hover:text-text-primary"
                aria-label="Rewind 10 seconds"
              >
                <i className="bi bi-skip-backward-fill text-base" />
              </button>
              <button
                onClick={onPlayPause}
                className="player-btn w-10 h-10 bg-text-primary text-background hover:bg-text-primary/80"
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
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2.5 w-full">
              <span className="text-text-secondary text-[10px] w-8 text-right tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div
                className="flex-1 h-1 bg-border rounded-full cursor-pointer group relative"
                onClick={(e) => {
                  if (!duration || !onSeek) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pos = (e.clientX - rect.left) / rect.width
                  onSeek(pos * duration)
                }}
              >
                <div
                  className="h-full bg-accent rounded-full transition-[width] duration-150 group-hover:h-1.5 group-hover:-mt-0.5"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-text-secondary text-[10px] w-8 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: shuffle + volume */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* Shuffle */}
            <button
              className="player-btn w-9 h-9 text-text-secondary hover:text-text-primary"
              aria-label="Shuffle"
            >
              <i className="bi bi-shuffle text-lg" />
            </button>

            {/* Volume */}
            <div
              ref={volumeContainerRef}
              className="flex items-center"
              onMouseEnter={handleVolumeEnter}
              onMouseLeave={handleVolumeLeave}
            >
              <button
                onClick={handleVolumeIconClick}
                className="player-btn w-9 h-9 text-text-secondary hover:text-text-primary"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <i className={`bi ${volumeIcon} text-xl`} />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                  volumeOpen ? 'w-[90px] opacity-100' : 'w-0 opacity-0'
                }`}
              >
                <div
                  ref={volumeBarRef}
                  className="relative h-1 bg-border rounded-full cursor-pointer group mx-2"
                  style={{ paddingTop: 10, paddingBottom: 10, marginTop: -10, marginBottom: -10 }}
                  onMouseDown={handleVolumeBarMouseDown}
                >
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full transition-[width] duration-100 ease-out group-hover:h-1.5"
                    style={{ width: `${effectiveVolume * 100}%` }}
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-accent border-2 border-panel shadow-sm transition-all duration-150 ease-out pointer-events-none ${
                      volumeDragging ? 'scale-110 shadow-md' : 'group-hover:scale-110'
                    }`}
                    style={{ left: `${effectiveVolume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
