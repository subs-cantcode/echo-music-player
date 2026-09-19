# Echo UI Refinement: Loop Button, Background, Playlist Views

---

## 1. Loop Button Fix (useAudioPlayer.js)

### Problem
Loop button doesn't cycle through three states (off → loop all → loop single → off). Audio element isn't wired to the loop logic.

### Solution

Add `loopMode` state and wire it to the HTML5 audio element.

**In `src/hooks/useAudioPlayer.js`:**

```javascript
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = (tracks = []) => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loopMode, setLoopMode] = useState('off'); // 'off' | 'track' | 'all'

  const audio = audioRef.current;

  // Update audio src when track changes
  useEffect(() => {
    if (tracks.length === 0) return;

    const track = tracks[currentTrackIndex];
    audio.src = track.objectUrl;

    if (isPlaying) {
      audio.play().catch(err => console.error('Play failed:', err));
    }
  }, [currentTrackIndex, tracks, isPlaying, audio]);

  // Handle loop mode changes
  useEffect(() => {
    if (loopMode === 'track') {
      audio.loop = true;
    } else {
      audio.loop = false;
    }
  }, [loopMode, audio]);

  // Update time on play
  useEffect(() => {
    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, [audio]);

  // Handle track end (for 'all' loop mode)
  useEffect(() => {
    const handleEnded = () => {
      if (loopMode === 'all') {
        if (currentTrackIndex < tracks.length - 1) {
          setCurrentTrackIndex(prev => prev + 1);
        } else {
          // Loop back to first track
          setCurrentTrackIndex(0);
          audio.currentTime = 0;
          audio.play().catch(err => console.error('Play failed:', err));
        }
      } else if (loopMode === 'off') {
        // Move to next track, or stop if at end
        if (currentTrackIndex < tracks.length - 1) {
          setCurrentTrackIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [loopMode, currentTrackIndex, tracks.length, audio]);

  // Load metadata
  useEffect(() => {
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [audio]);

  // Play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Play failed:', err));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audio]);

  // Next track
  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prev =>
      prev < tracks.length - 1 ? prev + 1 : 0
    );
  }, [tracks.length]);

  // Previous track
  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex(prev =>
      prev > 0 ? prev - 1 : tracks.length - 1
    );
  }, [tracks.length]);

  // Seek
  const seek = useCallback((time) => {
    audio.currentTime = time;
    setCurrentTime(time);
  }, [audio]);

  // Volume
  const setPlayerVolume = useCallback((vol) => {
    audio.volume = vol;
    setVolume(vol);
  }, [audio]);

  // Loop toggle (three-state cycle)
  const toggleLoop = useCallback(() => {
    setLoopMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'track';
      return 'off';
    });
  }, []);

  // Log play for listening history
  useEffect(() => {
    const handlePlay = () => {
      // Placeholder: call logPlay from useLocalLibrary when track finishes
      // This will be wired in the component that uses this hook
    };
    audio.addEventListener('play', handlePlay);
    return () => audio.removeEventListener('play', handlePlay);
  }, [audio]);

  const currentTrack = tracks[currentTrackIndex] || null;

  return {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    loopMode,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setPlayerVolume,
    toggleLoop,
  };
};
```

### Update PlayerControls Component

**In `src/components/PlayerControls.jsx`:**

Make sure the loop button shows the current state and calls `toggleLoop`:

```javascript
export const PlayerControls = ({ player }) => {
  const { isPlaying, loopMode, togglePlay, nextTrack, prevTrack, toggleLoop } = player;

  const loopIcon = loopMode === 'off' ? '↻' : loopMode === 'all' ? '↻ (all)' : '↻ (1)';
  const loopActive = loopMode !== 'off';

  return (
    <div className="player-controls">
      <button
        onClick={toggleLoop}
        className={`btn btn-icon ${loopActive ? 'active' : ''}`}
        title={`Loop: ${loopMode}`}
      >
        {loopIcon}
      </button>

      <button onClick={prevTrack} className="btn btn-icon" title="Previous">
        ⏮
      </button>

      <button
        onClick={togglePlay}
        className="btn btn-icon btn-primary"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button onClick={nextTrack} className="btn btn-icon" title="Next">
        ⏭
      </button>

      <button className="btn btn-icon" title="Shuffle">
        🔀
      </button>
    </div>
  );
};
```

**CSS for loop button active state** (add to `src/index.css`):

