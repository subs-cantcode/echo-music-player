# Echo Music Player — setup

The player uses **Supabase** for accounts, track metadata, playlists, and audio file storage. IndexedDB and localStorage accounts are no longer used.

## 1. Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. In **SQL Editor**, paste and run `supabase/schema.sql`. That creates `profiles`, `tracks`, `playlists`, `playlist_tracks`, RLS policies, storage-usage helpers, and the private `audio-files` bucket.

If the bucket already exists, the insert is a no-op. Confirm in **Storage** that `audio-files` is **private**.

Optional: in **Authentication → Providers → Email**, turn off “Confirm email” while you are testing so signup can enter the player immediately.

## 2. Keys (anon only)

Use the project **URL** and **anon public** key. Never put the **service role** key in this app.

### Local

```bash
copy js\env.example.js js\env.js
```

Fill in `ECHO_SUPABASE_URL` and `ECHO_SUPABASE_ANON_KEY` in `js/env.js`.

### Vercel

In the Vercel project: **Settings → Environment Variables**, add:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `SUPABASE_ANON_KEY` | the anon public key from Supabase **Project Settings → API** |

`npm run build` (`scripts/write-env.js`) writes `js/env.js` from those variables on each deploy. The site stays a static Vercel deployment plus the Supabase backend.

## 3. App entry

- Sign in: `login-and-signup/login.html`
- Sign up: `login-and-signup/signup.html`
- Player: `player-v3.html`

Unauthenticated visits to the player redirect to login.
