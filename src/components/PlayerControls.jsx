export default function PlayerControls({ isPlaying, onPlayPause, onSkipBack, onSkipForward }) {
  return (
    <section className="flex justify-center items-center gap-4">
      <button
        onClick={onSkipBack}
        className="text-text-secondary hover:text-text-primary transition-colors p-2"
        aria-label="Rewind 10 seconds"
      >
        <i className="bi bi-skip-backward-fill text-xl" />
      </button>
      <button
        onClick={onPlayPause}
        disabled={false}
        className="w-14 h-14 rounded-full bg-text-primary text-background flex items-center justify-center hover:bg-text-primary/80 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <i className="bi bi-pause-fill text-xl" />
        ) : (
          <i className="bi bi-play-fill text-xl" />
        )}
      </button>
      <button
        onClick={onSkipForward}
        className="text-text-secondary hover:text-text-primary transition-colors p-2"
        aria-label="Forward 10 seconds"
      >
        <i className="bi bi-skip-forward-fill text-xl" />
      </button>
    </section>
  )
}
