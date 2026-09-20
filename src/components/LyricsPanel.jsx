import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchLyrics, parseSyncedLyrics, getCurrentLyricLine } from '../lib/lyrics.js'
import { updateTrack } from '../lib/localLibrary.js'

export default function LyricsPanel({ track, currentTime, isOpen, onClose }) {
  const [lyrics, setLyrics] = useState(null)
  const [parsedLyrics, setParsedLyrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [synced, setSynced] = useState(false)
  const lyricsRef = useRef(null)

  useEffect(() => {
    if (!track || !isOpen) return

    const loadLyrics = async () => {
      setLoading(true)
      setError(null)

      if (track.lyrics) {
        const isSynced = track.lyrics.startsWith('[')
        setLyrics(track.lyrics)
        setSynced(isSynced)
        if (isSynced) {
          setParsedLyrics(parseSyncedLyrics(track.lyrics))
        }
        setLoading(false)
        return
      }

      const result = await fetchLyrics(track.artist, track.title, track.duration)
      if (result) {
        setLyrics(result.text)
        setSynced(result.synced)
        if (result.synced) {
          setParsedLyrics(parseSyncedLyrics(result.text))
        }
        await updateTrack(track.id, { lyrics: result.text })
      } else {
        setError('Lyrics not found. You can add them manually.')
      }
      setLoading(false)
    }

    loadLyrics()
  }, [track, isOpen])

  useEffect(() => {
    if (!parsedLyrics || !lyricsRef.current) return

    const currentLine = getCurrentLyricLine(parsedLyrics, currentTime)
    if (currentLine) {
      const activeEl = lyricsRef.current.querySelector('.lyric-line.active')
      const nextEl = lyricsRef.current.querySelector(`[data-time="${currentLine.time}"]`)

      if (nextEl && nextEl !== activeEl) {
        activeEl?.classList.remove('active')
        nextEl.classList.add('active')
        nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentTime, parsedLyrics])

  const handleSave = async () => {
    if (!track) return
    await updateTrack(track.id, { lyrics: editText })
    setLyrics(editText)
    const isSynced = editText.includes('[') && editText.includes(']')
    setSynced(isSynced)
    if (isSynced) {
      setParsedLyrics(parseSyncedLyrics(editText))
    }
    setEditing(false)
  }

  const handleFetchAgain = async () => {
    if (!track) return
    setLoading(true)
    setError(null)
    const result = await fetchLyrics(track.artist, track.title, track.duration)
    if (result) {
      setLyrics(result.text)
      setSynced(result.synced)
      if (result.synced) {
        setParsedLyrics(parseSyncedLyrics(result.text))
      }
      await updateTrack(track.id, { lyrics: result.text })
    } else {
      setError('Lyrics not found. You can add them manually.')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <h2 className="text-lg font-medium text-fg flex items-center gap-2">
          <i className="bi bi-file-text text-accent" />
          Lyrics
        </h2>
        <div className="flex items-center gap-2">
          {!editing && lyrics && (
            <button
              onClick={() => { setEditText(lyrics); setEditing(true); }}
              className="player-btn w-9 h-9"
              aria-label="Edit lyrics"
            >
              <i className="bi bi-pencil text-base" />
            </button>
          )}
          <button onClick={onClose} className="player-btn w-9 h-9" aria-label="Close lyrics">
            <i className="bi bi-x-lg text-base" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {editing ? (
          <div className="max-w-2xl mx-auto">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-[60vh] p-4 bg-surface border border-border rounded-xl text-fg font-mono text-sm resize-none focus:outline-none focus:border-accent"
              placeholder="Enter lyrics here...&#10;For synced lyrics, use format: [mm:ss.xx]Line text&#10;Example: [00:12.34]First line"
              spellCheck={false}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-xl border border-border-subtle hover:bg-surface-hover transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm rounded-xl bg-accent text-accent-ink font-medium hover:bg-accent/85 active:scale-[0.97] transition-all duration-150">
                Save
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <i className="bi bi-search text-fg-faint text-4xl mb-3" />
            <p className="text-fg-muted mb-4">{error}</p>
            <button
              onClick={() => { setEditText(''); setEditing(true); }}
              className="px-4 py-2 rounded-xl bg-accent text-accent-ink font-medium hover:bg-accent/85 active:scale-[0.97] transition-all duration-150"
            >
              Add Lyrics Manually
            </button>
            <button
              onClick={handleFetchAgain}
              className="ml-2 px-4 py-2 rounded-xl border border-border-subtle text-sm hover:bg-surface-hover transition-colors"
            >
              Try Fetch Again
            </button>
          </div>
        ) : lyrics ? (
          <div className="max-w-2xl mx-auto">
            <div
              ref={lyricsRef}
              className="lyrics-content text-center leading-relaxed"
              style={{ fontSize: '1.1rem', lineHeight: '2.5rem' }}
            >
              {synced && parsedLyrics ? (
                parsedLyrics.map((line, i) => (
                  <div
                    key={i}
                    className={`lyric-line transition-colors duration-300 ${parsedLyrics[0] === line ? 'active' : ''}`}
                    data-time={line.time}
                    style={{ color: 'var(--fg-muted)' }}
                  >
                    {line.text}
                  </div>
                ))
              ) : (
                lyrics.split('\n').map((line, i) => (
                  <div key={i} className="lyric-line" style={{ color: 'var(--fg-muted)' }}>
                    {line || <span className="text-fg-faint">♪</span>}
                  </div>
                ))
              )}
            </div>
            {!synced && (
              <p className="text-center text-fg-faint text-sm mt-4">
                <i className="bi bi-info-circle" /> These are plain lyrics.{' '}
                <button
                  onClick={() => { setEditText(lyrics); setEditing(true); }}
                  className="text-accent hover:underline"
                >
                  Edit to add timestamps
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-fg-muted">
            <i className="bi bi-file-text text-4xl mb-3" />
            <p>No lyrics available</p>
            <button
              onClick={() => { setEditText(''); setEditing(true); }}
              className="mt-3 px-4 py-2 rounded-xl bg-accent text-accent-ink font-medium hover:bg-accent/85 active:scale-[0.97] transition-all duration-150"
            >
              Add Lyrics
            </button>
          </div>
        )}
      </div>
    </div>
  )
}