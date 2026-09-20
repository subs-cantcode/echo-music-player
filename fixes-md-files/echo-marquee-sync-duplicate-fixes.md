# Fix: Player Bar Marquee Glitch, Metadata Sync Bug, Add Duplicate Import Check

Three separate issues, fix independently.

---

## 1. Player Bar Title Appears Frozen/Cut Off (Not Actually Overflowing)

### Symptom

Track titles in the player bar (e.g. "Electric Feel", "Ocean Avenue" — both short, clearly fit the space) show up cut off at the start (missing first letters) and static/frozen, not animating.

### Root Cause

The player bar's title element almost certainly re-renders very frequently — every `timeupdate` tick from the audio element (multiple times per second, for the progress bar). If the CSS marquee animation is applied directly to an element that re-renders that often, React may be re-creating or reflowing that DOM node constantly, which **restarts the CSS animation on every render** before it can visibly progress. The result looks exactly like this: a text element permanently stuck a few frames into its animation cycle, never completing a scroll, never resetting to a clean starting position.

The reason short names ("Electric Feel") are affected too: it's likely the player bar's title was never updated with the conditional `useTextOverflow` check we added to `TrackRow.jsx` earlier — it's still applying the marquee class unconditionally (or applying `overflow:hidden` + `text-overflow: clip` without checking if the text actually overflows), so even names that fit fine get treated as overflowing.

### Fix

**Step A — Isolate the title from frequent re-renders.**

