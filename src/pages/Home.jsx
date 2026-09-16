import TrackRow from '../components/TrackRow.jsx'

export default function Home({ tracks, currentTrack, onPlay, onDelete, onToggleFavourite, recentlyPlayed }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Recently played */}
      {recentlyPlayed.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Recently played</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlyPlayed.map((track) => (
              <button
                key={track.id}
                onClick={() => onPlay(track)}
                className={`flex-shrink-0 w-[140px] bg-panel p-3 text-left transition-colors hover:bg-border/50 ${
                  currentTrack?.id === track.id ? 'ring-1 ring-accent' : ''
                }`}
              >
                <div className="font-medium text-text-primary text-sm truncate mb-1">
                  {track.title}
                </div>
                <div className="text-text-secondary text-xs truncate">
                  {track.artist || 'Unknown'}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Full library */}
      <section className="bg-panel p-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold">Your Library</h2>
          <span className="text-text-secondary text-sm">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>

        {tracks.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            No tracks yet. Upload some music to get started.
          </p>
        ) : (
          <div className="flex flex-col">
            {tracks.map((track) => (                <TrackRow
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
