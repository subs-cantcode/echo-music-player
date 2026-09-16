# Echo Music Player — setup

The player uses **Supabase** for track metadata and audio file storage. No login required — anonymous access only.

The app is a **React + Vite** build styled with **Tailwind CSS**, using **Bootstrap Icons** (icon font only, via CDN).

## 1. Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. In **SQL Editor**, paste and run `supabase/schema.sql`. That creates `profiles`, `tracks`, `playlists`, `playlist_tracks`, RLS policies, storage-usage helpers, and the private `audio-files` bucket.

If the bucket already exists, the insert is a no-op. Confirm in **Storage** that `audio-files` is **private**.

## 2. Keys (anon only)

Use the project **URL** and **anon public** key. Never put the **service role** key in this app.

### Local

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

(`.env` is gitignored. `npm run dev` picks it up via Vite's standard env handling.)

### Vercel

In the Vercel project: **Settings → Environment Variables**, add:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the anon public key from Supabase **Project Settings → API** |

The Vercel build runs `node scripts/write-env.js && vite build`. `write-env.js` writes a `.env` from those variables (falling back to unprefixed `SUPABASE_URL`/`SUPABASE_ANON_KEY` if present), and Vite inlines them at build time. The deployment is static: Vite outputs to `dist/`, and the app talks to Supabase directly.

## 3. App entry

- Player: `index.html` → `src/main.jsx` → `src/App.jsx` (served at `/`)

No login/signup — the player loads directly with anonymous access.
