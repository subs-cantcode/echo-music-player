export const PlaylistCard = ({ playlist, tracks, onOpen, onPlay, onShuffle }) => {
  const trackIds = playlist.trackIds || []
  const count = trackIds.length

  // Tracks carry no artwork yet, so this falls back to the music-note placeholder.
  const coverImages = trackIds
    .slice(0, 4)
    .map((trackId) => tracks.find((t) => t.id === trackId)?.coverImage)
    .filter(Boolean)

  const open = () => onOpen?.(playlist.id)

  return (
    <div
      className="playlist-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && open()}
    >
      <div className="playlist-card-cover">
        {coverImages.length > 0 ? (
          <div className="cover-grid">
            {coverImages.map((url, idx) => (
              <img key={idx} src={url} alt="" />
            ))}
          </div>
        ) : (
          <div className="cover-placeholder">
            <i className="bi bi-music-note-beamed" />
          </div>
        )}
      </div>

      <div className="playlist-card-info">
        <h3 className="playlist-card-name" title={playlist.name}>
          {playlist.name}
        </h3>
        <p className="playlist-card-meta">
          {count} song{count !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="playlist-card-actions">
        <button
          onClick={(e) => { e.stopPropagation(); onPlay?.(playlist.id) }}
          className="player-btn w-7 h-7"
          title="Play"
          aria-label={`Play ${playlist.name}`}
        >
          <i className="bi bi-play-fill text-sm" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onShuffle?.(playlist.id) }}
          className="player-btn w-7 h-7"
          title="Shuffle"
          aria-label={`Shuffle ${playlist.name}`}
        >
          <i className="bi bi-shuffle text-xs" />
        </button>
      </div>
    </div>
  )
}

export default PlaylistCard
