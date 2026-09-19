# Echo Music Player — Inline Upload Preview (Replace Immediate Upload)

## Goal
Currently, files selected via the upload zone start uploading immediately.
Change this so selecting files shows an inline preview/review step first,
inside the same upload zone — no modal, no popup, no "are you sure?" dialog.

## Behavior

### 1. File selection (drag-and-drop or click-to-browse)
When the user selects one or more audio files, do NOT start uploading yet.
Instead, transform the upload zone in place to show a review state.

### 2. Review state (inside the same upload zone container)
- Show a short list of the selected files, one row each, with:
  - File name
  - File size (formatted, e.g. "4.2 MB")
  - A small "x" / remove icon on the right of each row to remove that file
    from the selection before uploading (using the existing icon set —
    Bootstrap Icons, `bi-x`)
- Above or below the list, show a count label like "3 files selected" — use
  the accent color (#B5623E) for the number/count, since this is an active
  selection state.
- Below the list, show an "Upload" button (accent-colored, matching other
  primary actions in the app) and a "Cancel" text link/button to clear the
  whole selection and return to the empty dashed upload-zone state.
- If the user removes files down to zero, return to the empty state
  automatically (same as clicking Cancel).

### 3. Uploading state
When the user clicks "Upload":
- Begin uploading the selected files to Supabase Storage (existing upload
  logic — reuse it, don't rewrite the Supabase calls).
- Show a subtle per-file progress indicator (a thin progress bar under each
  file row, or the row fading/checking off as it completes — keep it simple
  and consistent with the app's quiet motion style, not a flashy loader).
- As each file finishes, it can disappear from this list (since it now
  exists in "Your Library" below) or show a brief checkmark before clearing.
- Once all files finish, the upload zone resets to its original empty
  dashed state, ready for the next selection.
- If an upload fails for a specific file, show a small inline error state on
  that file's row (not a popup) so the user can retry or remove just that
  one file without losing the rest of the batch.

## Design consistency
- No modal/dialog component should be introduced for this — everything
  happens within the existing upload zone container.
- Keep the same colors, spacing, and font choices already established
  (background/panel tones, accent color reserved for active/interactive
  states, sans font for this UI text).
- Transitions between empty → review → uploading → empty states should be
  smooth, not abrupt, consistent with the app's existing motion style.

## Non-goals
- No confirmation dialog ("are you sure you want to upload these songs?")
  — this inline review step replaces that need entirely.
- No storage-limit or subscription-related warnings yet — that's a separate
  future feature once storage limits are actually enforced.
