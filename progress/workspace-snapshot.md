# Echo Music Player — Current Workspace Snapshot

**Date:** September 18, 2026
**Branch:** `main`
**Last commit:** `4f0fe0b` — Redesign Echo frontend: minimal, comfortable, smooth interactions

---

## Project Overview

Echo is a local-first personal music player built with React, Vite, Tailwind CSS, and Supabase. It allows users to import, browse, and play local audio files through a clean, minimal interface.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3 |
| Build tool | Vite 5.4 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router DOM 7.18 |
| Backend/DB | Supabase (auth, storage, database) |
| Icons | Bootstrap Icons (CDN) |
| Font | DM Sans (Google Fonts) |
| Deployment | Vercel (static build) |

---

## Directory Structure

```
D:\music-player\
├── .env                          # Supabase credentials (gitignored)
├── .gitignore
├── index.html                    # Entry HTML with theme flash prevention
├── package.json                  # Dependencies and scripts
├── package-lock.json
├── postcss.config.js             # PostCSS with Tailwind + Autoprefixer
├── tailwind.config.js            # Tailwind config with custom design tokens
├── vercel.json                   # Vercel deployment config with SPA rewrites
├── vite.config.js                # Vite config with React plugin
├── README.md                     # Setup documentation
│
├── fixes-md-files/               # Historical fix documentation
│   ├── backend-migration-plan.md
│   ├── setup-local-env.md
│   └── volume-account-retheme.md
│
├── from-scratch/                 # Build prompt and iteration docs
│   ├── dark-mode-and-hover-fix.md
│   ├── Echo_Replit_Build_Prompt.md
│   ├── inline-upload-preview.md
│   ├── rebuild-player-from-scratch.md
│   ├── rewrite-react-tailwind.md
│   └── sidebar-layout-rebuild.md
│
├── images/                       # Static assets
│   ├── echo-logo.png
│   ├── favicon.jpg
│   ├── music.gif
│   ├── reference image/
│   │   ├── ref #1.jpg
│   │   └── ref #2.webp
│   └── svg icons/               # SVG icon set (18 files)
│
├── scripts/
│   └── write-env.js              # Build-time env file writer for Vercel
│
├── src/
│   ├── main.jsx                  # React root with ThemeProvider
│   ├── App.jsx                   # Main layout with routing and player state
│   ├── index.css                 # Global styles, CSS variables, animations
│   │
│   ├── lib/
│   │   ├── ThemeContext.jsx      # Light/Dark theme with localStorage persistence
│   │   ├── api.js                # Supabase API: tracks CRUD, upload, favourites
│   │   └── supabase.js           # Supabase client initialization
│   │
│   ├── hooks/
│   │   ├── useAudioPlayer.js     # HTML5 Audio playback, volume, seek, progress
│   │   └── useLibrary.js         # Track loading, adding, removing, toggling favourite
│   │
│   ├── components/
│   │   ├── Sidebar.jsx           # Collapsible sidebar with nav links
│   │   ├── NowPlayingBar.jsx     # Persistent bottom player bar
│   │   ├── NowPlaying.jsx        # Now playing view + formatTime utility
│   │   ├── PlayerControls.jsx    # Play/pause/skip controls
│   │   ├── TrackRow.jsx          # Individual track list row
│   │   ├── UploadZone.jsx        # Drag-and-drop upload with review/progress
│   │   └── UserMenu.jsx          # Avatar menu with theme toggle and sign out
│   │
│   └── pages/
│       ├── Home.jsx              # Greeting, Continue Listening, Library
│       ├── Search.jsx            # Instant search across tracks
│       ├── Playlists.jsx         # Playlist list + detail view
│       ├── Favourites.jsx        # Favourited tracks
│       ├── Upload.jsx            # Upload page wrapper
│       └── Settings.jsx          # Theme, Privacy, About
│
├── supabase/
│   └── schema.sql                # Database schema (profiles, tracks, playlists, RLS)
│
└── video/                        # Background video assets
    ├── daft-punk-playing-music-moewalls-com.mp4
    └── swiss-background.mp4
```

