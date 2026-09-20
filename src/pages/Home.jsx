import { useMemo } from 'react'
import TrackRow from '../components/TrackRow.jsx'
import ParticleBackground from '../components/ParticleBackground.jsx'
import MarqueeText from '../components/MarqueeText.jsx'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home({ tracks, currentTrack, onPlay, onDelete, onToggleFavourite, onTogglePin, onEditMetadata, pinLimit = 9, recentlyPlayed, onShuffleAll }) {
  // Pinned tracks, newest pin first, capped so legacy data that slipped past
  // the limit can't widen the shelf.
  const pinned = useMemo(() => {
    return tracks
      .filter((t) => t.isPinned)
      .sort((a, b) => {
        const aPinned = a.pinnedAt ? Date.parse(a.pinnedAt) : 0
        const bPinned = b.pinnedAt ? Date.parse(b.pinnedAt) : 0
        return bPinned - aPinned
      })
      .slice(0, pinLimit)
  }, [tracks, pinLimit])

  const pinLimitReached = pinned.length >= pinLimit

  const forgotten = useMemo(() => {
    if (tracks.length <= 5) return []
    // Anything still on the Where You Left Off shelf is not forgotten yet, so
    // the two shelves never show the same track (a track played but not yet
    // finished still has no lastPlayed to sort it away with).
    const shelvedIds = new Set(recentlyPlayed.map((t) => t.id))
    return [...tracks]
      .filter((t) => currentTrack?.id !== t.id && !shelvedIds.has(t.id))
      .sort((a, b) => {
        const aPlayed = a.lastPlayed ? Date.parse(a.lastPlayed) : 0
        const bPlayed = b.lastPlayed ? Date.parse(b.lastPlayed) : 0
        return aPlayed - bPlayed
      })
      .slice(0, 5)
  }, [tracks, currentTrack, recentlyPlayed])

  return (
    <div className="home-page">
      <ParticleBackground />

      {/* page-enter lives here, not on .home-page: a transform on the ancestor
          would trap the fixed canvas in the page box instead of the viewport. */}
      <div className="home-content page-enter">
<div className="mb-6">
<h1 className="home-greeting mb-0.5">Welcome back, Nabus</h1>
            <p className="home-subtext">Long time no see — let's get listening!</p>
         </div>

{recentlyPlayed.length > 0 && (
          <section className="mb-6">
            <div className="mb-3">
              <h2 className="text-sm font-medium text-fg">Where You Left Off</h2>
              <p className="text-fg-faint text-xs mt-0.5">
                The player starts quiet now — pick a track back up whenever you're ready.
              </p>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pt-2 pb-2 -mx-1 px-1">
              {recentlyPlayed.slice(0, 6).map((track) => (
                <button
                  key={track.id}
                  onClick={() => onPlay(track)}
                  className={`flex-shrink-0 w-[130px] bg-surface border border-border-subtle p-3 rounded-xl text-left transition-all duration-200 hover:bg-surface-hover hover:scale-[1.02] active:scale-[0.98] ${
                    currentTrack?.id === track.id ? 'ring-1 ring-accent' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-border flex items-center justify-center mb-2 overflow-hidden">
                    {track.artwork ? (
                      <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <i className="bi bi-music-note-beamed text-fg-faint text-sm" />
                    )}
                  </div>
<MarqueeText className="text-sm font-medium text-fg">{track.title}</MarqueeText>
                  <MarqueeText className="text-fg-muted text-xs">{track.artist || 'Unknown'}</MarqueeText>
                  </button>
              ))}
            </div>
          </section>
        )}

        {/* Instant Replay: the shortlist of pinned tracks, kept above
            Forgotten Echoes because it is the one the listener chose. */}
        <section className="mb-6">
          <div className="flex justify-between items-baseline gap-3 mb-3">
            <div>
              <h2 className="text-sm font-medium text-fg">Instant Replay</h2>
              <p className="text-fg-faint text-xs mt-0.5">
                {pinned.length === 0
                  ? `Pin up to ${pinLimit} tracks and they'll be waiting here next visit.`
                  : 'Your pinned tracks, newest first.'}
              </p>
            </div>
            <span className="flex-shrink-0 text-fg-faint text-xs tabular-nums">
              {pinned.length}/{pinLimit} pinned
            </span>
          </div>

          {pinned.length === 0 ? (
            <div className="bg-surface border border-border-subtle rounded-xl px-4 py-6 text-center">
              <i className="bi bi-pin-angle text-fg-faint text-xl block mb-2" />
              <p className="text-xs text-fg-muted">
                Nothing pinned yet — use the pin on any track in Your Library.
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pt-2 pb-2 -mx-1 px-1">
              {pinned.map((track) => (
                <div key={track.id} className="relative flex-shrink-0 w-[130px]">
                  <button
                    onClick={() => onPlay(track)}
                    className={`w-full bg-surface border border-border-subtle p-3 rounded-xl text-left transition-all duration-200 hover:bg-surface-hover hover:scale-[1.02] active:scale-[0.98] ${
                      currentTrack?.id === track.id ? 'ring-1 ring-accent' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-border flex items-center justify-center mb-2 overflow-hidden">
                      {track.artwork ? (
                        <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <i className="bi bi-pin-angle text-fg-faint text-sm" />
                      )}
                    </div>
                    <MarqueeText className="text-sm font-medium text-fg">{track.title}</MarqueeText>
                    <MarqueeText className="text-fg-faint text-[10px]">{track.artist || 'Unknown'}</MarqueeText>
                  </button>
                  <button
                    onClick={() => onTogglePin?.(track.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-surface-hover text-accent-text text-[10px] hover:bg-border transition-colors"
                    title="Unpin from Instant Replay"
                    aria-label={`Unpin ${track.title} from Instant Replay`}
                  >
                    <i className="bi bi-pin-angle-fill" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

{forgotten.length > 0 && (
            <section className="mb-6">
              <div className="mb-3">
                <h2 className="text-sm font-medium text-fg">Forgotten Echoes</h2>
                <p className="text-fg-faint text-xs mt-0.5">Tracks you haven't returned to in a while.</p>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pt-2 pb-2 -mx-1 px-1">
                {forgotten.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => onPlay(track)}
                    className="flex-shrink-0 w-[130px] bg-surface border border-border-subtle p-3 rounded-xl text-left transition-all duration-200 hover:bg-surface-hover hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-border flex items-center justify-center mb-2 overflow-hidden">
                      {track.artwork ? (
                        <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <i className="bi bi-hourglass text-fg-faint text-sm" />
                      )}
                    </div>
<MarqueeText className="text-sm font-medium text-fg">{track.title}</MarqueeText>
                    <MarqueeText className="text-fg-faint text-[10px]">{track.artist || 'Unknown'}</MarqueeText>
                  </button>
                ))}
              </div>
            </section>
          )}

        <section className="bg-surface rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-fg">Your Library</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-fg-faint text-xs">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
              {tracks.length > 0 && (
                <button
                  onClick={onShuffleAll}
                  className="player-btn w-7 h-7"
                  title="Shuffle all"
                  aria-label="Shuffle all tracks"
                >
                  <i className="bi bi-shuffle text-xs" />
                </button>
              )}
            </div>
          </div>

          {tracks.length === 0 ? (
            <div className="text-center py-10">
              <i className="bi bi-disc text-3xl text-fg-faint mb-3 block" />
              <p className="text-sm text-fg-muted mb-1">Your space is quiet.</p>
              <p className="text-xs text-fg-faint">Import some music to begin.</p>
            </div>
          ) : (
            <div className="group">
              {tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  isActive={currentTrack?.id === track.id}
                  onPlay={onPlay}
                  onDelete={onDelete}
                  onToggleFavourite={onToggleFavourite}
                  onTogglePin={onTogglePin}
                  onEditMetadata={onEditMetadata}
                  pinDisabled={pinLimitReached}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
