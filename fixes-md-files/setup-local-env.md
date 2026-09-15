# Set up local Supabase environment config

## Task
Create `js/env.js` in the project root (same folder as `js/env.example.js`) with the
following exact contents:

```js
// Generated locally by copying env.example.js, or by `npm run build` / Vercel
// from SUPABASE_URL and SUPABASE_ANON_KEY.
window.ECHO_SUPABASE_URL = 'https://mwbcyhcznxkkgdhadunb.supabase.co';
window.ECHO_SUPABASE_ANON_KEY = 'sb_publishable_DNgYDK9-LbEVzmi8QRimxg_150tcGgX';
```

## Important
- `js/env.js` must already be in `.gitignore` (check this — it should NOT be
  committed to the repo, since it's meant to be generated locally or by the
  Vercel build step). If it's not in `.gitignore`, add it.
- Do NOT commit this file. It's for local testing only. Production (Vercel)
  gets these same values from Environment Variables set in the Vercel project
  settings, not from this file.
- After creating the file, open `login-and-signup/signup.html` (or `index.html`,
  whichever is the actual entry point) locally and confirm the app no longer
  logs "Missing Supabase config" to the console.
