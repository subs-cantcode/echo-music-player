# Echo Music Player — Rebuild From Scratch (Core Player Only)

## Goal
Strip this project back to just the core music player experience, rebuilt with a new,
intentional UI. No login/signup for now. Keep the existing Supabase backend
integration (storage + database) — reuse it, don't rebuild it.

## What to remove
- Delete the `login-and-signup/` folder entirely (login.html, signup.html).
- Remove any code in `player-v3.html` (or wherever it lives after rebuild) that
  checks for a logged-in session or redirects to a login page. The player should
  load directly with no auth gate.
- Delete the old root `index.html` placeholder content ("Ignite: Set the Spark
  with your favourite Music" demo page) — it's not used anymore.
- Remove the old IndexedDB-based storage code entirely if any of it still
  remains (`openDatabase`, `TRACK_STORE`, etc.) — Supabase Storage replaces it.

## What to keep
- Keep `js/supabase-client.js` and `js/echo-api.js` (or equivalent) — the
  Supabase Storage upload/list/delete functions and the `tracks` /
  `storage_bytes_used` tracking logic already built. Reuse these functions in
  the new UI rather than rewriting the backend calls.
- Keep `js/env.js` (gitignored, generated at build time) and the Vercel build
  script (`scripts/write-env.js`) as-is.
- Since there's no login now, tracks should be associated with an anonymous
  Supabase session (use Supabase's anonymous auth, or a single fixed
  placeholder user ID if anonymous auth isn't already set up) so the existing
  per-user database schema still works without requiring real signup.

## Rebuild the UI from scratch with this design system

### Colors
- Background: #FAF7F1 (warm off-white)
- Panels/cards: #EFE9DE (one step darker than background — used for the
  upload area and library list container)
- Borders/dividers: #DDD4C4 (subtle, barely visible)
- Primary text: #4A443A (warm dark taupe, not black)
- Secondary text (metadata, durations): #8C8272
- Accent (used ONLY for: play/pause icon while playing, progress bar fill,
  upload success confirmation): #B5623E
- Do not introduce any other colors. The accent's rarity is the point —
  everything else stays neutral so the accent reads as "this is active."

### Type
- One serif font (Fraunces or Lora, loaded from Google Fonts) for the
  now-playing track title only — this is the one place personality shows.
- One sans font (Inter or system-ui) for everything else: buttons, labels,
  library list rows, metadata.
- No all-caps labels. No tracked-out letter-spacing on eyebrows/labels.

### Layout
- Centered single column, generous whitespace, max content width around
  600-700px. Not a dashboard/grid layout.
- Structure top to bottom: now-playing display (track title in serif, artist
  in sans secondary text, progress bar), playback controls (play/pause, skip),
  upload area (drag-and-drop zone), library list below.
- Panels are distinguished by background-tone shift only (#EFE9DE on #FAF7F1)
  — no drop shadows, no rounded-card-kit look with borders everywhere.

### Motion
- The progress bar fill transitions smoothly as the track plays, using the
  accent color.
- A brief, quiet success confirmation (fade or checkmark, using the accent
  color) after a successful upload.
- No other animations. No hover effects on every element, no scattered
  fade-in-on-scroll — motion only responds to something happening (play
  progressing, upload completing).

## Core functionality (must work end to end)
1. Upload one or more audio files via drag-and-drop or file picker → goes to
   Supabase Storage, creates a row in `tracks`, updates `storage_bytes_used`.
2. Library list shows all uploaded tracks (title, artist if available,
   duration) pulled from the `tracks` table.
3. Clicking a track plays it (streamed via a signed URL from Supabase
   Storage) and shows it in the now-playing display.
4. Play/pause and a working progress bar/seek.
5. Delete a track (removes from Storage + `tracks` table, decrements
   `storage_bytes_used`).

## Non-goals for this pass
- No login/signup — anonymous/single-user access only for now.
- No Spotify import.
- No subscription/payment enforcement (storage tracking exists in the DB
  already, but don't build any UI or blocking logic around limits yet).

## After rebuilding
- Make sure the app still deploys cleanly on Vercel with the existing build
  command (`npm run build`) and environment variables (`SUPABASE_URL`,
  `SUPABASE_ANON_KEY`).
- Confirm the root `/` now serves the new player directly, not a placeholder
  or a login redirect.
