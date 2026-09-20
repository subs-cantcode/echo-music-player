# Auto-Extract Metadata from Imported Audio Files

## Problem

Right now, when a user imports an audio file, Echo uses the filename as the title and defaults artist/album to "Unknown Artist" / "Unknown Album". Most real audio files have this info embedded (ID3 tags for MP3, similar tag formats for other types), including embedded cover art — none of it is being read.

## Goal

When a file is imported, read its embedded metadata (title, artist, album, year, genre, embedded artwork) and use that to populate the track record instead of defaults. Fall back to filename/defaults only when a tag is genuinely missing.

---

## 1. Install the Library

```bash
npm install music-metadata-browser
```

This is a browser-compatible metadata parser (ID3v1/v2, MP4, FLAC, OGG, etc.) that runs entirely client-side — no server involved, fits Echo's local-first constraint.

---

## 2. Create a Metadata Extraction Helper

**Create `src/lib/extractMetadata.js`:**

```javascript
import { parseBlob } from 'music-metadata-browser';

export const extractMetadata = async (file) => {
  try {
    const metadata = await parseBlob(file);
    const common = metadata.common;

    let artworkDataUrl = null;
    if (common.picture && common.picture.length > 0) {
      const picture = common.picture[0];
      const blob = new Blob([picture.data], { type: picture.format });
      artworkDataUrl = await blobToDataUrl(blob);
    }

    return {
      title: common.title || null,
      artist: common.artist || common.albumartist || null,
      album: common.album || null,
      genre: common.genre?.[0] || null,
      year: common.year || null,
      duration: metadata.format.duration || 0,
      artworkDataUrl,
    };
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    // Return nulls so the caller falls back to defaults — don't block import
    return {
      title: null,
      artist: null,
      album: null,
      genre: null,
      year: null,
      duration: 0,
      artworkDataUrl: null,
    };
  }
};

const blobToDataUrl = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
```

---

## 3. Wire It Into the Import Flow

**In `src/components/UploadZone.jsx`**, update the upload handler to extract metadata before adding the track:

```javascript
import { extractMetadata } from '../lib/extractMetadata';

const handleUpload = async (files) => {
  if (!files.length) return;

  setIsUploading(true);
  const errors = [];

  for (const file of files) {
    try {
      const extracted = await extractMetadata(file);

      const metadata = {
        title: extracted.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: extracted.artist || 'Unknown Artist',
        album: extracted.album || 'Unknown Album',
        genre: extracted.genre || 'Uncategorized',
        year: extracted.year || new Date().getFullYear(),
        duration: extracted.duration || 0,
        artwork: extracted.artworkDataUrl || null,
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

---

## 4. Update Track Schema to Store Artwork

**In `src/lib/localLibrary.js`**, make sure `addTrack` accepts and stores the `artwork` field:

```javascript
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
    artwork: metadata.artwork || null, // NEW: base64 data URL or null
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
```

---

## 5. Use `track.artwork` Wherever Cover Art Is Displayed

Anywhere the UI currently shows a music-note placeholder or nothing for cover art (TrackRow, PlaylistCard, NowPlayingBar, Now Playing screen), check for `track.artwork` first:

```jsx
{track.artwork ? (
  <img src={track.artwork} alt={track.title} />
) : (
  <div className="cover-placeholder">♪</div>
)}
```

---

## 6. Handle Files With No Embedded Metadata

Some files (especially ripped/renamed MP3s) have no ID3 tags at all. This is expected and already handled — `extractMetadata` returns `null` for missing fields, and the upload handler falls back to filename/"Unknown Artist"/etc. exactly like it does now. No error should be shown to the user for this case; it's normal, not a failure.

---

## Testing Checklist

- ✅ Import an MP3 with full ID3 tags (title, artist, album, embedded art) → all fields populate correctly, artwork displays
- ✅ Import an MP3 with no tags at all → falls back gracefully to filename/"Unknown Artist", no crash, no error toast
- ✅ Import multiple files at once → each gets its own extracted metadata independently
- ✅ Artwork displays correctly in: track rows, playlist cards, "Continue Listening" card, player bar, Now Playing screen
- ✅ Large embedded artwork doesn't cause noticeable lag on import (a few hundred KB per image is normal and fine)
- ✅ Manually editing metadata afterward (via the Edit Metadata modal) still works and overrides the auto-extracted values

## Do NOT Change

- Do not modify the Edit Metadata modal itself (already fixed separately)
- Do not change IndexedDB schema beyond adding the `artwork` field
- Do not add a UI toggle for this — extraction should happen automatically and silently on every import
