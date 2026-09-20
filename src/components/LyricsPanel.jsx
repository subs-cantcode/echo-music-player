import { useState, useEffect, useMemo, useRef } from 'react'
import { fetchLyrics, searchLyrics, parseSyncedLyrics, isSyncedLyrics } from '../lib/lyrics.js'
import { updateTrack } from '../lib/localLibrary.js'
import { formatTime } from './NowPlaying.jsx'

const OFFSET_KEY = 'echo-lyrics-offsets'
const OFFSET_STEP = 0.25
const OFFSET_LIMIT = 5
const MANUAL_KEY = 'echo-lyrics-manual'

// Manually typed lyrics stay static (no timeline) even if they contain text
// that looks like a timestamp, so we remember which tracks were hand-written.
function readManualMap() {
  try {
    return JSON.parse(localStorage.getItem(MANUAL_KEY)) || {}
  } catch {
    return {}
  }
}

function markManual(trackId) {
  try {
    const all = readManualMap()
    all[trackId] = true
    localStorage.setItem(MANUAL_KEY, JSON.stringify(all))
  } catch {
    // Not remembering the flag only costs us the static styling on reopen.
  }
}

function clearManual(trackId) {
  try {
    const all = readManualMap()
    delete all[trackId]
    localStorage.setItem(MANUAL_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

function readOffsets() {
  try {
    return JSON.parse(localStorage.getItem(OFFSET_KEY)) || {}
  } catch {
    return {}
  }
}

function writeOffset(trackId, value) {
  try {
    const all = readOffsets()
    all[trackId] = value
    localStorage.setItem(OFFSET_KEY, JSON.stringify(all))
  } catch {
    // A private-mode localStorage failure just means the nudge isn't remembered.
  }
}

const formatOffset = (value) => `${value > 0 ? '+' : ''}${value.toFixed(2)}s`

export default function LyricsPanel({ track, currentTime, isOpen, onClose, onLyricsSaved }) {
  const [lyrics, setLyrics] = useState(null)
  const [synced, setSynced] = useState(false)
  const [parsedLyrics, setParsedLyrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('display') // 'display' | 'edit' | 'search'
  const [editText, setEditText] = useState('')
  const [results, setResults] = useState([])
  const [offset, setOffset] = useState(0)
  const lyricsRef = useRef(null)

  // Load whatever is already attached to the track when the panel opens.
  useEffect(() => {
    if (!track || !isOpen) return

    setError(null)
    setView('display')
    setResults([])
    setOffset(readOffsets()[track.id] || 0)

    if (track.lyrics) {
      const manual = Boolean(readManualMap()[track.id])
      applyLyrics(track.lyrics, manual ? false : undefined)
    } else {
      setLyrics(null)
      setSynced(false)
      setParsedLyrics(null)
    }
    // applyLyrics is stable for this purpose; keying on the track id + open state
    // avoids reloading on every currentTime tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, isOpen])

  function applyLyrics(text, syncedOverride) {
    const nextSynced = typeof syncedOverride === 'boolean' ? syncedOverride : isSyncedLyrics(text)
    setLyrics(text)
    setSynced(nextSynced)
    setParsedLyrics(nextSynced ? parseSyncedLyrics(text) : null)
  }

  // Derived rather than written to the DOM, so it always matches the current
  // time (the old version always lit line one). A positive offset makes lines
  // light up later; negative brings them forward — timings in the wild are
  // routinely a few hundred ms off.
  const activeIndex = useMemo(() => {
    if (!parsedLyrics?.length) return -1
    const timeline = currentTime - offset
    let index = -1
    for (let i = 0; i < parsedLyrics.length; i += 1) {
      if (parsedLyrics[i].time <= timeline) index = i
      else break
    }
    return index
  }, [parsedLyrics, currentTime, offset])

  useEffect(() => {
    if (activeIndex < 0 || !lyricsRef.current) return
    const el = lyricsRef.current.querySelector('.lyric-line.active')
    if (typeof el?.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIndex])

  // Persisted in the background: the panel shows the lyrics straight away and
  // never sits on the editor waiting for IndexedDB, which is what made a manual
  // save look like it did nothing.
  const persist = async (text) => {
    if (!track) return
    try {
      await updateTrack(track.id, { lyrics: text })
      onLyricsSaved?.(text)
    } catch (e) {
      console.warn('Failed to save lyrics:', e)
      setError('Lyrics are shown but could not be saved to this track.')
    }
  }

  const runSearch = async () => {
    if (!track) return
    setSearching(true)
    setError(null)
    setView('search')
    const query = `${track.artist || ''} ${track.title || ''}`.trim()
    const found = await searchLyrics(query)
    setResults(found)
    if (!found.length) setError('No lyrics found online. You can add them manually.')
    setSearching(false)
  }

  const handleFetch = async () => {
    if (!track) return
    setLoading(true)
    setError(null)
    setView('display')
    const result = await fetchLyrics(track.artist, track.title, track.duration)
    setLoading(false)
    if (result) {
      clearManual(track.id)
      applyLyrics(result.text, result.synced)
      persist(result.text)
    } else {
      // Nothing exact: fall back to search so the user can pick the right version.
      await runSearch()
    }
  }

  const handlePick = (result) => {
    const text = result.syncedLyrics || result.plainLyrics
    if (!text) return
    clearManual(track.id)
    applyLyrics(text, Boolean(result.syncedLyrics))
    setView('display')
    persist(text)
  }

  const handleSaveManual = () => {
    const text = editText
    // Hand-written lyrics are always static, never synced.
    applyLyrics(text, false)
    markManual(track.id)
    setView('display')
    persist(text)
  }

  const adjustOffset = (delta) => {
    setOffset((prev) => {
      const next = Math.min(OFFSET_LIMIT, Math.max(-OFFSET_LIMIT, Math.round((prev + delta) * 100) / 100))
      if (track) writeOffset(track.id, next)
      return next
    })
  }

  const resetOffset = () => {
    setOffset(0)
    if (track) writeOffset(track.id, 0)
  }

  if (!isOpen) return null

  const header = (
    <div className="flex items-center justify-between p-4 border-b border-border-subtle">
      <div className="min-w-0">
        <h2 className="text-lg font-medium text-fg flex items-center gap-2">
          <i className="bi bi-file-text text-accent" />
          Lyrics
        </h2>
        {track && (
          <p className="text-fg-faint text-xs truncate mt-0.5">
            {track.title}
            {track.artist ? ` — ${track.artist}` : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {view === 'display' && lyrics && (
          <button
            onClick={() => { setEditText(lyrics); setView('edit') }}
            className="player-btn w-9 h-9"
            aria-label="Edit lyrics"
          >
            <i className="bi bi-pencil text-base" />
          </button>
        )}
        {view !== 'display' && (
          <button
            onClick={() => setView('display')}
            className="player-btn w-9 h-9"
            aria-label="Back"
          >
            <i className="bi bi-arrow-left text-base" />
          </button>
        )}
        <button onClick={onClose} className="player-btn w-9 h-9" aria-label="Close lyrics">
          <i className="bi bi-x-lg text-base" />
        </button>
      </div>
    </div>
  )

  let body

  if (view === 'edit') {
    body = (
      <div className="max-w-2xl mx-auto">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full h-[60vh] p-4 bg-surface border border-border rounded-xl text-fg font-mono text-sm resize-none focus:outline-none focus:border-accent"
          placeholder={'Enter lyrics here...\nFor synced lyrics, use format: [mm:ss.xx]Line text\nExample: [00:12.34]First line'}
          spellCheck={false}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => setView('display')} className="px-4 py-2 text-sm rounded-xl border border-border-subtle hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <button onClick={handleSaveManual} className="px-4 py-2 text-sm rounded-xl bg-accent text-accent-ink font-medium hover:bg-accent/85 active:scale-[0.97] transition-all duration-150">
            Save
          </button>
        </div>
      </div>
    )
  } else if (view === 'search') {
    body = (
      <div className="max-w-2xl mx-auto">
        <p className="text-fg-muted text-sm mb-3">Pick the version that matches your track:</p>
        {searching ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {error && <p className="text-fg-muted text-sm mb-3">{error}</p>}
            <div className="flex flex-col gap-2">
              {results.map((result, i) => (
                <button
                  key={`${result.artist}-${result.title}-${i}`}
                  onClick={() => handlePick(result)}
                  className="text-left p-3 rounded-xl bg-surface border border-border-subtle hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-fg font-medium truncate">{result.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${result.syncedLyrics ? 'bg-accent-soft text-accent-text' : 'bg-border text-fg-muted'}`}>
                      {result.syncedLyrics ? 'Synced' : 'Plain'}
                    </span>
                  </div>
                  <div className="text-fg-muted text-sm truncate">
                    {result.artist}
                    {result.album ? ` — ${result.album}` : ''}
                    {result.duration ? ` · ${formatTime(result.duration)}` : ''}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => { setEditText(''); setView('edit') }}
                className="px-4 py-2 text-sm rounded-xl border border-border-subtle hover:bg-surface-hover transition-colors"
              >
                Add lyrics manually instead
              </button>
            </div>
          </>
        )}
      </div>
    )
  } else if (loading) {
    body = (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-fg-muted text-sm">Fetching lyrics…</p>
      </div>
    )
  } else if (lyrics) {
    body = (
      <div className="max-w-2xl mx-auto">
        {synced && (
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-fg-faint">
            <span>Sync offset</span>
            <button
              onClick={() => adjustOffset(-OFFSET_STEP)}
              className="player-btn w-7 h-7"
              aria-label="Shift lyrics earlier"
            >
              <i className="bi bi-dash text-sm" />
            </button>
            <span className="tabular-nums w-14 text-center">{formatOffset(offset)}</span>
            <button
              onClick={() => adjustOffset(OFFSET_STEP)}
              className="player-btn w-7 h-7"
              aria-label="Shift lyrics later"
            >
              <i className="bi bi-plus text-sm" />
            </button>
            {offset !== 0 && (
              <button
                onClick={resetOffset}
                className="ml-1 px-2 py-1 rounded-lg border border-border-subtle hover:bg-surface-hover transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}
        {synced && parsedLyrics ? (
          <div ref={lyricsRef} className="lyrics-synced text-center leading-relaxed">
            {parsedLyrics.map((line, i) => (
              <div
                key={i}
                className={`lyric-line ${i === activeIndex ? 'active' : ''}`}
                data-time={line.time}
              >
                {line.text}
              </div>
            ))}
          </div>
        ) : (
          <div className="lyrics-static">
            {lyrics.split('\n').map((line, i) => (
              <div key={i}>{line || '\u00a0'}</div>
            ))}
          </div>
        )}
      </div>
    )
  } else {
    // Empty state: let the user choose how to get lyrics.
    body = (
      <div className="max-w-md mx-auto text-center py-10">
        <i className="bi bi-music-note-list text-fg-faint text-4xl" />
        <p className="text-fg-muted mt-3 mb-6">No lyrics for this track yet.</p>
        {error && <p className="text-fg-muted text-sm mb-4">{error}</p>}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2">
          <button
            onClick={handleFetch}
            className="px-5 py-2.5 rounded-xl bg-accent text-accent-ink font-medium hover:bg-accent/85 active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <i className="bi bi-cloud-arrow-down" />
            Fetch lyrics
          </button>
          <button
            onClick={() => { setEditText(''); setView('edit') }}
            className="px-5 py-2.5 rounded-xl border border-border-subtle hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
          >
            <i className="bi bi-pencil-square" />
            Add lyrics manually
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-sm" role="dialog" aria-modal="true">
      {header}
      <div className="flex-1 overflow-auto p-4">{body}</div>
    </div>
  )
}
