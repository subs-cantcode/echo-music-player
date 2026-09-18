export const PlaylistRow = ({ playlist, tracks, onOpen, onPlay, onDelete }) => {
  const trackIds = playlist.trackIds || []
  const firstTrack = tracks.find((t) => t.id === trackIds[0])
  const coverUrl = firstTrack?.coverImage
  const count = trackIds.length

  const open = () => onOpen?.(playlist.id)

  return (
    <div
      className="playlist-row"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && open()}
    >
      <div className="playlist-row-cover">
        {coverUrl ? (
          <img src={coverUrl} alt="" />
        ) : (
          <div className="cover-placeholder-sm">
            <i className="bi bi-music-note-beamed" />
          </div>
        )}
      </div>

      <div className="playlist-row-info">
        <h4 className="playlist-row-name" title={playlist.name}>{playlist.name}</h4>
        <p className="playlist-row-meta">
          {count} song{count !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="playlist-row-actions">
        <button
          onClick={(e) => { e.stopPropagation(); onPlay?.(playlist.id) }}
          className="player-btn w-7 h-7"
          title="Play"
          aria-label={`Play ${playlist.name}`}
        >
          <i className="bi bi-play-fill text-sm" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(e, playlist.id) }}
          className="player-btn w-7 h-7"
          title="Delete"
          aria-label={`Delete ${playlist.name}`}
        >
          <i className="bi bi-trash3 text-xs" />
        </button>
      </div>
    </div>
  )
}

export default PlaylistRow
