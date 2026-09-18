# Echo Local-First Refactor: Full Implementation

## Context

You're refactoring Echo from a Supabase-backed cloud player to a fully local-first player. Audio files and library data stay on the user's device only. No accounts, no server, no uploads.

The workspace snapshot is in your project root (workspace-snapshot.md). Read the current structure first.

---

## Architecture Changes

### New Data Layer (replaces api.js and Supabase)

Create `src/lib/localLibrary.js`:
- Manages IndexedDB for library metadata (tracks, playlists)
- Handles in-memory state with localStorage persistence for settings
- No server calls, no auth, no file uploads
- File references use browser File API + object URLs

### Data Shape

**Tracks table (IndexedDB)**
```javascript
{
  id: "uuid or generated ID",
  file: File object (from input),
  title: string,
  artist: string,
  album: string,
  duration: number (seconds),
  genre: string,
  year: number,
  isFavourite: boolean,
  dateAdded: ISO timestamp,
  lastPlayed: ISO timestamp or null,
  playCount: number,
  objectUrl: string (blob URL from File)
}
```

**Playlists table (IndexedDB)**
```javascript
{
  id: "uuid or generated ID",
  name: string,
  description: string,
  trackIds: [array of track IDs],
  dateCreated: ISO timestamp,
  coverImage: string (base64 or data URL from first track artwork, optional)
}
```

**Listening history (localStorage, JSON)**
```javascript
{
  sessionHistory: [
    {
      trackId: string,
      playedAt: ISO timestamp,
      duration: number (how long they listened, seconds)
    }
  ]
}
```

---

## Files to Create

### 1. `src/lib/indexedDB.js` — Low-level IndexedDB setup

```javascript
// Initialize IndexedDB with proper schema
export const initDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('echo-local', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('tracks')) {
        const tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
        tracksStore.createIndex('dateAdded', 'dateAdded', { unique: false });
        tracksStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
        tracksStore.createIndex('playCount', 'playCount', { unique: false });
      }

      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
    };
  });
};

export const getDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('echo-local', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};
```

### 2. `src/lib/localLibrary.js` — All local data operations

```javascript
import { initDB, getDB } from './indexedDB';
import { v4 as uuidv4 } from 'uuid';

let db = null;

// Initialize on app start
export const initializeLibrary = async () => {
  db = await initDB();
  await loadDemoDataIfEmpty();
};

// Track operations
export const addTrack = async (file, metadata = {}) => {
  if (!db) db = await getDB();

  const objectUrl = URL.createObjectURL(file);
  const track = {
    id: uuidv4(),
    file,
    objectUrl,
    title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
    artist: metadata.artist || 'Unknown Artist',
    album: metadata.album || 'Unknown Album',
    duration: metadata.duration || 0,
    genre: metadata.genre || 'Uncategorized',
    year: metadata.year || new Date().getFullYear(),
    isFavourite: false,
    dateAdded: new Date().toISOString(),
    lastPlayed: null,
    playCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');
    const request = store.add(track);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(track);
  });
};

export const getAllTracks = async () => {
  if (!db) db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks'], 'readonly');
    const store = transaction.objectStore('tracks');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getTrackById = async (trackId) => {
  if (!db) db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks'], 'readonly');
    const store = transaction.objectStore('tracks');
    const request = store.get(trackId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteTrack = async (trackId) => {
  if (!db) db = await getDB();

  const track = await getTrackById(trackId);
  if (track && track.objectUrl) {
    URL.revokeObjectURL(track.objectUrl);
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');
    const request = store.delete(trackId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const toggleFavourite = async (trackId) => {
  if (!db) db = await getDB();

  const track = await getTrackById(trackId);
  if (!track) return null;

  track.isFavourite = !track.isFavourite;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');
    const request = store.put(track);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(track);
  });
};

// Playlist operations
export const createPlaylist = async (name, description = '', trackIds = []) => {
  if (!db) db = await getDB();

  const playlist = {
    id: uuidv4(),
    name,
    description,
    trackIds,
    dateCreated: new Date().toISOString(),
    coverImage: null,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.add(playlist);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(playlist);
  });
};

export const getAllPlaylists = async () => {
  if (!db) db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readonly');
    const store = transaction.objectStore('playlists');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getPlaylistById = async (playlistId) => {
  if (!db) db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readonly');
    const store = transaction.objectStore('playlists');
    const request = store.get(playlistId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const deletePlaylist = async (playlistId) => {
  if (!db) db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.delete(playlistId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const addTrackToPlaylist = async (playlistId, trackId) => {
  if (!db) db = await getDB();

  const playlist = await getPlaylistById(playlistId);
  if (!playlist) return null;

  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.put(playlist);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(playlist);
  });
};

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
  if (!db) db = await getDB();

  const playlist = await getPlaylistById(playlistId);
  if (!playlist) return null;

  playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['playlists'], 'readwrite');
    const store = transaction.objectStore('playlists');
    const request = store.put(playlist);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(playlist);
  });
};

// Listening history
export const logPlay = (trackId, duration = 0) => {
  const history = JSON.parse(localStorage.getItem('echoHistory') || '[]');
  history.push({
    trackId,
    playedAt: new Date().toISOString(),
    duration,
  });

  if (history.length > 1000) {
    history.shift();
  }

  localStorage.setItem('echoHistory', JSON.stringify(history));
};

export const getListeningHistory = () => {
  return JSON.parse(localStorage.getItem('echoHistory') || '[]');
};

export const clearAllData = async () => {
  if (!db) db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['tracks', 'playlists'], 'readwrite');
    transaction.objectStore('tracks').clear();
    transaction.objectStore('playlists').clear();

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      localStorage.removeItem('echoHistory');
      resolve();
    };
  });
};

// Demo data
const DEMO_TRACKS = [
  {
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    duration: 244,
    genre: 'Synth-pop',
    year: 2011,
  },
  {
    title: 'Electric Feel',
    artist: 'MGMT',
    album: 'Oracular Spectacular',
    duration: 206,
    genre: 'Psychedelic Pop',
    year: 2007,
  },
  {
    title: 'Take On Me',
    artist: 'a-ha',
    album: 'Hunting High and Low',
    duration: 225,
    genre: 'Synth-pop',
    year: 1985,
  },
  {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    genre: 'Synthwave',
    year: 2019,
  },
  {
    title: 'Ocean Avenue',
    artist: 'Yellowcard',
    album: 'Ocean Avenue',
    duration: 240,
    genre: 'Pop Punk',
    year: 2003,
  },
];

const loadDemoDataIfEmpty = async () => {
  const tracks = await getAllTracks();
  if (tracks.length === 0) {
    for (const demoTrack of DEMO_TRACKS) {
      const blob = new Blob([''], { type: 'audio/mp3' });
      const file = new File([blob], `${demoTrack.title}.mp3`, { type: 'audio/mp3' });
      await addTrack(file, demoTrack);
    }
  }
};
```

