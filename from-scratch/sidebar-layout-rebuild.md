# Echo Music Player — Sidebar Navigation Layout

## Goal
Restructure the app from a single-page player into a multi-page layout with a
collapsible sidebar, modeled structurally on Spotify-style dashboards, but
keeping the existing warm/minimal color palette and personality — NOT the dark
theme from the reference images. The references are for LAYOUT STRUCTURE only.

## Sidebar
- Fixed left rail, background color `panel` (#EFE9DE), sitting one tone
  darker than the main content area (`background` #FAF7F1) — no border, no
  shadow, the color shift alone is the separation.
- Nav items, each with a Bootstrap Icon + text label side by side:
  - Home — `bi-house`
  - Search — `bi-search`
  - Playlists — `bi-music-note-list`
  - Favourites — `bi-heart`
  - Settings — `bi-gear`
- Active nav item: icon and text in accent color (#B5623E). Inactive items:
  icon and text in secondary text color (#8C8272). No background highlight
  pill behind the active item — color alone indicates state, keeping this
  quiet rather than busy.
- Collapsible: a single chevron toggle button (`bi-chevron-left` when
  expanded, `bi-chevron-right` when collapsed) placed at the TOP of the
  sidebar, next to the app name/logo — not at the bottom, and not a hamburger
  icon. When collapsed, the sidebar shrinks to icon-only width (icons stay
  visible and centered, labels fade out) rather than disappearing entirely.
  Animate the width/label transition smoothly (200-250ms ease) so
  collapsing/expanding feels deliberate, not abrupt — this matters for the
  "seamless" feel given the product's calm personality.
- Default state on first load: EXPANDED (labels visible). A first-time
  visitor should see what each icon means before choosing to collapse it —
  collapsing is a convenience for a returning/familiar user, not something
  that should hide meaning by default.
- Persist the collapsed/expanded state across page navigation (React context
  or a simple state lifted to `App.jsx` — doesn't need to persist across
  browser sessions, just within one visit).

## Page routing
Add client-side routing (react-router-dom) with these routes:
- `/` or `/home` — Home page
- `/search` — Search page
- `/playlists` — Playlists list page, `/playlists/:id` — one playlist's tracks
- `/favourites` — Favourites page
- `/settings` — Settings page

## Persistent now-playing bar
- Fixed to the bottom of the viewport, visible on every page, so playback
  continues uninterrupted while navigating between sidebar pages.
- Contains: track title (serif) + artist (sans, secondary text), play/pause
  (accent color icon), skip back/forward, progress bar (accent fill), volume.
- This replaces the old centered "hero" now-playing layout from the previous
  single-page version.

## Home page
- "Recently played" — horizontal scroll row of small track cards (title +
  artist), most-recently-played first. Requires tracking a `played_at`
  timestamp on the `tracks` table (or a separate `play_history` table),
  updated each time a track starts playing.
- "Your Library" — full list of the user's uploaded/imported tracks below
  the recently-played row, same track-row component used elsewhere.

## Search page
- A single text input that filters the user's own library by title/artist
  as they type (client-side filter against already-loaded tracks, or a
  Supabase query with `ilike` if the library is large). This searches the
  user's own uploaded tracks only — there is no external music catalog to
  search.

## Playlists
- New `playlists` and `playlist_tracks` tables already exist per the earlier
  schema — build the UI now: a list view (playlist name + track count), a
  "Create playlist" action, and a detail view per playlist showing its
  tracks with the ability to add/remove tracks and rename/delete the
  playlist.

## Favourites
- Add an `is_favourite` boolean column to the `tracks` table (or a join
  table if preferred) and a heart-icon toggle on each track row (filled
  accent-colored heart when favourited, outline when not). The Favourites
  page lists only favourited tracks.

## Settings page
- Show current storage usage (`storage_bytes_used` vs a display of total
  available, even if no real limit is enforced yet) using the existing
  tracking already in place. Just a read-only display — no editable settings
  functionality needs to be built yet.

## Design consistency
- Keep the established palette (background #FAF7F1, panel #EFE9DE, border
  #DDD4C4, text-primary #4A443A, text-secondary #8C8272, accent #B5623E used
  ONLY for active/interactive states as before).
- Keep the serif font (Fraunces/Lora) for track titles in the now-playing bar
  and page headers; sans (Inter/system-ui) everywhere else.
- No drop shadows, no card-with-border kit — panels differentiate by
  background tone shift only, consistent with the rest of the app.
- Transitions (sidebar collapse, page content fade on route change) should be
  smooth and subtle — quick enough to feel responsive, not so fast it feels
  abrupt. This consistency across every interaction is what makes the whole
  app feel like one considered product rather than several bolted-together
  screens.

## Non-goals for this pass
- No music recommendation/curation features ("Made for you" style rows) —
  the references include this, but it implies recommendation logic that
  doesn't exist and isn't needed.
- No login/signup, no Spotify import, no subscription enforcement — still
  out of scope, as in previous passes.
