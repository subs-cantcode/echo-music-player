import { useState, useMemo } from 'react'
import TrackRow from '../components/TrackRow.jsx'

export default function Search({ tracks, currentTrack, onPlay, onDelete, onToggleFavourite }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return tracks
    const q = query.toLowerCase()
    return tracks.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q))
    )
  }, [tracks, query])

  return (
    <div className="page-enter">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-fg mb-3">Search</h1>
        <div className="relative">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint text-sm" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library..."
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-faint"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg-muted transition-colors"
            >
              <i className="bi bi-x-circle text-sm" />
            </button>
          )}
        </div>
      </div>

      <section className="bg-surface rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-fg">
            {query.trim() ? 'Results' : 'All Tracks'}
          </h2>
          <span className="text-fg-faint text-xs">
            {filtered.length} track{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-fg-muted text-sm text-center py-8">
            {query.trim() ? 'No tracks match your search.' : 'No tracks yet.'}
          </p>
        ) : (
          <div className="group">
            {filtered.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isActive={currentTrack?.id === track.id}
                onPlay={onPlay}
                onDelete={onDelete}
                onToggleFavourite={onToggleFavourite}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
