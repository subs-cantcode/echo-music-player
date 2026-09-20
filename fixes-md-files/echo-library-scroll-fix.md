# Fix: Library List Hidden Behind Player Bar (Can't Scroll to See Last Tracks)

## Problem

The "Your Library" track list doesn't scroll properly — the last track(s) end up hidden behind the fixed bottom player bar, and there's no way to scroll far enough to reveal them.

## Cause

This is almost always one of two things:
1. The scrollable list container is missing `overflow-y: auto` (or `scroll`), so the page/container doesn't know it should scroll at all, or
2. The container scrolls, but has no bottom padding/margin accounting for the player bar's height — so content is physically drawn *under* the player bar with nothing to push it above.

## Fix

### 1. Find the Library List Container

Likely in `src/pages/Home.jsx`, `src/pages/Library.jsx`, or wherever the "Your Library" section is rendered.

Find the container wrapping the track list (probably a `<div className="library-list">` or similar).

### 2. Ensure It's Independently Scrollable

```css
.library-list {
  overflow-y: auto;
  max-height: calc(100vh - [header height] - [player bar height]);
  /* Example: calc(100vh - 200px) — adjust based on your actual header/player heights */
}
```

If the whole page (not just the list) should scroll instead, apply this to the page's main scroll container instead — the key fix is the same either way: it needs a defined height/max-height with `overflow-y: auto`, not `overflow: hidden` or no overflow rule at all.

### 3. Add Bottom Padding Equal to Player Bar Height

This is the critical part — even with scrolling enabled, content needs breathing room so the last item can scroll fully clear of the player bar, not just up to its edge.

```css
.library-list,
.main-content /* whichever is the actual scrolling container */ {
  padding-bottom: 100px; /* adjust to match your actual player bar height + a little extra */
}
```

Check your `NowPlayingBar` component's actual rendered height (inspect it in DevTools) and use that exact value, plus ~20px of extra breathing room.

### 4. Verify Player Bar Is Fixed/Sticky Correctly

Make sure the player bar itself uses `position: fixed` (or `sticky` with a scroll container that doesn't include it) at the bottom, so it stays in place while the list scrolls underneath — but with the padding from step 3 preventing actual overlap.

```css
.now-playing-bar {
  position: fixed;
  bottom: 0;
  left: 0; /* or offset by sidebar width if sidebar is also fixed */
  right: 0;
  z-index: 50;
}
```

## Testing Checklist

- ✅ Scroll down through "Your Library" — every track, including the last one, is fully visible above the player bar
- ✅ No track is ever partially or fully hidden behind the player bar
- ✅ Scrolling works with mouse wheel, trackpad, and scrollbar drag
- ✅ This fix applies consistently across Home, Library/Songs view, Playlists (when viewing tracks inside a playlist), and Favourites — anywhere a track list is rendered
- ✅ Player bar remains fixed at the bottom while the list scrolls underneath it

## Do NOT Change

- Do not redesign the track list into cards as part of this fix — that's a separate visual decision, not related to this bug
- Do not change the player bar's controls or functionality
