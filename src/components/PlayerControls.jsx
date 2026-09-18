export default function PlayerControls({
  isPlaying,
  loopMode = 'off',
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onToggleLoop,
}) {
  const loopIcon = loopMode === 'track' ? 'bi-repeat-1' : 'bi-repeat'

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={onToggleLoop}
        className={`player-btn w-9 h-9 ${loopMode !== 'off' ? 'text-accent' : ''}`}
        title={`Loop: ${loopMode}`}
        aria-label="Loop"
        aria-pressed={loopMode !== 'off'}
      >
        <i className={`bi ${loopIcon} text-base`} />
      </button>

      <button
        onClick={onSkipBack}
        className="player-btn w-9 h-9"
        aria-label="Rewind 10 seconds"
      >
        <i className="bi bi-skip-backward-fill text-base" />
      </button>

      <button
        onClick={onPlayPause}
        className="player-btn w-11 h-11 bg-fg text-bg hover:bg-fg/85"
        style={{ transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <i className="bi bi-pause-fill text-lg" />
        ) : (
          <i className="bi bi-play-fill text-lg ml-0.5" />
        )}
      </button>

      <button
        onClick={onSkipForward}
        className="player-btn w-9 h-9"
        aria-label="Forward 10 seconds"
      >
        <i className="bi bi-skip-forward-fill text-base" />
      </button>
    </div>
  )
}
