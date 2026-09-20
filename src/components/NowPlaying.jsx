export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default function NowPlaying({ track, progress, currentTime, totalTime, onSeek }) {
  return (
    <section className="bg-surface p-6">
      <h2 className="text-lg font-medium text-fg mb-4">Now Playing</h2>
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {track?.artwork ? (
            <img src={track.artwork} alt="" className="w-full h-full object-cover" />
          ) : (
            <i className="bi bi-music-note-beamed text-fg-muted text-xl" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-fg truncate">{track?.title || 'No track'}</div>
          <div className="text-fg-muted text-sm truncate">{track?.artist || ''}</div>
        </div>
      </div>
      <div
        className="bar-track mt-5"
        onClick={(e) => {
          if (!totalTime || !onSeek) return
          const rect = e.currentTarget.getBoundingClientRect()
          const pos = (e.clientX - rect.left) / rect.width
          onSeek(pos * totalTime)
        }}
      >
        <div className="bar-fill" style={{ width: `${progress}%` }} />
        <div className="bar-thumb" style={{ left: `${progress}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-fg-faint text-xs tabular-nums">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(totalTime)}</span>
      </div>
    </section>
  )
}
