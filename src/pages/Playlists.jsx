import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TrackRow from '../components/TrackRow.jsx'
import { useLibrary } from '../lib/LibraryContext.jsx'

function PlaylistList({ tracks, onNavigate }) {
  const { playlists, createPlaylist, deletePlaylist } = useLibrary()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const knownTrackIds = new Set(tracks.map((t) => t.id))

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      await createPlaylist(name)
      setNewName('')
    } catch (err) {
      console.error('Failed to create playlist:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (event, playlistId) => {
    event.stopPropagation()
    if (!window.confirm('Delete this playlist?')) return
    try {
      await deletePlaylist(playlistId)
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }

  return (
    <div className="bg-surface rounded-2xl p-5">
      <h2 className="text-xl font-medium text-fg mb-4">Playlists</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New playlist name..."
          className="flex-1 bg-bg border border-border rounded-xl px-3.5 py-2 text-sm text-fg placeholder:text-fg-faint"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/85 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          Create
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-fg-muted text-sm text-center py-8">No playlists yet. Create one above.</p>
      ) : (
        <div className="flex flex-col">
          {playlists.map((pl) => {
            const count = (pl.trackIds || []).filter((id) => knownTrackIds.has(id)).length
            return (
              <div
                key={pl.id}
                role="button"
                tabIndex={0}
                onClick={() => onNavigate(`/playlists/${pl.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate(`/playlists/${pl.id}`)}
                className="flex justify-between items-center py-3 px-2 -mx-2 rounded-lg text-left hover:bg-surface-hover transition-colors cursor-pointer group"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg truncate">{pl.name}</div>
                  <div className="text-fg-faint text-xs">{count} track{count !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDelete(e, pl.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-fg-faint hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all duration-150"
                    aria-label={`Delete ${pl.name}`}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                  <i className="bi bi-chevron-right text-fg-faint text-xs" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PlaylistDetail({ tracks, currentTrack, onPlay }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist, deletePlaylist } = useLibrary()
  const [pickerOpen, setPickerOpen] = useState(false)

  const playlist = playlists.find((p) => p.id === id)
  const trackMap = new Map(tracks.map((t) => [t.id, t]))
  const displayTracks = (playlist?.trackIds || []).map((trackId) => trackMap.get(trackId)).filter(Boolean)
  const availableTracks = tracks.filter((t) => !(playlist?.trackIds || []).includes(t.id))

  if (!playlist) {
    return (
      <div className="bg-surface rounded-2xl p-5">
        <p className="text-fg-muted text-sm">Playlist not found.</p>
        <button onClick={() => navigate('/playlists')} className="mt-2 text-accent text-sm hover:underline">
          Back to playlists
        </button>
      </div>
    )
  }

  const handleDeletePlaylist = async () => {
    if (!window.confirm('Delete this playlist?')) return
    await deletePlaylist(playlist.id)
    navigate('/playlists')
  }

  return (
    <div className="page-enter">
      <div className="bg-surface rounded-2xl p-5 mb-4">
        <button onClick={() => navigate('/playlists')} className="text-fg-muted text-xs hover:text-fg mb-3 flex items-center gap-1 transition-colors">
          <i className="bi bi-arrow-left" /> Playlists
        </button>
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-medium text-fg mb-0.5 truncate">{playlist.name}</h2>
            <p className="text-fg-muted text-sm">{displayTracks.length} track{displayTracks.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleDeletePlaylist}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-fg-faint hover:text-red-400 transition-colors"
            aria-label="Delete playlist"
          >
            <i className="bi bi-trash3 text-sm" />
          </button>
        </div>
      </div>

      <section className="bg-surface rounded-2xl p-5 mb-4">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="w-full flex justify-between items-center text-left"
        >
          <h3 className="text-sm font-medium text-fg">Add tracks</h3>
          <i className={`bi ${pickerOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-fg-faint text-xs`} />
        </button>

        {pickerOpen && (
          <div className="mt-3 max-h-56 overflow-y-auto">
            {availableTracks.length === 0 ? (
              <p className="text-fg-muted text-sm py-3">
                {tracks.length === 0 ? 'Your library is empty.' : 'Every track is already in this playlist.'}
              </p>
            ) : (
              <div className="flex flex-col">
                {availableTracks.map((track) => (
                  <div key={track.id} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-surface-hover transition-colors">
                    <div className="min-w-0 mr-3">
                      <div className="text-sm text-fg truncate">{track.title}</div>
                      <div className="text-fg-faint text-xs truncate">{track.artist}</div>
                    </div>
                    <button
                      onClick={() => addTrackToPlaylist(playlist.id, track.id)}
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-accent hover:bg-accent-soft transition-colors"
                      aria-label={`Add ${track.title}`}
                    >
                      <i className="bi bi-plus-lg text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-surface rounded-2xl p-5">
        {displayTracks.length === 0 ? (
          <p className="text-fg-muted text-sm text-center py-8">This playlist is empty.</p>
        ) : (
          <div className="group">
            {displayTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isActive={currentTrack?.id === track.id}
                onPlay={onPlay}
                onDelete={(trackId) => removeTrackFromPlaylist(playlist.id, trackId)}
                deleteIcon="bi-dash-circle"
                deleteLabel="Remove from playlist"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function Playlists({ tracks, currentTrack, onPlay }) {
  const navigate = useNavigate()
  return <PlaylistList tracks={tracks} onNavigate={navigate} />
}

export { PlaylistDetail }