### 3. `src/hooks/useLocalLibrary.js` — React hook

```javascript
import { useState, useEffect, useCallback } from 'react';
import * as localLib from '../lib/localLibrary';

export const useLocalLibrary = () => {
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const [tracksData, playlistsData] = await Promise.all([
          localLib.getAllTracks(),
          localLib.getAllPlaylists(),
        ]);
        setTracks(tracksData);
        setPlaylists(playlistsData);
      } catch (error) {
        console.error('Failed to load library:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, []);

  const addTrack = useCallback(
    async (file, metadata) => {
      try {
        const newTrack = await localLib.addTrack(file, metadata);
        setTracks(prev => [...prev, newTrack]);
        return newTrack;
      } catch (error) {
        console.error('Failed to add track:', error);
        throw error;
      }
    },
    []
  );

  const deleteTrack = useCallback(
    async (trackId) => {
      try {
        await localLib.deleteTrack(trackId);
        setTracks(prev => prev.filter(t => t.id !== trackId));
      } catch (error) {
        console.error('Failed to delete track:', error);
        throw error;
      }
    },
    []
  );

  const toggleFavourite = useCallback(
    async (trackId) => {
      try {
        const updated = await localLib.toggleFavourite(trackId);
        setTracks(prev =>
          prev.map(t => (t.id === trackId ? updated : t))
        );
      } catch (error) {
        console.error('Failed to toggle favourite:', error);
        throw error;
      }
    },
    []
  );

  const createPlaylist = useCallback(
    async (name, description = '') => {
      try {
        const newPlaylist = await localLib.createPlaylist(name, description);
        setPlaylists(prev => [...prev, newPlaylist]);
        return newPlaylist;
      } catch (error) {
        console.error('Failed to create playlist:', error);
        throw error;
      }
    },
    []
  );

  const deletePlaylist = useCallback(
    async (playlistId) => {
      try {
        await localLib.deletePlaylist(playlistId);
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      } catch (error) {
        console.error('Failed to delete playlist:', error);
        throw error;
      }
    },
    []
  );

  const addTrackToPlaylist = useCallback(
    async (playlistId, trackId) => {
      try {
        const updated = await localLib.addTrackToPlaylist(playlistId, trackId);
        setPlaylists(prev =>
          prev.map(p => (p.id === playlistId ? updated : p))
        );
      } catch (error) {
        console.error('Failed to add track to playlist:', error);
        throw error;
      }
    },
    []
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId, trackId) => {
      try {
        const updated = await localLib.removeTrackFromPlaylist(playlistId, trackId);
        setPlaylists(prev =>
          prev.map(p => (p.id === playlistId ? updated : p))
        );
      } catch (error) {
        console.error('Failed to remove track from playlist:', error);
        throw error;
      }
    },
    []
  );

  const clearAllData = useCallback(
    async () => {
      try {
        await localLib.clearAllData();
        setTracks([]);
        setPlaylists([]);
      } catch (error) {
        console.error('Failed to clear data:', error);
        throw error;
      }
    },
    []
  );

  const logPlay = useCallback((trackId, duration = 0) => {
    localLib.logPlay(trackId, duration);
  }, []);

  const getListeningHistory = useCallback(() => {
    return localLib.getListeningHistory();
  }, []);

  return {
    tracks,
    playlists,
    loading,
    addTrack,
    deleteTrack,
    toggleFavourite,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    clearAllData,
    logPlay,
    getListeningHistory,
  };
};
```

