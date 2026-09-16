import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import TrackRow from '../components/TrackRow.jsx'

/* ── Playlist list ── */
function PlaylistList({ onNavigate }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadPlaylists()
  }, [])

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
      await supabase.from('playlists').insert({
        name: newName.trim(),
        user_id: user.id,
      })
      setNewName('')
      await loadPlaylists()
    } catch (err) {
      console.error('Failed to create playlist:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-panel p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold">Playlists</h2>
      </div>

      {/* Create new */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
          placeholder="New playlist name..."
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={createPlaylist}
          disabled={!newName.trim() || creating}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          Create
        </button>
      </div>

      {loading ? (
        <p className="text-text-secondary py-4">Loading…</p>
      ) : playlists.length === 0 ? (
        <p className="text-text-secondary text-center py-8">
          No playlists yet. Create one above.
        </p>
      ) : (
        <div className="flex flex-col">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onNavigate(`/playlists/${pl.id}`)}
              className="flex justify-between items-center py-3 border-t border-border text-left hover:bg-background/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium text-text-primary text-sm truncate">
                  {pl.name}
                </div>
                <div className="text-text-secondary text-xs">
                  {pl.playlist_tracks?.[0]?.count ?? 0} tracks
                </div>
              </div>
              <i className="bi bi-chevron-right text-text-secondary text-sm" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Playlist detail ── */
function PlaylistDetail({ tracks, currentTrack, onPlay }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [playlist, setPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlaylist()
  }, [id])

  async function loadPlaylist() {
    setLoading(true)
    try {
      const { data: pl } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single()
      setPlaylist(pl)

      const { data: pts } = await supabase
        .from('playlist_tracks')
        .select('track_id, position')
        .eq('playlist_id', id)
        .order('position')
      setPlaylistTracks(pts || [])
    } catch (err) {
      console.error('Failed to load playlist:', err)
    } finally {
      setLoading(false)
    }
  }

  // Match playlist track IDs to full track objects from the library
  const displayTracks = playlistTracks
    .map((pt) => tracks.find((t) => t.id === pt.track_id))
    .filter(Boolean)

  if (loading) {
    return (
      <div className="bg-panel p-6">
        <p className="text-text-secondary">Loading…</p>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="bg-panel p-6">
        <p className="text-text-secondary">Playlist not found.</p>
        <button
          onClick={() => navigate('/playlists')}
          className="mt-3 text-accent text-sm hover:underline"
        >
          Back to playlists
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-panel p-6">
        <button
          onClick={() => navigate('/playlists')}
          className="text-text-secondary text-sm hover:text-text-primary mb-3 flex items-center gap-1"
        >
          <i className="bi bi-arrow-left" /> Playlists
        </button>
        <h2 className="font-serif text-2xl font-medium text-text-primary mb-1">
          {playlist.name}
        </h2>
        <p className="text-text-secondary text-sm">
          {displayTracks.length} {displayTracks.length === 1 ? 'track' : 'tracks'}
        </p>
      </div>

      <section className="bg-panel p-6">
        {displayTracks.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            This playlist is empty.
          </p>
        ) : (
          <div className="flex flex-col">
            {displayTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isActive={currentTrack?.id === track.id}
                onPlay={onPlay}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ── Exported wrapper with routing ── */
export default function Playlists({ tracks, currentTrack, onPlay }) {
  const navigate = useNavigate()

  return (
    <PlaylistsInner
      tracks={tracks}
      currentTrack={currentTrack}
      onPlay={onPlay}
      onNavigate={navigate}
    />
  )
}

function PlaylistsInner({ tracks, currentTrack, onPlay, onNavigate }) {
  return (
    <div className="flex flex-col gap-6">
      <PlaylistList onNavigate={onNavigate} />
    </div>
  )
}

export { PlaylistDetail }
