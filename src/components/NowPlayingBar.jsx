import { useState, useRef, useCallback } from 'react'
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
  const [volumeHover, setVolumeHover] = useState(false)
  const volumeBarRef = useRef(null)

  const handleVolumeClick = useCallback((e) => {
    if (!volumeBarRef.current || !onSetVolume) return
    const rect = volumeBarRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    onSetVolume(pos)
  }, [onSetVolume])

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
      <div className="max-w-player mx-auto bg-panel border border-border rounded-2xl px-7 py-5 shadow-sm">
        <div className="flex items-center gap-6">
          {/* Track info */}
          <div className="min-w-0 flex-shrink-0 w-[160px]">
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
          <div className="flex-1 flex flex-col items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-5">
              <button
                onClick={onSkipBack}
                className="text-text-secondary hover:text-text-primary transition-colors p-1"
                aria-label="Rewind 10 seconds"
              >
                <i className="bi bi-skip-backward-fill text-base" />
              </button>
              <button
                onClick={onPlayPause}
                className="w-9 h-9 rounded-full bg-text-primary text-background flex items-center justify-center hover:bg-text-primary/80 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <i className="bi bi-pause-fill text-sm" />
                ) : (
                  <i className="bi bi-play-fill text-sm" />
                )}
              </button>
              <button
                onClick={onSkipForward}
                className="text-text-secondary hover:text-text-primary transition-colors p-1"
                aria-label="Forward 10 seconds"
              >
                <i className="bi bi-skip-forward-fill text-base" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 w-full">
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

          {/* Volume slider */}
          <div
            className="flex-shrink-0 flex items-center gap-2"
            onMouseEnter={() => setVolumeHover(true)}
            onMouseLeave={() => setVolumeHover(false)}
          >
            <button
              onClick={onToggleMute}
              className="text-text-secondary hover:text-text-primary transition-colors p-1"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <i className={`bi ${volumeIcon} text-base`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                volumeHover ? 'w-[80px] opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <div
                ref={volumeBarRef}
                className="h-1 bg-border rounded-full cursor-pointer relative group"
                onClick={handleVolumeClick}
              >
                <div
                  className="h-full bg-accent rounded-full transition-[width] duration-100 group-hover:h-1.5 group-hover:-mt-0.5"
                  style={{ width: `${effectiveVolume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
