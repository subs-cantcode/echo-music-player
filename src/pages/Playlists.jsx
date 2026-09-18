import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import TrackRow from '../components/TrackRow.jsx'

function PlaylistList({ onNavigate }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadPlaylists() }, [])

  async function loadPlaylists() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getSession()
      if (!user) return
      const { data } = await supabase
        .from('playlists')
        .select('*, playlist_tracks(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setPlaylists(data || [])
    } catch (err) {
      console.error('Failed to load playlists:', err)
    } finally {
      setLoading(false)
    }
  }

  async function createPlaylist() {
    if (!newName.trim() || creating) return
    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getSession()
      if (!user) return
      await supabase.from('playlists').insert({ name: newName.trim(), user_id: user.id })
      setNewName('')
      await loadPlaylists()
    } catch (err) {
      console.error('Failed to create playlist:', err)
    } finally {
      setCreating(false)
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
          onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
          placeholder="New playlist name..."
          className="flex-1 bg-bg border border-border rounded-xl px-3.5 py-2 text-sm text-fg placeholder:text-fg-faint"
        />
        <button
          onClick={createPlaylist}
          disabled={!newName.trim() || creating}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/85 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          Create
        </button>
      </div>

      {loading ? (
        <p className="text-fg-muted text-sm py-4">Loading...</p>
      ) : playlists.length === 0 ? (
        <p className="text-fg-muted text-sm text-center py-8">No playlists yet. Create one above.</p>
      ) : (
        <div className="flex flex-col">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onNavigate(`/playlists/${pl.id}`)}
              className="flex justify-between items-center py-3 px-2 -mx-2 rounded-lg text-left hover:bg-surface-hover transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-fg truncate">{pl.name}</div>
                <div className="text-fg-faint text-xs">{pl.playlist_tracks?.[0]?.count ?? 0} tracks</div>
              </div>
              <i className="bi bi-chevron-right text-fg-faint text-xs" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PlaylistDetail({ tracks, currentTrack, onPlay }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [playlist, setPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPlaylist() }, [id])

  async function loadPlaylist() {
    setLoading(true)
    try {
      const { data: pl } = await supabase.from('playlists').select('*').eq('id', id).single()
      setPlaylist(pl)
      const { data: pts } = await supabase.from('playlist_tracks').select('track_id, position').eq('playlist_id', id).order('position')
      setPlaylistTracks(pts || [])
    } catch (err) {
      console.error('Failed to load playlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const displayTracks = playlistTracks.map((pt) => tracks.find((t) => t.id === pt.track_id)).filter(Boolean)

  if (loading) return <div className="bg-surface rounded-2xl p-5"><p className="text-fg-muted text-sm">Loading...</p></div>
  if (!playlist) return (
    <div className="bg-surface rounded-2xl p-5">
      <p className="text-fg-muted text-sm">Playlist not found.</p>
      <button onClick={() => navigate('/playlists')} className="mt-2 text-accent text-sm hover:underline">Back to playlists</button>
    </div>
  )

  return (
    <div className="page-enter">
      <div className="bg-surface rounded-2xl p-5 mb-4">
        <button onClick={() => navigate('/playlists')} className="text-fg-muted text-xs hover:text-fg mb-3 flex items-center gap-1 transition-colors">
          <i className="bi bi-arrow-left" /> Playlists
        </button>
        <h2 className="text-xl font-medium text-fg mb-0.5">{playlist.name}</h2>
        <p className="text-fg-muted text-sm">{displayTracks.length} track{displayTracks.length !== 1 ? 's' : ''}</p>
      </div>

      <section className="bg-surface rounded-2xl p-5">
        {displayTracks.length === 0 ? (
          <p className="text-fg-muted text-sm text-center py-8">This playlist is empty.</p>
        ) : (
          <div className="group">
            {displayTracks.map((track) => (
              <TrackRow key={track.id} track={track} isActive={currentTrack?.id === track.id} onPlay={onPlay} onDelete={() => {}} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function Playlists({ tracks, currentTrack, onPlay }) {
  const navigate = useNavigate()
  return <PlaylistList onNavigate={navigate} />
}

export { PlaylistDetail }
