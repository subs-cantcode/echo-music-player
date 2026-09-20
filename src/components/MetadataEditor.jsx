import { useState, useEffect, useCallback, useRef } from 'react'
import { useLibrary } from '../lib/LibraryContext.jsx'

export default function MetadataEditor({ track, onClose, onSaved, isOpen }) {
  // Hooks stay above the `isOpen` check (see the early return further down) so
  // the hook count never depends on the prop: App keeps the editor mounted and
  // opens it by prop, and a caller that mounts it conditionally must behave the
  // same way.
  const { updateTrack } = useLibrary()
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    year: '',
  })
  const [artworkFile, setArtworkFile] = useState(null)
  const [artworkPreview, setArtworkPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  // Which record the form was last filled from: re-opening the editor re-seeds
  // it, while unrelated library churn cannot wipe edits in progress.
  const seededTrackRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      seededTrackRef.current = null
      return
    }
    if (!track || seededTrackRef.current === track.id) return

    seededTrackRef.current = track.id
    setFormData({
      title: track.title || '',
      artist: track.artist || '',
      album: track.album || '',
      genre: track.genre || '',
      year: track.year || '',
    })
    setArtworkFile(null)
    setArtworkPreview(track.artwork || null)
    setError(null)
  }, [isOpen, track])

  const handleArtworkChange = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setArtworkFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setArtworkPreview(e.target.result)
    reader.readAsDataURL(file)
    setError(null)
  }, [])

  const removeArtwork = useCallback(() => {
    setArtworkFile(null)
    setArtworkPreview(null)
  }, [])

  const handleSave = async () => {
    if (!track) return

    setSaving(true)
    setError(null)

    try {
      const updates = { ...formData }
      if (artworkFile) {
        updates.artwork = artworkPreview
      } else if (artworkPreview === null && track.artwork) {
        updates.artwork = null
      }

      const updated = await updateTrack(track.id, updates)
      if (updated) {
        onSaved?.(updated)
        onClose()
      } else {
        setError('Failed to save changes')
      }
    } catch (e) {
      setError('Failed to save changes')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h2 className="text-lg font-medium text-fg">Edit Metadata</h2>
          <button onClick={onClose} className="player-btn w-9 h-9" aria-label="Close">
            <i className="bi bi-x-lg text-base" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-400/10 border border-red-400/40 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm text-fg-muted mb-2">Artwork</label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-border flex items-center justify-center flex-shrink-0">
                {artworkPreview ? (
                  <img src={artworkPreview} alt="Artwork preview" className="w-full h-full object-cover" />
                ) : (
                  <i className="bi bi-image text-fg-faint text-2xl" />
                )}
                {artworkPreview && (
                  <button
                    onClick={removeArtwork}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-fg/80 text-bg flex items-center justify-center text-xs hover:bg-fg transition-colors"
                    aria-label="Remove artwork"
                  >
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkChange}
                  className="w-full text-sm text-fg-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent-soft file:text-accent-text hover:file:bg-accent/20 cursor-pointer"
                  disabled={saving}
                />
                <p className="text-xs text-fg-faint mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm text-fg-muted mb-1">Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-fg focus:outline-none focus:border-accent transition-colors"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="artist" className="block text-sm text-fg-muted mb-1">Artist *</label>
              <input
                id="artist"
                name="artist"
                type="text"
                value={formData.artist}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-fg focus:outline-none focus:border-accent transition-colors"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="album" className="block text-sm text-fg-muted mb-1">Album</label>
              <input
                id="album"
                name="album"
                type="text"
                value={formData.album}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-fg focus:outline-none focus:border-accent transition-colors"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="genre" className="block text-sm text-fg-muted mb-1">Genre</label>
                <input
                  id="genre"
                  name="genre"
                  type="text"
                  value={formData.genre}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-fg focus:outline-none focus:border-accent transition-colors"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm text-fg-muted mb-1">Year</label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-fg focus:outline-none focus:border-accent transition-colors"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-xl border border-border-subtle hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.artist}
            className="px-4 py-2 text-sm rounded-xl bg-accent text-accent-ink font-medium hover:bg-accent/85 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}