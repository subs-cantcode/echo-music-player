# Echo Music Player — Volume Slider Fix, Sidebar Account Section, Amber Gold Re-theme

## IMPORTANT SCOPE NOTE
Only change what's listed below. Do not modify layout, spacing, component
structure, or any functionality not explicitly mentioned here.

## 1. Volume slider fix
The volume slider currently feels stiff on hover and is hard to grab/drag
accurately. Fix:
- Increase the clickable/draggable hit area of the slider thumb — even if
  the visual thumb stays small, add invisible padding around it (e.g. via a
  larger `::-webkit-slider-thumb` / `::-moz-range-thumb` hit box, or wrap
  the input in a container with extra vertical padding) so it's easier to
  grab with the cursor.
- Add a smooth CSS transition (150-200ms ease) on the thumb's `transform`
  and `box-shadow` for hover/active states, instead of an instant/stiff
  visual snap.
- Make sure dragging the thumb left/right updates the volume smoothly in
  real time (no lag or jumpiness), and the fill portion of the track
  (showing current volume level) animates smoothly alongside it rather than
  jumping in steps.
- Slightly increase the thumb size on hover (subtle scale, e.g. 1.15x) so
  there's clear visual feedback that it's interactive and grabbable.

## 2. Sidebar account section (bottom of sidebar)
Add a small account section fixed to the bottom of the sidebar, below the
nav items:
- A small avatar circle (placeholder initial or generic person icon if no
  avatar image exists) + an editable display name text (default to "Guest"
  if none set — store this in the existing `profiles` table, editable from
  here or from Settings).
- A 3-dot icon (`bi-three-dots-vertical`) to the right of the name, which
  opens a small menu with one option: "Sign out", styled in red
  (`#D64545` in light mode, `#E5726B` in dark mode — a red that stays
  legible and not harsh in both themes) so it's clearly distinguished from
  neutral actions.
- IMPORTANT: since this app currently has no real login/signup (it runs on
  an anonymous Supabase session), "Sign out" should show a confirmation
  dialog first, with this exact message: "This will clear your current
  session. Since there's no account login yet, you may lose access to your
  uploaded library from this browser. Continue?" — with "Cancel" and
  "Sign out" buttons. Only clear the anonymous session (and redirect to a
  fresh state) if the user confirms.
- Keep this section visually consistent with the rest of the sidebar (same
  panel background, same padding rhythm) — no card/border treatment that
  doesn't match the existing sidebar style.

## 3. Re-theme: amber gold accent + Playfair Display serif
Replace the current accent color and serif font throughout the app with:

### New accent color
- Light mode accent: `#B8862E` (was `#B5623E`)
- Dark mode accent: `#E0A94A` (was `#D97B52`)
- This accent is used in exactly the same places as before — do not expand
  its usage: play/pause icon while playing, progress bar fill, active nav
  item (text + icon), upload success confirmation, primary buttons (e.g.
  "Create" on Playlists, "Upload"), and the volume slider's filled portion.

### New serif font
- Replace Fraunces with Playfair Display (load from Google Fonts) for: the
  now-playing track title, page headers/titles (e.g. "Playlists", "Your
  Library"), and the app wordmark ("Echo") in the sidebar.
- Keep Inter (or the existing sans) unchanged for everything else — nav
  labels, buttons, body text, metadata.

### What NOT to change
- Background, panel, border, and text-primary/text-secondary neutral colors
  stay exactly as they are in both light and dark mode — only the accent
  color and the serif font are changing.
- No changes to layout, spacing, component structure, or any functionality
  beyond items 1 and 2 above.
