# Echo Music Player — Full Rewrite: React + Vite + Tailwind CSS

## Goal
Rewrite this project from plain HTML/CSS/JS into a React app (using Vite as the
build tool), styled with Tailwind CSS, using Bootstrap Icons (CDN, icon font only —
NOT the full Bootstrap framework) for all icons/SVGs. Keep the existing Supabase
backend integration — port the logic into React, don't rebuild it from scratch.

## Project setup
- Scaffold a new Vite + React project (`npm create vite@latest . -- --template react`
  or equivalent) in this repo, replacing the old plain HTML/CSS/JS structure.
- Install and configure Tailwind CSS for this Vite + React project (following
  Tailwind's official Vite integration steps).
- Add Bootstrap Icons via CDN link in `index.html`'s `<head>`:
  `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">`
  Do NOT install or link the full Bootstrap CSS/JS framework — only the icon
  font. Use icons like `<i className="bi bi-play-fill"></i>` directly in JSX.

## What to remove
- Delete all old plain HTML files (`player-v3.html`, `player.html`, old
  `index.html` placeholder, `login-and-signup/` folder if still present).
- Delete old vanilla JS files once their logic has been ported into React
  components/hooks (see below) — don't leave duplicate dead code.

## What to port (not rebuild) into React
- Port the existing Supabase Storage + database logic (upload, list tracks,
  delete track, signed URL generation, `storage_bytes_used` tracking) from
  `js/supabase-client.js` / `js/echo-api.js` into a React hook, e.g.
  `useTracks()` or a small `lib/supabase.js` + `hooks/useLibrary.js` split.
  The underlying Supabase calls should stay functionally the same — only the
  wiring changes to fit React's data flow.
- Keep using Supabase anonymous auth (or the fixed placeholder user approach)
  from the previous pass — still no login/signup UI.
- Keep `js/env.js` generation via `scripts/write-env.js` and Vercel env vars
  (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) — adapt the build script if needed so
  it still writes the config in a way the new Vite app can read (e.g. via
  `import.meta.env` and a `.env` file generated at build time, following
  Vite's standard env variable conventions — `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` as the naming convention Vite expects).

## Component structure (suggested)
- `App.jsx` — top-level layout
- `components/NowPlaying.jsx` — track title (serif), artist, progress bar
- `components/PlayerControls.jsx` — play/pause, skip, using Bootstrap Icons
- `components/UploadZone.jsx` — drag-and-drop + file picker upload
- `components/Library.jsx` — list of uploaded tracks
- `components/TrackRow.jsx` — one row in the library (title, duration, delete
  icon button)
- `hooks/useLibrary.js` — Supabase data fetching/mutations (list, upload,
  delete, storage tracking)
- `hooks/useAudioPlayer.js` — play/pause/seek state and the underlying
  `<audio>` element control

## Design system to apply with Tailwind
### Colors (define as Tailwind theme extensions, not one-off hex values in JSX)
- `background`: #FAF7F1
- `panel`: #EFE9DE
- `border`: #DDD4C4
- `text-primary`: #4A443A
- `text-secondary`: #8C8272
- `accent`: #B5623E — used ONLY for: the play/pause icon while playing, the
  progress bar fill, and the upload-success confirmation. Nowhere else.

### Type
- Serif font (Fraunces or Lora via Google Fonts) for the now-playing track
  title only — configure as a Tailwind `fontFamily.serif` override.
- Sans font (Inter or system-ui) for everything else — default Tailwind sans.
- No all-caps labels, no letter-spaced eyebrows.

### Layout
- Centered single column, max width ~600-700px (`max-w-2xl` or similar),
  generous padding/whitespace.
- Panels distinguished by background color only (`bg-panel` on `bg-background`)
  — no shadows, no border-radius-everything card kit.
- Order top to bottom: now-playing display → playback controls → upload zone
  → library list.

### Motion
- Progress bar fill transitions smoothly (Tailwind `transition-all` or a CSS
  transition on width/transform) using the accent color.
- Brief, quiet upload-success confirmation (fade in/out) using the accent
  color — no other animations, no hover effects on every element.

## Core functionality (must work end to end after rewrite)
1. Upload audio file(s) via drag-and-drop or file picker → Supabase Storage +
   `tracks` row + `storage_bytes_used` update.
2. Library list renders from the `tracks` table, re-renders correctly when
   tracks are added/deleted (this is the part React should make cleaner than
   the old vanilla JS version).
3. Clicking a track plays it via a signed URL; now-playing display updates.
4. Play/pause and working seek/progress bar.
5. Delete a track (Storage + DB row removed, `storage_bytes_used` decremented,
   list updates immediately).

## Non-goals for this pass
- No login/signup UI.
- No Spotify import.
- No subscription/payment UI or enforcement.

## Vercel deployment changes needed
- Framework Preset in Vercel project settings needs to change from "Other" to
  "Vite".
- Build Command becomes the standard Vite build (`npm run build`, which Vite
  sets up by default).
- Output Directory changes to `dist` (Vite's default output folder) instead
  of the repo root.
- Confirm environment variables in Vercel are exposed correctly for Vite
  (must be prefixed `VITE_` to be accessible in client code — rename
  `SUPABASE_URL`/`SUPABASE_ANON_KEY` to `VITE_SUPABASE_URL`/
  `VITE_SUPABASE_ANON_KEY` in both the Vercel settings and the code that reads
  them).
- After rewriting, confirm the app still deploys cleanly and the live site
  loads the new React app at the root URL with no leftover placeholder pages.
