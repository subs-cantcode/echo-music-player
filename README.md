# Echo Music Player

![CI](https://github.com/subs-cantcode/echo-music-player/actions/workflows/test.yml/badge.svg)

A local-first personal music player. Import audio files from your device, browse and play them
from a clean, minimal interface.

**Nothing leaves your device.** Tracks, playlists, and listening history are stored in the browser
(IndexedDB + localStorage). There are no accounts, no server, and no uploads.

Built with **React + Vite**, styled with **Tailwind CSS**, using **Bootstrap Icons** (icon font only,
via CDN).

## How data is stored

| Data | Where | Notes |
| --- | --- | --- |
| Tracks (audio file + metadata) | IndexedDB (`echo-local`) | The `File` object is stored directly |
| Playlists | IndexedDB (`echo-local`) | References tracks by id |
| Listening history | localStorage (`echoHistory`) | Capped at 1000 entries |
| Theme | localStorage (`echo-theme`) | |
| Playback URLs | In memory | Object URLs are regenerated from stored files on each load |

Because storage is per browser and per origin, your library lives wherever you imported it.

## Getting started

```bash
npm install
npm run dev
```

The first visit seeds a handful of demo tracks (silent audio) so the library isn't empty. They can
be removed with **Settings → Clear all data**, which also clears the library and history.

## Build & deploy

```bash
npm run build    # outputs to dist/
npm run preview
```

The deployment is fully static. `vercel.json` sets the SPA rewrite so client-side routes resolve to
`index.html`. No environment variables are required.

## Project layout

```
src/
├── main.jsx                    # Initializes the local library, then mounts the app
├── App.jsx                     # Layout, routing, player state
├── lib/
│   ├── indexedDB.js            # Low-level IndexedDB schema/connection
│   ├── localLibrary.js         # All local data operations (tracks, playlists, history)
│   ├── LibraryContext.jsx      # Shares one library instance across the app
│   └── ThemeContext.jsx        # Light/dark theme
├── hooks/
│   ├── useLocalLibrary.js      # React state wrapper over localLibrary
│   └── useAudioPlayer.js       # HTML5 Audio playback, volume, seek, history logging
├── components/                 # Sidebar, player bar, track rows, upload zone, etc.
└── pages/                      # Home, Search, Playlists, Favourites, Upload, Settings
```
