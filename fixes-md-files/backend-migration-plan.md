# Echo Music Player — Backend Migration Plan

## Goal
Replace the current client-only storage (IndexedDB for audio files, localStorage for
"accounts" and metadata) with a real backend, so the app supports actual multi-device
accounts, persistent storage, and (later) subscription-based storage limits.

This plan is scoped to **backend migration only**. Do NOT implement Spotify import or
payment/subscription billing in this pass — just build the foundation those features
will need.

## Current State (for context)
- `player-v3.html` is the main app. All logic is client-side JS.
- Audio files are stored as blobs in IndexedDB (`openDatabase`, `saveTrackRecord`,
  `getAllTrackRecords`, `deleteTrackRecord`, `renameTrackRecord` — search these
  function names to find the relevant code).
- "Accounts" are fake: `signup.html` creates a localStorage namespace keyed by
  username (`echo-player-meta-v1:${userScope}`). No server-side password
  verification exists.
- No backend, no database, no file storage service currently exists.
- Deployment target: Vercel (static hosting currently; will need serverless
  functions or an external backend once this migration is done).

## Target Architecture
Use **Supabase** for auth + database + file storage (single service, minimal new
tools to learn, generous free tier):

- **Supabase Auth** — real email/password (or magic link) signup/login, replacing
  the localStorage-based fake accounts in `signup.html`.
- **Supabase Postgres** — store user profiles, track metadata (title, artist,
  duration, playlist membership, storage bytes used), and playlist definitions.
- **Supabase Storage** — store the actual uploaded audio files (replacing
  IndexedDB blobs), in a bucket scoped per user.

## Tasks (in order)

### 1. Project setup
- Create a Supabase project.
- Add `@supabase/supabase-js` to the project (will need a build step or CDN
  script tag import since the app is currently plain HTML/JS with no bundler).
- Store the Supabase URL and anon key as environment variables; document where
  they need to be set in Vercel's project settings.

### 2. Replace fake auth with Supabase Auth
- Replace `signup.html`'s localStorage signup logic with `supabase.auth.signUp()`.
- Add a login flow using `supabase.auth.signInWithPassword()`.
- Add session handling (`supabase.auth.onAuthStateChange`) so `player-v3.html`
  knows who's logged in instead of reading `CURRENT_USER_KEY` from localStorage.
- Keep the existing UI/UX (same screens, same look) — only swap the storage
  mechanism underneath.

### 3. Database schema
Create these tables in Supabase Postgres:
- `profiles` — id (references `auth.users`), username, storage_bytes_used,
  storage_limit_bytes, created_at.
- `tracks` — id, user_id, title, artist (nullable), file_path (path in Storage
  bucket), duration_seconds, file_size_bytes, created_at.
- `playlists` — id, user_id, name, created_at.
- `playlist_tracks` — playlist_id, track_id, position (join table).

Add row-level security (RLS) policies so users can only read/write their own rows.

### 4. Replace IndexedDB with Supabase Storage
- Create a Storage bucket (e.g. `audio-files`), with RLS so each user can only
  access files under their own `user_id/` folder path.
- Replace `saveTrackRecord()` so uploads go to Supabase Storage instead of
  IndexedDB, and insert a matching row into the `tracks` table with the file
  path and size.
- Replace `getAllTrackRecords()` to query the `tracks` table for the current
  user, then generate signed URLs (or use public URLs if the bucket policy
  allows) for playback.
- Replace `deleteTrackRecord()` and `renameTrackRecord()` to operate against
  Storage + the `tracks` table instead of IndexedDB.
- On each successful upload, update `profiles.storage_bytes_used` (increment by
  file size). On delete, decrement it. This is the foundation the future
  subscription/storage-limit feature will read from — no limit enforcement
  needs to be built yet, just accurate tracking.

### 5. Remove now-dead code
- Remove the IndexedDB functions (`openDatabase`, `getDb`, `deletePlayerDatabase`,
  etc.) once Storage/Postgres versions are working and tested.
- Remove the localStorage-based account logic in `signup.html` once Supabase
  Auth is fully wired in.

## Non-goals for this pass
- Spotify OAuth / playlist import — separate future task.
- Payment integration / subscription enforcement — separate future task
  (this pass only tracks storage usage, it doesn't enforce or charge for limits).
- Migrating existing local IndexedDB data for current users — acceptable to
  treat this as a fresh start; existing local libraries will not carry over
  automatically.

## Acceptance Criteria
- A user can sign up and log in with real credentials (not a fake localStorage
  namespace).
- Uploading a song stores the file in Supabase Storage and a row in `tracks`,
  not in IndexedDB.
- Logging in from a different browser/device shows the same library.
- Deleting/renaming a track updates Supabase, not IndexedDB.
- `profiles.storage_bytes_used` accurately reflects the sum of the user's
  uploaded file sizes after uploads and deletes.
- The app still deploys cleanly to Vercel.
