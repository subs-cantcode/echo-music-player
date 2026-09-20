import { useTextOverflow } from '../hooks/useTextOverflow.js';
import { formatTime } from './NowPlaying.jsx';
import TrackActionsMenu from './TrackActionsMenu.jsx';

export default function TrackRow({
  track, isActive, onPlay, onDelete, onToggleFavourite, onTogglePin, pinDisabled = false,
  deleteIcon = 'bi-trash3', deleteLabel = 'Delete track',
}) {
  const { elementRef: titleRef, isOverflowing: titleOverflows } = useTextOverflow(track.title);
  const { elementRef: artistRef, isOverflowing: artistOverflows } = useTextOverflow(track.artist);

  const artistLine = track.artist
    ? `${track.artist}${track.duration ? ' \u00b7 ' + formatTime(track.duration) : ''}`
    : track.duration
      ? formatTime(track.duration)
      : ''

  return (
    <div
      className={`track-row ${isActive ? 'active' : ''}`}
      onClick={() => onPlay(track)}
    >
      <div className="min-w-0 flex-1">
        <div ref={titleRef} className={`marquee-container ${titleOverflows ? 'marquee-running' : ''}`}>
          <div className={`text-sm font-medium marquee-text ${titleOverflows ? 'marquee-active' : ''}`}>
            <span>{track.title}</span>
            {titleOverflows && <span aria-hidden="true">{track.title}</span>}
          </div>
        </div>
        <div ref={artistRef} className={`marquee-container ${artistOverflows ? 'marquee-running' : ''}`}>
          <div className={`text-fg-muted text-xs marquee-text ${artistOverflows ? 'marquee-active' : ''}`}>
            <span>{artistLine}</span>
            {artistOverflows && <span aria-hidden="true">{artistLine}</span>}
          </div>
        </div>
      </div>

      {/* Favourite, pin and remove all live behind one kebab so the row keeps a
          single action slot. A list only offers the actions it can honour:
          playlist rows drop the pin, read-only lists drop remove. */}
      <TrackActionsMenu
        label={`Actions for ${track.title}`}
        isFavourite={Boolean(track.isFavourite)}
        isPinned={Boolean(track.isPinned)}
        pinDisabled={pinDisabled}
        onToggleFavourite={onToggleFavourite ? () => onToggleFavourite(track.id) : undefined}
        onTogglePin={onTogglePin ? () => onTogglePin(track.id) : undefined}
        onRemove={onDelete ? () => onDelete(track.id) : undefined}
        removeIcon={deleteIcon}
        removeLabel={deleteLabel}
      />
    </div>
  )
}