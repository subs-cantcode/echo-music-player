import { formatTime } from './NowPlaying.jsx'

export default function TrackRow({
  track, isActive, onPlay, onDelete, onToggleFavourite,
  deleteIcon = 'bi-trash3', deleteLabel = 'Delete track',
}) {
  return (
    <div
      className={`track-row ${isActive ? 'active' : ''}`}
      onClick={() => onPlay(track)}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{track.title}</div>
        <div className="text-fg-muted text-xs truncate">
          {track.artist
            ? `${track.artist}${track.duration ? ' \u00b7 ' + formatTime(track.duration) : ''}`
            : track.duration
              ? formatTime(track.duration)
              : ''}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavourite?.(track.id) }}
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${
          track.isFavourite
            ? 'text-accent heart-pop'
            : 'text-fg-faint hover:text-accent opacity-0 group-hover:opacity-100'
        }`}
        aria-label={track.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      >
        <i className={`bi ${track.isFavourite ? 'bi-heart-fill' : 'bi-heart'}`} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete?.(track.id) }}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-fg-faint hover:text-fg text-xs opacity-0 group-hover:opacity-100 transition-all duration-200"
        aria-label={deleteLabel}
      >
        <i className={`bi ${deleteIcon}`} />
      </button>
    </div>
  )
}
