import TrackRow from '../components/TrackRow.jsx'

export default function Favourites({ tracks, currentTrack, onPlay, onDelete, onToggleFavourite }) {
  const favourited = tracks.filter((t) => t.isFavourite)

  return (
    <div className="page-enter">
      <div className="bg-surface rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-medium text-fg">Favourites</h1>
          <span className="text-fg-faint text-xs">{favourited.length} track{favourited.length !== 1 ? 's' : ''}</span>
        </div>

        {favourited.length === 0 ? (
          <div className="text-center py-10">
            <i className="bi bi-heart text-3xl text-fg-faint mb-3 block" />
            <p className="text-sm text-fg-muted">No favourites yet.</p>
            <p className="text-xs text-fg-faint mt-1">Heart a track to add it here.</p>
          </div>
        ) : (
          <div className="group">
            {favourited.map((track) => (
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
      </div>
    </div>
  )
}
