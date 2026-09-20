import { useState, useRef, useCallback, useEffect } from 'react'
import { formatTime } from './NowPlaying.jsx'
import MarqueeText from './MarqueeText.jsx'
import NowPlayingTitle from './NowPlayingTitle.jsx'
import AudioWaves from './AudioWaves.jsx'

export default function NowPlayingBar({
  track, isPlaying, currentTime, duration, progress, volume, isMuted,
  loopMode, shuffleOn, onPlayPause, onSkipBack, onSkipForward, onSeek,
  onSetVolume, onToggleMute, onToggleFavourite, onToggleLoop, onToggleShuffle,
  onOpenLyrics, onOpenMetadata, onOpenLastFm,
}) {
  const [volDrag, setVolDrag] = useState(false)
  const [heartKey, setHeartKey] = useState(0)
  const volRef = useRef(null)
  const volDragRef = useRef(false)

  const handleVolMouseDown = useCallback((e) => {
    if (!volRef.current || !onSetVolume) return
    e.preventDefault()
    volDragRef.current = true
    setVolDrag(true)
    const rect = volRef.current.getBoundingClientRect()
    const pos = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    onSetVolume(pos)

    const onMove = (ev) => {
      const r = volRef.current?.getBoundingClientRect()
      if (!r) return
      onSetVolume(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)))
    }
    const onUp = () => {
      volDragRef.current = false
      setVolDrag(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onSetVolume])

  useEffect(() => () => { volDragRef.current = false }, [])

  const effectiveVol = isMuted ? 0 : volume
  const volIcon = effectiveVol === 0 ? 'bi-volume-mute' : effectiveVol < 0.5 ? 'bi-volume-down' : 'bi-volume-up'
  const repeatIcon = loopMode === 'track' ? 'bi-repeat-1' : 'bi-repeat'
  const isFav = track?.isFavourite ?? false

  return (
    <div
      className="fixed bottom-3 left-3 right-3 z-40 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      <div
        className="frosted-panel relative overflow-hidden pointer-events-auto max-w-[840px] mx-auto bg-surface border border-border-subtle rounded-2xl px-4 py-2.5 shadow-sm"
        style={{ '--frost-tint': '65%', '--frost-blur': '20px' }}
      >
        <AudioWaves />

        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          {/* Track info. flex-1 mirrors the lyrics/volume column so the
              centred controls land on the bar's true horizontal centre. The
              min width stops a narrow bar from crushing the text to a sliver
              (which made even short titles scroll); the row wraps instead. */}
          <div className="flex items-center gap-2 flex-1 min-w-[11rem]">
            <div className="w-10 h-10 rounded-xl bg-border flex items-center justify-center flex-shrink-0 overflow-hidden">
              {track?.artwork ? (
                <img src={track.artwork} alt="" className="w-full h-full object-cover" />
              ) : (
                <i className="bi bi-music-note-beamed text-fg-faint text-sm" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {track ? (
                <>
                  <NowPlayingTitle title={track.title} />
                  {/* leading-4 against the title's leading-5 keeps the pair's
                      line boxes snug and evenly padded. */}
                  <MarqueeText className="text-fg-faint text-[13px] leading-4">
                    {track.artist || ''}
                  </MarqueeText>
                </>
              ) : (
                <div className="text-fg-faint text-base">No song is being played right now</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-1.5 flex-shrink-0 flex-wrap">
            <button
              onClick={() => { onToggleFavourite(); setHeartKey((k) => k + 1) }}
              className={`player-btn w-10 h-10 ${isFav ? 'text-accent-text' : ''}`}
              aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            >
              <i key={heartKey} className={`text-base heart-pop ${isFav ? 'bi-heart-fill' : 'bi-heart'}`} />
            </button>

            <button
              onClick={onToggleShuffle}
              className={`player-btn w-10 h-10 ${shuffleOn ? 'text-accent-text' : ''}`}
              title={shuffleOn ? 'Shuffle on' : 'Shuffle off'}
              aria-label="Shuffle"
              aria-pressed={Boolean(shuffleOn)}
            >
              <i className="bi bi-shuffle text-sm" />
            </button>

            <button onClick={onSkipBack} className="player-btn w-10 h-10" title="Previous track" aria-label="Previous track">
              <i className="bi bi-skip-backward-fill text-base" />
            </button>

            <button
              onClick={onPlayPause}
              className="player-btn w-11 h-11 bg-fg text-bg hover:bg-fg/85"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <i className="bi bi-pause-fill text-xl" /> : <i className="bi bi-play-fill text-xl ml-0.5" />}
            </button>

            <button onClick={onSkipForward} className="player-btn w-10 h-10" title="Next track" aria-label="Next track">
              <i className="bi bi-skip-forward-fill text-base" />
            </button>

            <button
              onClick={onToggleLoop}
              className={`player-btn w-10 h-10 ${loopMode !== 'off' ? 'text-accent-text' : ''}`}
              title={`Loop: ${loopMode}`}
              aria-label="Loop"
              aria-pressed={loopMode !== 'off'}
            >
              <i className={`bi ${repeatIcon} text-sm`} />
            </button>

            <button
              onClick={onOpenMetadata}
              className="player-btn w-10 h-10"
              title="Edit metadata"
              aria-label="Edit metadata"
            >
              <i className="bi bi-tag text-sm" />
            </button>

            <button
              onClick={onOpenLastFm}
              className="player-btn w-10 h-10"
              title="Last.fm"
              aria-label="Last.fm settings"
            >
              <i className="bi bi-lastfm text-sm" />
            </button>
          </div>

          {/* Lyrics + volume, right-aligned; lyrics sits just left of the
              volume icon. */}
          <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
            <button
              onClick={onOpenLyrics}
              className="player-btn w-9 h-9"
              title="Lyrics"
              aria-label="Lyrics"
            >
              <i className="bi bi-file-text text-sm" />
            </button>
            <button onClick={onToggleMute} className="player-btn w-9 h-9" aria-label={isMuted ? 'Unmute' : 'Mute'}>
              <i className={`bi ${volIcon} text-sm`} />
            </button>
            <div
              ref={volRef}
              className="relative h-6 w-[80px] flex items-center cursor-pointer group"
              onMouseDown={handleVolMouseDown}
            >
              <div className="bar-track w-full">
                <div className="bar-fill" style={{ width: `${effectiveVol * 100}%` }} />
                <div
                  className={`bar-thumb ${volDrag ? 'scale-110 !opacity-100' : ''}`}
                  style={{ left: `${effectiveVol * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="relative z-10 flex items-center gap-2 mt-1 px-0.5">
          <span className="text-fg-faint text-[10px] w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => {
              if (!duration || !onSeek) return
              const newTime = (e.target.value / 100) * duration
              onSeek(newTime)
            }}
            className="progress-slider flex-1"
            style={{
              background: `linear-gradient(to right, var(--accent) ${progress}%, var(--border) ${progress}%)`,
            }}
            aria-label="Seek"
          />
          <span className="text-fg-faint text-[10px] w-8 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