---

## Files to Modify

### 1. Update `src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { initializeLibrary } from './lib/localLibrary';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

initializeLibrary()
  .then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch(err => {
    console.error('Failed to initialize library:', err);
    root.render(<div>Failed to initialize Echo. Please refresh.</div>);
  });
```

### 2. Update `src/App.jsx`

Replace `useLibrary` import:
```javascript
// Change from:
// import { useLibrary } from './hooks/useLibrary';

// To:
import { useLocalLibrary } from './hooks/useLocalLibrary';

// Then use it:
const {
  tracks,
  playlists,
  addTrack,
  deleteTrack,
  toggleFavourite,
  createPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  logPlay,
  getListeningHistory,
} = useLocalLibrary();
```

### 3. Update `src/components/UploadZone.jsx`

Replace Supabase upload logic:
```javascript
const handleUpload = async (files) => {
  if (!files.length) return;

  setIsUploading(true);
  const errors = [];

  for (const file of files) {
    try {
      const metadata = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: 0,
      };

      await addTrack(file, metadata);
    } catch (error) {
      errors.push(`${file.name}: ${error.message}`);
    }
  }

  setIsUploading(false);

  if (errors.length > 0) {
    console.error('Upload errors:', errors);
  }

  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

### 4. Update `src/pages/Settings.jsx`

```javascript
export const Settings = () => {
  const { clearAllData } = useLocalLibrary();

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure? This will delete all your music and playlists from Echo.')) {
      await clearAllData();
    }
  };

  return (
    <div className="settings-page">
      {/* ... existing settings ... */}

      <section>
        <h2>Privacy</h2>
        <p>
          <strong>Your music is yours.</strong>
        </p>
        <p>
          Echo is designed around local music. Your audio files and library stay on your device.
          They are never sent to a server or cloud storage.
        </p>
        <button onClick={handleClearAllData} className="btn btn-danger">
          Clear all data
        </button>
      </section>
    </div>
  );
};
```

### 5. Update `src/hooks/useAudioPlayer.js`

Add listening history logging when track ends:
```javascript
const handleTrackEnd = () => {
  if (currentTrack) {
    const timeListened = currentTime;
    logPlay(currentTrack.id, timeListened);
  }
  // ... rest of end logic
};
```

### 6. Update `package.json`

Add uuid dependency:
```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  }
}
```

Remove Supabase dependency (if not used elsewhere):
```json
// Remove:
"@supabase/supabase-js": "..."
```

### 7. Delete/Remove Files

- `src/lib/supabase.js` — delete
- `src/lib/api.js` — delete or replace with stub

---

## Testing Checklist

- ✅ App loads without errors
- ✅ Demo data appears in library on first visit
- ✅ Import local audio file → appears in Songs list
- ✅ Play audio → plays from object URL
- ✅ Play/pause/skip/volume controls work
- ✅ Add track to playlist → shows in playlist
- ✅ Favourite toggle works and persists on refresh
- ✅ Delete track → removed from library and object URL revoked
- ✅ Delete playlist → playlist removed
- ✅ Search works
- ✅ Refresh page → library still there (IndexedDB persists)
- ✅ Settings: theme toggle works
- ✅ Settings: "Clear all data" button works and clears everything
- ✅ Listening history logged in localStorage
- ✅ Home page shows "Forgotten Echoes" section
- ✅ No Supabase calls in Network tab
- ✅ Settings Privacy shows local-only messaging

---

## Key Points

- **Object URLs** are temporary — regenerated on each refresh from File objects
- **File objects can't be serialized** — must stay in IndexedDB
- **Revoke object URLs** when deleting tracks to prevent memory leaks
- **localStorage** limited to ~5–10 MB (listening history will fit fine)
- **IndexedDB** persists across sessions, per origin
- **No auth, no sign-out** — remove from UserMenu if present