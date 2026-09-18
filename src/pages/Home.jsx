import { useMemo } from 'react'
import TrackRow from '../components/TrackRow.jsx'
import ParticleBackground from '../components/ParticleBackground.jsx'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home({ tracks, currentTrack, onPlay, onDelete, onToggleFavourite, recentlyPlayed, onShuffleAll }) {
  const forgotten = useMemo(() => {
    if (tracks.length <= 5) return []
    return [...tracks]
      .filter((t) => currentTrack?.id !== t.id)
      .sort((a, b) => {
        const aPlayed = a.lastPlayed ? Date.parse(a.lastPlayed) : 0
        const bPlayed = b.lastPlayed ? Date.parse(b.lastPlayed) : 0
        return aPlayed - bPlayed
      })
      .slice(0, 5)
  }, [tracks, currentTrack])

  return (
    <div className="home-page">
      <ParticleBackground />

      {/* page-enter lives here, not on .home-page: a transform on the ancestor
          would trap the fixed canvas in the page box instead of the viewport. */}
      <div className="home-content page-enter">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-fg mb-0.5">{getGreeting()}</h1>
          <p className="text-fg-muted text-sm">Welcome back to your space.</p>
        </div>

        {recentlyPlayed.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-medium text-fg mb-3">Continue Listening</h2>
            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
              {recentlyPlayed.slice(0, 6).map((track) => (
                <button
                  key={track.id}
                  onClick={() => onPlay(track)}
                  className={`flex-shrink-0 w-[130px] bg-surface p-3 rounded-xl text-left transition-all duration-200 hover:bg-surface-hover hover:scale-[1.02] active:scale-[0.98] ${
                    currentTrack?.id === track.id ? 'ring-1 ring-accent' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-border flex items-center justify-center mb-2">
                    <i className="bi bi-music-note-beamed text-fg-faint text-sm" />
                  </div>
                  <div className="text-sm font-medium text-fg truncate">{track.title}</div>
                  <div className="text-fg-muted text-xs truncate">{track.artist || 'Unknown'}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {forgotten.length > 0 && (
          <section className="mb-6">
            <div className="mb-3">
              <h2 className="text-sm font-medium text-fg">Forgotten Echoes</h2>
              <p className="text-fg-faint text-xs mt-0.5">Tracks you haven't returned to in a while.</p>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
              {forgotten.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onPlay(track)}
                  className="flex-shrink-0 w-[130px] bg-surface p-3 rounded-xl text-left transition-all duration-200 hover:bg-surface-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-lg bg-border flex items-center justify-center mb-2">
                    <i className="bi bi-hourglass text-fg-faint text-sm" />
                  </div>
                  <div className="text-sm font-medium text-fg truncate">{track.title}</div>
                  <div className="text-fg-muted text-xs truncate">{track.artist || 'Unknown'}</div>
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
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
