import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Menu geometry. The panel is `w-48`, so its width has to match for the
// right-edge clamp, and a short viewport flips the panel above the trigger
// rather than letting it slip under the player bar.
const MENU_WIDTH = 192;
const MENU_GAP = 6;
const MIN_SPACE_BELOW = 150;

// One menu row. The icon sits in a fixed-width slot so the three labels start
// on the same line and the stack reads as an even list.
function MenuItem({
  icon, label, onSelect, active = false, danger = false, disabled = false, title,
}) {
  const tone = disabled
    ? 'text-fg-faint cursor-not-allowed opacity-45'
    : danger
      ? 'text-fg-muted hover:text-red-400 hover:bg-surface-hover'
      : active
        ? 'text-accent-text hover:bg-surface-hover'
        : 'text-fg-muted hover:text-fg hover:bg-surface-hover';

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      disabled={disabled}
      title={title}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${tone}`}
    >
      <i className={`bi ${icon} text-sm w-4 text-center flex-shrink-0`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

// A track's actions behind a single kebab, so a row stays one calm strip no
// matter how many of the three actions a given list can offer.
//
// The panel is portalled to the body and positioned from the trigger's rect:
// inside the page scroller a plain absolute panel would be clipped by the
// scroll container's edge and hidden behind the player bar.
export default function TrackActionsMenu({
  label = 'Track actions',
  isFavourite = false,
  isPinned = false,
  pinDisabled = false,
  onToggleFavourite,
  onTogglePin,
  onEdit,
  onRemove,
  removeIcon = 'bi-trash3',
  removeLabel = 'Delete track',
}) {
  const [position, setPosition] = useState(null);
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const open = position !== null;

  const close = () => setPosition(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      if (anchorRef.current?.contains(event.target)) return;
      close();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    // A fixed panel cannot follow the list, so any scroll (captured, so the
    // page scroller counts too) simply dismisses it.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = (event) => {
    event.stopPropagation();
    if (open) {
      close();
      return;
    }

    const rect = anchorRef.current.getBoundingClientRect();
    const flipUp = window.innerHeight - rect.bottom < MIN_SPACE_BELOW;

    setPosition({
      right: Math.max(8, window.innerWidth - rect.right),
      // Anchoring by the far edge means the panel grows away from the trigger
      // without measuring its height first.
      ...(flipUp
        ? { bottom: window.innerHeight - rect.top + MENU_GAP }
        : { top: rect.bottom + MENU_GAP }),
    });
  };

  const select = (action) => (event) => {
    event.stopPropagation();
    close();
    action?.();
  };

  const hasActions = Boolean(onToggleFavourite || onTogglePin || onEdit || onRemove);

  if (!hasActions) return null;

  const triggerTone = open ? 'bg-border text-fg' : 'text-fg-faint hover:text-fg hover:bg-border/50';

  // The lit state of a track is its own icon beside the kebab, so clearing it
  // is one click instead of a trip through the menu. Both keep the shared
  // icon-button sizing so the cluster stays even.
  const badges = [
    isFavourite && onToggleFavourite && {
      key: 'favourite',
      icon: 'bi-heart-fill',
      label: 'Unfavourite',
      run: onToggleFavourite,
    },
    isPinned && onTogglePin && {
      key: 'pinned',
      icon: 'bi-pin-angle-fill',
      label: 'Unpin',
      title: 'Unpin from Instant Replay',
      run: onTogglePin,
    },
  ].filter(Boolean);

  return (
    <div
      ref={anchorRef}
      className="relative flex items-center gap-0.5 flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      {badges.map((badge) => (
        <button
          key={badge.key}
          type="button"
          onClick={() => { close(); badge.run(); }}
          className="w-6 h-6 rounded-full flex items-center justify-center text-accent-text hover:bg-border/60 transition-colors duration-200"
          title={badge.title || badge.label}
          aria-label={badge.label}
        >
          <i className={`bi ${badge.icon} text-xs`} />
        </button>
      ))}

      <button
        type="button"
        onClick={toggle}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 ${triggerTone}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <i className="bi bi-three-dots-vertical text-sm" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 w-48 py-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden fade-in"
            style={position}
            onClick={(e) => e.stopPropagation()}
          >
            {onToggleFavourite && (
              <MenuItem
                icon={isFavourite ? 'bi-heart-fill' : 'bi-heart'}
                label={isFavourite ? 'Unfavourite' : 'Favourite'}
                active={isFavourite}
                onSelect={select(() => onToggleFavourite())}
              />
            )}

            {onTogglePin && (
              <MenuItem
                icon={isPinned ? 'bi-pin-angle-fill' : 'bi-pin-angle'}
                label={isPinned ? 'Unpin' : 'Pin'}
                active={isPinned}
                disabled={pinDisabled && !isPinned}
                title={pinDisabled && !isPinned ? 'Instant Replay is full' : undefined}
                onSelect={select(() => onTogglePin())}
              />
            )}

            {/* Open to every track, imported or not: the editor only ever reads
                and rewrites fields the record already has. */}
            {onEdit && (
              <MenuItem
                icon="bi-tag"
                label="Edit metadata"
                onSelect={select(() => onEdit())}
              />
            )}

            {onRemove && (
              <MenuItem
                icon={removeIcon}
                label={removeLabel}
                danger
                onSelect={select(() => onRemove())}
              />
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