In `src/components/NowPlayingBar.jsx` (or wherever the player bar's title lives), extract the title into its own small component and wrap it in `React.memo`, so it only re-renders when the actual track changes — not on every `currentTime` tick:

```jsx
import React from 'react';
import { useTextOverflow } from '../hooks/useTextOverflow';

const NowPlayingTitle = React.memo(({ title }) => {
  const { elementRef, isOverflowing } = useTextOverflow();

  return (
    <p
      ref={elementRef}
      className={`now-playing-title ${isOverflowing ? 'marquee' : ''}`}
    >
      {title}
    </p>
  );
});

export default NowPlayingTitle;
```

Use it in the player bar like:

```jsx
<NowPlayingTitle title={currentTrack?.title || 'No track'} />
```

**Important:** `NowPlayingTitle` must ONLY receive `title` as a prop — do not pass `currentTime`, `duration`, or any frequently-changing value into it or its parent chain in a way that forces it to re-render on every tick. If the parent component (the whole player bar) re-renders every tick, `React.memo` on the child prevents wasted re-renders only if the prop value (`title`) is unchanged — verify with React DevTools Profiler if unsure.

**Step B — Apply the same conditional overflow logic used in TrackRow.**

Reuse the exact `useTextOverflow` hook already built for `TrackRow.jsx` and `PlaylistCard.jsx` — do not create a separate implementation. Same CSS classes (`.marquee`) should apply consistently:

```css
.now-playing-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.now-playing-title.marquee {
  animation: marquee 8s linear infinite;
  text-overflow: clip;
}
```

### Testing

- ✅ Short titles ("Electric Feel", "Ocean Avenue") display fully, static, no cut-off, no animation
- ✅ Long titles that genuinely overflow the player bar's width animate smoothly and continuously (not stuck/frozen)
- ✅ Marquee does not restart or glitch while the song is playing and progress bar is updating

---

## 2. Metadata Edit Doesn't Apply Everywhere

### Symptom

After editing a track's metadata (via the Edit Metadata modal), the new title shows in the player bar, but the track list ("Your Library") still shows the old title — or vice versa. The update isn't reaching every place the track is displayed.

### Root Cause (likely)

Multiple components are each holding their own separate reference to "the current track" instead of all deriving it from the single shared `tracks` array in `useLocalLibrary`. When `updateTrackMetadata` updates the shared array, only components that re-derive their display value **from that array by track ID** will reflect the change. Any component holding a locally cached copy of the track object (set once, e.g., at play-time, and never refreshed) will keep showing stale data.

### Fix

**Audit every place a track's title/artist/album is displayed** — at minimum: `TrackRow.jsx`, `PlaylistCard.jsx`, `NowPlayingBar.jsx`, the Now Playing screen, and the Home page's "Continue Listening" section.

For each one, confirm the displayed value is derived like this:

```javascript
// CORRECT — always looks up the current version from the shared tracks array
const track = tracks.find(t => t.id === trackId);
```

NOT like this:

```javascript
// WRONG — a copy captured once, goes stale after edits
const [cachedTrack, setCachedTrack] = useState(initialTrack);
```

**Specifically check `useAudioPlayer.js` / wherever `currentTrack` is derived:**

```javascript
// This should be a derived value, recomputed from the live tracks array,
// not a separate piece of state that only gets set once when playback starts.
const currentTrack = tracks[currentTrackIndex] || null;
```

If `currentTrack` is instead its own `useState` that gets set once on `play()` and never updated again, that's the bug — replace it with a derived lookup (as above) so it automatically reflects the latest data whenever `tracks` updates, including after a metadata edit.

**Also verify `updateTrackMetadata` in `useLocalLibrary.js`** replaces the object immutably (new array, new object reference) so React actually detects the change and re-renders subscribed components:

```javascript
setTracks(prev =>
  prev.map(t => (t.id === trackId ? updatedTrackFromIndexedDB : t))
);
```

### Testing

- ✅ Edit a track's title/artist while it's the currently playing track → player bar AND library list both update immediately, in sync
- ✅ Edit a track's title/artist while it's NOT currently playing → library list, any playlist containing it, and favourites all show the new value
- ✅ Refresh the page after editing → the new metadata persists (confirms it was actually saved to IndexedDB, not just local component state)

---

## 3. Add Duplicate File Detection on Import

### Goal

When importing a file whose name/title+artist matches an existing track already in the library, show a confirmation dialog before adding it, instead of silently creating a duplicate.

### Implementation

**In `src/lib/localLibrary.js`, add a duplicate-check helper:**

```javascript
export const findPotentialDuplicate = (tracks, fileName, extractedTitle, extractedArtist) => {
  const normalizedFileName = fileName.replace(/\.[^/.]+$/, '').toLowerCase().trim();

  return tracks.find(t => {
    const titleMatch =
      (extractedTitle && t.title.toLowerCase().trim() === extractedTitle.toLowerCase().trim()) ||
      t.title.toLowerCase().trim() === normalizedFileName;

    const artistMatch =
      !extractedArtist || t.artist.toLowerCase().trim() === extractedArtist.toLowerCase().trim();

    return titleMatch && artistMatch;
  }) || null;
};
```

**In `src/components/UploadZone.jsx`, check before adding each file:**

```javascript
import { extractMetadata } from '../lib/extractMetadata';
import { findPotentialDuplicate } from '../lib/localLibrary';

const [duplicateConfirm, setDuplicateConfirm] = useState(null);
// duplicateConfirm shape: { file, metadata, existingTrack } | null

const processFile = async (file) => {
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

  const existingTrack = findPotentialDuplicate(
    tracks,
    file.name,
    extracted.title,
    extracted.artist
  );

  if (existingTrack) {
    // Pause and ask the user instead of auto-adding
    setDuplicateConfirm({ file, metadata, existingTrack });
    return;
  }

  await addTrack(file, metadata);
};

const handleConfirmDuplicateAdd = async () => {
  if (!duplicateConfirm) return;
  await addTrack(duplicateConfirm.file, duplicateConfirm.metadata);
  setDuplicateConfirm(null);
};

const handleCancelDuplicateAdd = () => {
  setDuplicateConfirm(null);
};
```

**Duplicate confirmation dialog component:**

```jsx
{duplicateConfirm && (
  <div className="modal-overlay">
    <div className="modal-content duplicate-confirm">
      <h3>This song might already be in your library</h3>
      <p>
        "{duplicateConfirm.metadata.title}" by {duplicateConfirm.metadata.artist} looks like it already exists in Echo.
      </p>
      <p className="text-fg-muted">
        Your original file hasn't been touched — this only affects what gets added to your library.
      </p>
      <div className="modal-actions">
        <button onClick={handleCancelDuplicateAdd} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={handleConfirmDuplicateAdd} className="btn btn-primary">
          Add anyway
        </button>
      </div>
    </div>
  </div>
)}
```

Follow the same respectful-UX tone as the rest of Echo (per the spec's "Respectful UX" section) — no alarming language, no red/error styling, just a calm confirmation.

**For multi-file imports:** process files one at a time (await each), so if file 3 of 10 triggers a duplicate confirmation, the import pauses on that one dialog rather than silently skipping or batch-flagging all of them at once. Simpler to reason about and matches how a careful, respectful import flow should behave.

### Testing

- ✅ Importing a file that matches an existing track's title+artist (or filename) triggers the confirmation dialog
- ✅ Clicking "Cancel" does not add the track
- ✅ Clicking "Add anyway" adds it as a genuinely separate track (its own ID, not merged with the existing one)
- ✅ Importing a file with no matching title/artist imports normally, no dialog
- ✅ Multi-file import handles duplicates one at a time without breaking the rest of the batch

---

## Do NOT Change

- Do not modify the Edit Metadata modal's fields or layout (already fixed separately)
- Do not change the marquee logic for track rows or playlist cards — only fix the player bar's title
- Do not add a "skip duplicates automatically" setting — always ask, per the spec's respectful/non-destructive UX principle