```css
.player-controls .btn.active {
  background-color: var(--accent-soft);
  color: var(--accent);
  border-color: var(--accent);
}

.player-controls .btn.active::after {
  content: '';
  display: block;
  width: 4px;
  height: 4px;
  background-color: var(--accent);
  border-radius: 50%;
  position: absolute;
  bottom: 4px;
  right: 4px;
}
```

---

## 2. Interactive Background for Home Page

### Component: Soft Floating Particles

**Create `src/components/ParticleBackground.jsx`:**

```javascript
import { useEffect, useRef } from 'react';
import './ParticleBackground.css';

export const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles = [];
    const particleCount = 30;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 60 + 20;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.15 + 0.05;
        this.life = Math.random() * 0.5 + 0.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.0005;

        // Wrap around edges
        if (this.x + this.size < 0) this.x = canvas.width + this.size;
        if (this.x - this.size > canvas.width) this.x = -this.size;
        if (this.y + this.size < 0) this.y = canvas.height + this.size;
        if (this.y - this.size > canvas.height) this.y = -this.size;
      }

      draw(ctx, isDark) {
        const color = isDark ? 'rgba(217, 162, 60,' : 'rgba(196, 138, 42,';
        ctx.fillStyle = `${color} ${this.opacity * this.life})`;

        // Soft blob shape
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Detect dark mode
    const isDarkMode = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ||
             document.documentElement.style.colorScheme === 'dark' ||
             localStorage.getItem('theme') === 'dark';
    };

    // Animation loop
    const animate = () => {
      // Clear canvas (with slight fade for trail effect)
      ctx.fillStyle = isDarkMode() ? 'rgba(22, 20, 18, 0.05)' : 'rgba(248, 246, 241, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p, index) => {
        p.update();
        p.draw(ctx, isDarkMode());

        // Respawn dead particles
        if (p.life <= 0) {
          particles[index] = new Particle();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-background" />;
};
```

**Create `src/components/ParticleBackground.css`:**

```css
.particle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
```

### Update Home Page

**In `src/pages/Home.jsx`:**

```javascript
import { ParticleBackground } from '../components/ParticleBackground';

export const Home = () => {
  return (
    <div className="home-page">
      <ParticleBackground />

      <div className="home-content" style={{ position: 'relative', zIndex: 1 }}>
        <h1>Good evening</h1>
        <p>Welcome back to your space.</p>

        {/* Rest of home content */}
      </div>
    </div>
  );
};
```

**CSS** (add to `src/index.css`):

```css
.home-page {
  position: relative;
  overflow: hidden;
}

.home-content {
  padding: 2rem;
}
```

---

## 3. Playlist View Toggle + Card/List Views

### State & Toggle Component

**Create `src/components/PlaylistViewToggle.jsx`:**

```javascript
export const PlaylistViewToggle = ({ view, onToggle }) => {
  return (
    <div className="playlist-view-toggle">
      <button
        onClick={() => onToggle('card')}
        className={`btn btn-sm ${view === 'card' ? 'active' : ''}`}
        title="Card view"
      >
        ⊞
      </button>
      <button
        onClick={() => onToggle('list')}
        className={`btn btn-sm ${view === 'list' ? 'active' : ''}`}
        title="List view"
      >
        ≡
      </button>
    </div>
  );
};
```

**CSS:**

```css
.playlist-view-toggle {
  display: flex;
  gap: 0.5rem;
}

.playlist-view-toggle .btn.active {
  background-color: var(--accent-soft);
  color: var(--accent);
}
```

### Playlist Card Component

**Create `src/components/PlaylistCard.jsx`:**

```javascript
export const PlaylistCard = ({ playlist, tracks, onPlay, onShuffle }) => {
  // Get first 4 track covers for a grid display, or show music note if empty
  const coverImages = playlist.trackIds
    .slice(0, 4)
    .map(trackId => tracks.find(t => t.id === trackId)?.objectUrl)
    .filter(Boolean);

  return (
    <div className="playlist-card">
      <div className="playlist-card-cover">
        {coverImages.length > 0 ? (
          <div className="cover-grid">
            {coverImages.map((url, idx) => (
              <img key={idx} src={url} alt={`Cover ${idx}`} />
            ))}
          </div>
        ) : (
          <div className="cover-placeholder">♪</div>
        )}
      </div>

      <div className="playlist-card-info">
        <h3 className="playlist-card-name" title={playlist.name}>
          {playlist.name}
        </h3>
        <p className="playlist-card-meta">
          {playlist.trackIds.length} songs
        </p>
      </div>

      <div className="playlist-card-actions">
        <button
          onClick={() => onPlay(playlist.id)}
          className="btn btn-icon btn-sm"
          title="Play"
        >
          ▶
        </button>
        <button
          onClick={() => onShuffle(playlist.id)}
          className="btn btn-icon btn-sm"
          title="Shuffle"
        >
          🔀
        </button>
      </div>
    </div>
  );
};
```