---

## Design System

### Color Tokens (CSS Variables)

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#F8F6F1` | `#161412` |
| `--surface` | `#EFEBE2` | `#1E1C18` |
| `--surface-hover` | `#E6E1D6` | `#28251F` |
| `--border` | `#DDD6C8` | `#332F28` |
| `--border-subtle` | `rgba(221,214,200,0.5)` | `rgba(51,47,40,0.5)` |
| `--fg` | `#3D3830` | `#EDE6DA` |
| `--fg-muted` | `#8A8072` | `#9A9084` |
| `--fg-faint` | `#B5ADA2` | `#5E574E` |
| `--accent` | `#C48A2A` | `#D9A23C` |
| `--accent-soft` | `rgba(196,138,42,0.1)` | `rgba(217,162,60,0.12)` |

### Typography

- **Font:** DM Sans (300, 400, 500 weights)
- **Antialiasing:** Subpixel antialiased

### Transitions

| Element | Duration | Easing |
|---------|----------|--------|
| Sidebar width | 280ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Nav link hover | 180ms | same |
| Player button | 160ms | same |
| Track row hover | 150ms | same |
| Bar slider thumb | 160ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Page enter | 220ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Heart bounce | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Time-based greeting, recently played, full library |
| `/search` | `Search` | Instant search across all tracks |
| `/playlists` | `Playlists` | Create and browse playlists |
| `/playlists/:id` | `PlaylistDetail` | View playlist tracks |
| `/favourites` | `Favourites` | Favourited tracks |
| `/upload` | `Upload` | Drag-and-drop audio upload |
| `/settings` | `Settings` | Theme, privacy, about |

---

## Backend (Untouched)

The following files are **not modified** in the frontend redesign:

- `src/lib/api.js` — Supabase CRUD operations for tracks, upload, delete, favourite
- `src/lib/supabase.js` — Supabase client initialization
- `src/hooks/useAudioPlayer.js` — HTML5 Audio element control
- `src/hooks/useLibrary.js` — Library state management
- `scripts/write-env.js` — Build-time `.env` file writer
- `supabase/schema.sql` — Database schema and RLS policies

### API Functions (`api.js`)

| Function | Description |
|----------|-------------|
| `getAllTracks()` | Fetch all tracks for current user with signed URLs |
| `uploadTrack(record)` | Upload audio file to Supabase Storage + insert metadata |
| `deleteTrack(trackId)` | Remove track from storage and database |
| `toggleFavourite(trackId)` | Toggle `is_favorite` boolean |

### Supabase Tables

- `profiles` — User profiles (id, username)
- `tracks` — Audio file metadata (title, artist, file_path, duration, favourite)
- `playlists` — User playlists (name, user_id)
- `playlist_tracks` — Playlist-track junction (playlist_id, track_id, position)

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

Both are set in `.env` (local) or Vercel environment variables (production).

---

## Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build    # runs write-env.js + vite build

# Preview production build
npm run preview
```

**Vercel config** (`vercel.json`):
- Build command: `npm install && npm run build`
- Output: `dist/`
- SPA rewrite: all routes → `index.html`

---

## Features Implemented

1. **Import local audio files** — drag-and-drop or file picker
2. **Play/pause/skip** — full playback controls
3. **Volume control** — slider with mute toggle
4. **Progress bar** — seekable with time display
5. **Browse library** — songs list with search
6. **Favourites** — heart toggle per track
7. **Playlists** — create, view, add tracks
8. **Search** — instant filtering by title/artist
9. **Light/Dark theme** — persisted in localStorage
10. **Keyboard shortcut** — Space to toggle play
11. **Recently played** — tracked in session
12. **Upload with review** — preview files before uploading
13. **Responsive sidebar** — collapsible with smooth animation
14. **Respectful UX** — no aggressive prompts, local-first messaging

---

## Git History (Recent)

```
4f0fe0b  Redesign Echo frontend: minimal, comfortable, smooth interactions
1a1d6e0  (previous)
```
