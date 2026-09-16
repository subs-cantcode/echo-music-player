import TrackRow from '../components/TrackRow.jsx'

export default function Favourites({ tracks, currentTrack, onPlay, onDelete, onToggleFavourite }) {
  const favourited = tracks.filter((t) => t.is_favorite)

  return (
    <div className="bg-panel p-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold">Favourites</h2>
        <span className="text-text-secondary text-sm">
          {favourited.length} {favourited.length === 1 ? 'track' : 'tracks'}
        </span>
      </div>

      {favourited.length === 0 ? (
        <p className="text-text-secondary text-center py-8">
          No favourites yet. Heart a track to add it here.
        </p>
      ) : (
        <div className="flex flex-col">
          {favourited.map((track) => (              <TrackRow
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
    </div>
  )
}