**CSS:**

```css
.playlist-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.playlist-card:hover {
  background-color: var(--surface-hover);
  border-color: var(--border);
}

.playlist-card-cover {
  aspect-ratio: 1;
  background-color: var(--bg);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.playlist-card-cover .cover-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  width: 100%;
  height: 100%;
}

.playlist-card-cover .cover-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-card-cover .cover-placeholder {
  font-size: 3rem;
  color: var(--fg-muted);
  opacity: 0.5;
}

.playlist-card-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  animation: marquee 8s linear infinite paused;
}

.playlist-card:hover .playlist-card-name {
  animation-play-state: running;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

.playlist-card-meta {
  margin: 0;
  font-size: 0.9rem;
  color: var(--fg-muted);
}

.playlist-card-actions {
  display: flex;
  gap: 0.5rem;
}
```

### Playlist Compact List Row

**Create `src/components/PlaylistRow.jsx`:**

```javascript
export const PlaylistRow = ({ playlist, tracks, onPlay, onDelete }) => {
  const trackCount = playlist.trackIds.length;
  const firstTrack = tracks.find(t => t.id === playlist.trackIds[0]);
  const coverUrl = firstTrack?.objectUrl;

  return (
    <div className="playlist-row">
      <div className="playlist-row-cover">
        {coverUrl ? (
          <img src={coverUrl} alt={playlist.name} />
        ) : (
          <div className="cover-placeholder-sm">♪</div>
        )}
      </div>

      <div className="playlist-row-info">
        <h4 className="playlist-row-name">{playlist.name}</h4>
        <p className="playlist-row-meta">{trackCount} songs</p>
      </div>

      <div className="playlist-row-actions">
        <button
          onClick={() => onPlay(playlist.id)}
          className="btn btn-icon btn-xs"
          title="Play"
        >
          ▶
        </button>
        <button
          onClick={() => onDelete(playlist.id)}
          className="btn btn-icon btn-xs"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
```

**CSS:**

```css
.playlist-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: var(--surface);
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.playlist-row:hover {
  background-color: var(--surface-hover);
  border-color: var(--border);
}

.playlist-row-cover {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--bg);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.playlist-row-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder-sm {
  font-size: 1.5rem;
  color: var(--fg-muted);
  opacity: 0.5;
}

.playlist-row-info {
  flex: 1;
  min-width: 0;
}

.playlist-row-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-row-meta {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: var(--fg-muted);
}

.playlist-row-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
```

### Track Compact Row (for inside playlists)

**Create `src/components/TrackRow.jsx`:**

```javascript
export const TrackRow = ({
  track,
  isPlaying,
  onPlay,
  onToggleFavourite,
  onDelete,
}) => {
  return (
    <div className={`track-row ${isPlaying ? 'playing' : ''}`}>
      <div className="track-row-cover">
        {track.objectUrl ? (
          <img src={track.objectUrl} alt={track.title} />
        ) : (
          <div className="cover-placeholder-track">♪</div>
        )}
      </div>

      <div className="track-row-info">
        <p className="track-row-title">{track.title}</p>
        <p className="track-row-artist">{track.artist}</p>
      </div>

      <div className="track-row-duration">
        {Math.floor(track.duration / 60)}:
        {String(track.duration % 60).padStart(2, '0')}
      </div>

      <div className="track-row-actions">
        <button
          onClick={() => onPlay(track.id)}
          className="btn btn-icon btn-xs"
          title="Play"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={() => onToggleFavourite(track.id)}
          className={`btn btn-icon btn-xs ${track.isFavourite ? 'liked' : ''}`}
          title={track.isFavourite ? 'Unlike' : 'Like'}
        >
          ♡
        </button>

        <button
          onClick={() => onDelete(track.id)}
          className="btn btn-icon btn-xs"
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
```

**CSS:**

