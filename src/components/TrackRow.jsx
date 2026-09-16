import { formatTime } from '../components/NowPlaying.jsx'

export default function TrackRow({ track, isActive, onPlay, onDelete }) {
  return (
    <div
      className={`flex justify-between items-center py-3 border-t border-border cursor-pointer ${isActive ? 'text-accent' : ''}`}
      onClick={() => onPlay(track)}
    >
      <div className="min-w-0 flex-1 mr-3">
        <div className="font-medium text-text-primary truncate">
          {track.title}
        </div>
        <div className="text-text-secondary text-sm truncate">
          {track.artist
            ? `${track.artist} · ${track.duration_seconds ? formatTime(track.duration_seconds) : track.sizeLabel || ''}`
            : track.duration_seconds
              ? formatTime(track.duration_seconds)
              : track.sizeLabel || ''}
        </div>
      </div>
      <span className="text-text-secondary text-sm w-10 text-right flex-shrink-0">
        {track.duration_seconds ? formatTime(track.duration_seconds) : ''}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(track.id)
        }}
        className="text-text-secondary hover:text-text-primary flex-shrink-0 ml-3 px-2 text-sm transition-colors"
        aria-label="Delete track"
      >
        <i className="bi bi-trash3" />
      </button>
    </div>
  )
}
