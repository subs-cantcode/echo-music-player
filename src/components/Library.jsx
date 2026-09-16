import TrackRow from './TrackRow.jsx'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default function Library({ tracks, currentTrack, onPlay, onDelete, loading }) {
  const countLabel = `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'}`

  if (loading) {
    return (
      <section className="bg-panel p-6">
        <h2 className="text-base font-semibold mb-4">Library</h2>
        <p className="text-text-secondary">Loading…</p>
      </section>
    )
  }

  return (
    <section className="bg-panel p-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold">Library</h2>
        <span className="text-text-secondary text-sm">{countLabel}</span>
      </div>

      {tracks.length === 0 ? (
        <p className="text-text-secondary text-center py-8">
          No tracks yet. Upload some music to get started.
        </p>
      ) : (
        <div className="flex flex-col">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isActive={currentTrack?.id === track.id}
              onPlay={onPlay}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
