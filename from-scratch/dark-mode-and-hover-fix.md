# Echo Music Player — Dark Mode Toggle + Sidebar Hover Fix

## Goal
Add a light/dark theme toggle, and fix the sidebar nav item hover state which
currently looks empty/broken.

## Theme toggle
- Add a toggle button (sun/moon icon, Bootstrap Icons `bi-moon` / `bi-sun`)
  in the top-right corner of the app, always visible regardless of which
  page is open.
- Also add a toggle/setting on the Settings page for the same thing, so
  there are two ways to access it (top-right button for quick access,
  Settings for a formal setting).
- Both controls toggle the same single theme state (React context or a
  simple state lifted to `App.jsx`, persisted to localStorage so the choice
  survives a page refresh).
- Transition between themes should be smooth — apply a CSS transition
  (150-250ms ease) on background-color and color properties on the main
  containers (sidebar, main content area, cards, now-playing bar) so
  switching doesn't feel like an abrupt flash.

## Dark theme colors
Keep the exact same warm, minimal personality — do NOT switch to a generic
gray/black dark theme. Use these exact values as CSS variables/Tailwind
theme values, toggled alongside the existing light values:

- `background`: #1C1815 (warm near-black, not pure black or cool gray)
- `panel`: #26221D (one step lighter than background — same relationship
  as the light theme's panel-over-background)
- `border`: #3A342C
- `text-primary`: #F2EAE0 (warm off-white, not pure white)
- `text-secondary`: #A79C8C
- `accent`: #D97B52 (a slightly brighter/warmer terracotta than the light
  theme's #B5623E — this is intentional, so the accent still reads clearly
  against the dark background instead of looking muddy or desaturated)

Keep every other design rule the same as light mode: accent used ONLY for
active/interactive states (play button, progress bar, upload success,
active nav item), same serif/sans font pairing, same spacing and layout,
no shadows or gradients introduced for dark mode.

## Sidebar hover fix
The current hover state on sidebar nav items looks empty/has no visible
feedback. Fix it: on hover (and this should work in both light and dark
theme), add a background of a low-opacity accent color behind the nav item,
with rounded corners, sized to match the item's padding:
- Light mode hover background: `rgba(181, 98, 62, 0.08)` (a faint terracotta
  wash)
- Dark mode hover background: `rgba(217, 123, 82, 0.14)` (slightly stronger
  opacity since it needs more contrast against the darker background)
- Border radius: 8px, matching the app's existing corner-radius convention
- This applies to inactive nav items on hover. The already-active item (in
  accent-colored text) does not need this hover background layered on top —
  keep its existing active-state styling as is.
- Transition the hover background in/out smoothly (120-150ms ease), not an
  instant snap.
