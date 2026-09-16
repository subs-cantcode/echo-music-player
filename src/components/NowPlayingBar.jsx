import { formatTime } from './NowPlaying.jsx'

export default function NowPlayingBar({
  track,
  isPlaying,
  currentTime,
  duration,
  progress,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-panel border-t border-border z-40 h-[88px]">
      <div className="flex items-center h-full px-5 gap-6">
        {/* Track info */}
        <div className="min-w-0 flex-shrink-0 w-[200px]">
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
        <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
          <div className="flex items-center gap-3">
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
              className="flex-1 h-1 bg-border rounded-full cursor-pointer group"
              onClick={(e) => {
                if (!duration || !onSeek) return
                const rect = e.currentTarget.getBoundingClientRect()
                const pos = (e.clientX - rect.left) / rect.width
                onSeek(pos * duration)
              }}
            >
              <div
                className="h-full bg-accent rounded-full transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-text-secondary text-[10px] w-8 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume placeholder */}
        <div className="flex-shrink-0 w-[200px] flex justify-end">
          <button
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
            aria-label="Volume"
          >
            <i className="bi bi-volume-up text-base" />
          </button>
        </div>
      </div>
    </div>
  )
}