```css
.track-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: transparent;
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.track-row:hover {
  background-color: var(--surface);
}

.track-row.playing {
  background-color: var(--accent-soft);
}

.track-row-cover {
  width: 40px;
  height: 40px;
  border-radius: 3px;
  overflow: hidden;
  background-color: var(--surface);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-row-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder-track {
  font-size: 1.2rem;
  color: var(--fg-muted);
  opacity: 0.4;
}

.track-row-info {
  flex: 1;
  min-width: 0;
}

.track-row-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-row-artist {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: var(--fg-muted);
}

.track-row-duration {
  font-size: 0.85rem;
  color: var(--fg-muted);
  flex-shrink: 0;
}

.track-row-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.track-row:hover .track-row-actions {
  opacity: 1;
}

.track-row-actions .btn.liked {
  color: var(--accent);
}
```

### Update Playlists Page

**In `src/pages/Playlists.jsx`:**

```javascript
import { useState } from 'react';
import { PlaylistViewToggle } from '../components/PlaylistViewToggle';
import { PlaylistCard } from '../components/PlaylistCard';
import { PlaylistRow } from '../components/PlaylistRow';
import { TrackRow } from '../components/TrackRow';

export const Playlists = () => {
  const { playlists, tracks, createPlaylist, deletePlaylist } = useLocalLibrary();
  const [playlistView, setPlaylistView] = useState('card'); // 'card' or 'list'
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const handlePlay = (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && playlist.trackIds.length > 0) {
      // Play first track in playlist
      // Wire this to your player
    }
  };

  const handleShuffle = (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && playlist.trackIds.length > 0) {
      // Shuffle and play first track
      // Wire this to your player
    }
  };

  if (selectedPlaylist) {
    const playlist = playlists.find(p => p.id === selectedPlaylist);
    if (!playlist) return null;

    const playlistTracks = playlist.trackIds
      .map(trackId => tracks.find(t => t.id === trackId))
      .filter(Boolean);

    return (
      <div className="playlist-detail">
        <button onClick={() => setSelectedPlaylist(null)} className="btn btn-back">
          ← Back
        </button>

        <h2>{playlist.name}</h2>
        <p className="playlist-description">{playlist.description}</p>

        <div className="tracks-list">
          {playlistTracks.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              isPlaying={false}
              onPlay={(trackId) => handlePlay(trackId)}
              onToggleFavourite={(trackId) => {
                // Wire to toggleFavourite
              }}
              onDelete={(trackId) => {
                // Wire to removeTrackFromPlaylist
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="playlists-page">
      <div className="playlists-header">
        <h2>Playlists</h2>
        <PlaylistViewToggle view={playlistView} onToggle={setPlaylistView} />
      </div>

      {playlistView === 'card' ? (
        <div className="playlists-grid">
          {playlists.map(playlist => (
            <div key={playlist.id} onClick={() => setSelectedPlaylist(playlist.id)}>
              <PlaylistCard
                playlist={playlist}
                tracks={tracks}
                onPlay={handlePlay}
                onShuffle={handleShuffle}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="playlists-list">
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              onClick={() => setSelectedPlaylist(playlist.id)}
              style={{ cursor: 'pointer' }}
            >
              <PlaylistRow
                playlist={playlist}
                tracks={tracks}
                onPlay={handlePlay}
                onDelete={deletePlaylist}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**CSS:**

```css
.playlists-page {
  padding: 2rem;
}

.playlists-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.playlists-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.playlist-detail {
  padding: 2rem;
}

.playlist-detail h2 {
  margin-bottom: 0.5rem;
}

.playlist-description {
  color: var(--fg-muted);
  margin-bottom: 2rem;
}

.tracks-list {
  display: flex;
  flex-direction: column;
}
```

---

## Summary of Changes

1. **Loop button** — Now cycles: off → loop all → loop single → off. Shows current mode with visual indicator.
2. **Home background** — Soft floating particles (accent color, subtle opacity). Canvas-based, smooth animation, responsive to theme.
3. **Playlist views** — Toggle between card and list views. Cards show covers + play/shuffle. Lists are compact rows.
4. **Track rows** — Compact display with cover + name/artist + duration + play/favourite/delete buttons. Hover to reveal actions.

All components use your existing design tokens (`--accent`, `--bg`, `--surface`, etc.) and follow the warm/minimal/calm aesthetic.

---

## Files to Create

- `src/components/ParticleBackground.jsx` + `.css`
- `src/components/PlaylistViewToggle.jsx`
- `src/components/PlaylistCard.jsx`
- `src/components/PlaylistRow.jsx`
- `src/components/TrackRow.jsx`
- Update `src/hooks/useAudioPlayer.js`
- Update `src/pages/Playlists.jsx`
