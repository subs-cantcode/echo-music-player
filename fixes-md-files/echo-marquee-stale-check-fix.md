# Fix: Marquee State Doesn't Update When Switching Tracks

## Symptom

Switch from a track with a long name (marquee correctly applied) to a track with a short name — the marquee effect stays applied to the short name too, even though it shouldn't overflow. The overflow check isn't independent per track; it's carrying over from whichever track was checked last.

## Root Cause

`src/hooks/useTextOverflow.js` only measures overflow **once, on mount**, and again on window `resize`. It does NOT re-check when the text content itself changes while the component stays mounted on the same DOM node (e.g. `NowPlayingTitle` staying mounted across track changes, just receiving a new `title` prop). Since the element isn't unmounting/remounting between tracks, the effect never re-runs, so `isOverflowing` stays stuck at whatever it was measured as for the previous track.

## Fix

**In `src/hooks/useTextOverflow.js`**, make the hook accept the text value as an argument and include it as a dependency, so the overflow check re-runs every time the text changes — not just on mount/resize:

```javascript
import { useEffect, useRef, useState } from 'react';

export const useTextOverflow = (text) => {
  const elementRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const checkOverflow = () => {
      const isOverflow = element.scrollWidth > element.offsetWidth;
      setIsOverflowing(isOverflow);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]); // re-run whenever the text itself changes, not just on mount

  return { elementRef, isOverflowing };
};
```

**Update every place that calls this hook to pass the text being measured:**

`src/components/NowPlayingTitle.jsx` (player bar title):
```javascript
const { elementRef, isOverflowing } = useTextOverflow(title);
```

`src/components/TrackRow.jsx`:
```javascript
const { elementRef: titleRef, isOverflowing: titleOverflows } = useTextOverflow(track.title);
const { elementRef: artistRef, isOverflowing: artistOverflows } = useTextOverflow(track.artist);
```

`src/components/PlaylistCard.jsx`:
```javascript
const { elementRef: nameRef, isOverflowing: nameOverflows } = useTextOverflow(playlist.name);
```

This ensures the overflow measurement is tied specifically to the current text value — when the text changes (new track selected), the effect re-fires and re-measures fresh, instead of trusting a stale result from whatever was measured before.

## Testing

- ✅ Play a track with a long name → marquee applies correctly
- ✅ Switch to a track with a short name → marquee is removed immediately, text is fully visible and static
- ✅ Switch back to a long-named track → marquee re-applies correctly
- ✅ Repeat switching back and forth several times rapidly → state stays correct every time, never sticks from the previous track
- ✅ Same correct independent behavior in track rows and playlist cards, not just the player bar
