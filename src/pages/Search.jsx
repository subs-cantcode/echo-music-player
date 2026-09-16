import { useState, useMemo } from 'react'
import TrackRow from '../components/TrackRow.jsx'

export default function Search({ tracks, currentTrack, onPlay, onDelete }) {
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
    <div className="flex flex-col gap-6">
      {/* Search input */}
      <div className="bg-panel p-4">
        <div className="relative">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library..."
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      <section className="bg-panel p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold">
            {query.trim() ? 'Results' : 'All Tracks'}
          </h2>
          <span className="text-text-secondary text-sm">
            {filtered.length} {filtered.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            {query.trim() ? 'No tracks match your search.' : 'No tracks yet.'}
          </p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((track) => (
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
    </div>
  )
}
