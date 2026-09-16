function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export { formatTime }

export default function NowPlaying({ track, progress, currentTime, totalTime, onSeek }) {
  return (
    <section className="bg-panel p-8">
      <div className="mb-2">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-primary opacity-40"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <h1 className="font-serif text-3xl font-medium text-text-primary leading-tight mb-1">
        {track ? track.title : 'Select a track'}
      </h1>
      <p className="text-text-secondary text-base mb-6">
        {track?.artist || ''}
      </p>
      <div
        className="h-1 bg-border rounded-full cursor-pointer"
        onClick={(e) => {
          if (!totalTime || !onSeek) return
          const rect = e.currentTarget.getBoundingClientRect()
          const pos = (e.clientX - rect.left) / rect.width
          onSeek(pos * totalTime)
        }}
      >
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-text-secondary text-xs">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(totalTime)}</span>
      </div>
    </section>
  )
}
