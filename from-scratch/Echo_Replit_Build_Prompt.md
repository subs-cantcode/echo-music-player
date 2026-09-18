# Echo — Your Space. Your Echo.

Build a polished, interactive web-based local music player called **Echo**.

Echo is a **local-first personal music space** for people who already have music files on their device. It should feel familiar to anyone who has used Spotify, YouTube Music, Apple Music, or other modern music players, but Echo is **not** a streaming service.

The central idea is:

> **Your space. Your echo.**

Echo should feel like a calm, private, comfortable place where someone's own music collection lives.

---

## 1. Product Philosophy

Echo should communicate five things:

1. **Familiar** — users should immediately understand how to navigate it.
2. **Personal** — this is the user's music collection, not Echo's catalog.
3. **Respectful** — the application should never feel pushy, manipulative, or invasive.
4. **Private** — local music should remain local.
5. **Delightful** — interactions should feel polished without becoming distracting.

The product should feel:

- Warm
- Comfortable
- Trustworthy
- Reliable
- Minimal
- Modern
- Interactive
- Calm

Avoid making it feel:

- Corporate
- Aggressive
- Overly futuristic
- Cyberpunk
- Like an "AI startup"
- Cluttered
- Excessively colorful
- Filled with unnecessary animations

---

## 2. Product Constraint

This is a **demo/MVP**, not a production streaming service.

Do **not** implement:

- Music streaming catalogs
- Spotify integration
- YouTube Music integration
- User accounts
- Social feeds
- Advertising
- Subscriptions
- Cloud music storage
- Payments

The first version should focus on the **local music experience**.

The architecture should, however, be clean enough that cloud synchronization could be added later.

---

## 3. Core User Flow

The primary experience should be:

```text
Open Echo
   ↓
Import local music
   ↓
Echo creates the user's library
   ↓
Browse albums / artists / songs
   ↓
Play music
   ↓
Create playlists
   ↓
See listening history
   ↓
Rediscover forgotten music
```

The application should work with locally selected audio files using browser-supported APIs.

Do not upload the user's music to a server for this demo.

---

## 4. Visual Identity

### Brand

Name:

**Echo**

Tagline:

**Your space. Your echo.**

The word "Echo" should be visually prominent but elegant.

Do not use a generic music-note logo.

Create a simple abstract logo/icon based around the concept of an **echo / sound wave / ripple**, but keep it minimal.

---

## 5. Color System

Support both **Light Mode and Dark Mode**.

The two themes should feel like the same product rather than completely different designs.

### Light Theme

Use a warm off-white background rather than pure white.

Suggested direction:

- Background: warm off-white
- Surfaces: soft white
- Primary text: deep charcoal
- Secondary text: warm gray
- Borders: subtle warm gray
- Accent: muted warm amber / terracotta / earthy tone

Do not make the interface overwhelmingly orange.

### Dark Theme

Avoid pure black.

Use:

- Deep charcoal background
- Slightly lighter charcoal surfaces
- Warm white text
- Muted gray secondary text
- The same accent color as light mode

Dark mode should feel like a quiet room at night.

---

## 6. Typography

Use a modern, highly readable sans-serif typeface.

Prefer something in the style of:

- Manrope
- DM Sans
- Inter
- Plus Jakarta Sans

Use typography to create hierarchy rather than excessive cards or decorative elements.

Avoid excessive bold text.

---

## 7. Layout

Create a modern desktop music application layout.

Suggested structure:

```text
┌────────────────────────────────────────────────────────────┐
│ Echo                                      Search     ⚙     │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ Home          │                                            │
│ Library       │              Main Content                  │
│ Playlists     │                                            │
│ Echoes        │                                            │
│               │                                            │
│               │                                            │
│               │                                            │
├───────────────┴────────────────────────────────────────────┤
│                    Persistent Player                       │
└────────────────────────────────────────────────────────────┘
```

On mobile, transform the navigation into an appropriate mobile layout.

---

## 8. Home Screen

The home screen should **not** look like a streaming service trying to sell content.

It should feel like the user's personal space.

Example:

**Good evening**

> Welcome back to your space.

Then sections such as:

### Continue Listening

Show recently played albums/songs.

### Recently Added

Show recently imported music.

### Your Echoes

Show a small selection of recently listened songs.

### Forgotten Echoes

Show songs that have not been played recently.

Example:

> **Forgotten Echo**
>
> You haven't heard this in 184 days.
>
> [Play]

Use realistic demo data initially so the interface looks populated before the user imports files.

---

## 9. Library

Create a proper local music library interface.

Navigation:

- Songs
- Albums
- Artists
- Genres
- Playlists

Album view should display:

- Artwork
- Album name
- Artist
- Year
- Number of tracks

Song view should display:

- Track number
- Song title
- Artist
- Album
- Duration
- Play button
- More/options button

Use clean table/list layouts rather than putting every song inside a large card.

---

## 10. Import Music

Create a prominent but non-intrusive import experience.

Empty library:

> **Your space is quiet.**
>
> Bring your music into Echo to get started.
>
> [Import Music]

When clicked, allow the user to select local audio files.

Support common browser-compatible formats such as:

- MP3
- WAV
- OGG
- M4A where browser support permits

For this demo, local object URLs are acceptable.

Clearly communicate:

> **Your music stays on your device.**

Do not imply that the files are uploaded to Echo's servers.

---

## 11. Player

Create a persistent bottom player.

It should contain:

- Album artwork
- Song title
- Artist
- Play / pause
- Previous
- Next
- Progress bar
- Current time
- Duration
- Volume
- Queue
- Repeat
- Shuffle

The player should remain visible while navigating the application.

Use subtle animations when:

- Starting playback
- Pausing
- Changing songs
- Hovering controls
- Updating progress

Animations should be fast and understated.

---

## 12. Now Playing

Create a dedicated Now Playing screen.

Large artwork should be the visual focus.

Example structure:

```text
             Album Artwork

              Song Name
                Artist

        ───────●────────────

          2:14 / 4:02

       ◀      ▶/❚❚      ▶

          ♡    + Playlist
```

The interface should feel calm and immersive.

Do not use huge gradients behind everything.

If dynamic artwork colors are implemented, keep them extremely subtle.

---

## 13. Echoes

Create a section called:

**Your Echoes**

This represents the user's listening history.

Display:

- Recently played songs
- Most played songs
- Listening timeline
- Recently revisited music

Example:

> **You played this song 12 times this week.**

The terminology should feel natural, not gimmicky.

---

## 14. Forgotten Echoes

Create a rediscovery feature.

The app should identify songs that have not been played recently.

Example:

> **Forgotten Echo**
>
> "Midnight City"
>
> You haven't listened to this in 213 days.
>
> [Play now]

Add a "Surprise Me" interaction that selects an appropriate forgotten song.

For the demo, simulated listening history is acceptable.

---

## 15. Playlists

Allow users to create playlists.

Example:

> + New Playlist

Playlist creation should be simple.

A playlist should contain:

- Name
- Description (optional)
- Cover image generated from its songs where possible
- Song list
- Play button

Avoid making playlist creation complicated.

---

## 16. Respectful UX

This is extremely important.

Echo should feel like software that **respects the user**.

### File errors

Instead of:

> ❌ ERROR: FILE UPLOAD FAILED

Use:

> **We couldn't play this file.**
>
> Echo doesn't currently support this format.
> Your original file hasn't been changed.

### Removing a song

Instead of simply deleting it:

> **Remove from Echo?**
>
> This removes the song from your Echo library.
> Your original file will remain untouched.
>
> Cancel · Remove

### Empty library

> **Your space is quiet.**
>
> Import some music to begin.

Avoid:

- Aggressive upgrade prompts
- Fake urgency
- Excessive notifications
- Dark patterns
- Unnecessary permission requests
- Confusing error messages
- Destructive actions without confirmation

---

## 17. Micro-interactions

Make Echo feel interactive without making it noisy.

Examples:

- Album artwork gently scales when hovered
- Play buttons transition smoothly
- Song rows reveal controls on hover
- Active song has a subtle visual indicator
- Progress bar responds smoothly
- Sidebar selection transitions naturally
- Theme switching is smooth
- Toast messages are subtle
- Buttons provide clear hover/pressed states

Do **not** animate everything.

---

## 18. Theme Switching

Implement:

**Light / Dark / System**

Theme preference should persist locally.

The theme switch should be accessible from Settings or the top navigation.

Make sure:

- Contrast remains accessible
- Text remains readable
- Album artwork remains visually dominant
- Controls are clearly visible
- Both themes feel equally designed

Do not simply invert colors.

---

## 19. Search

Implement a global search.

Search across:

- Songs
- Artists
- Albums
- Playlists

Search should feel instant.

Example:

Typing:

> `linkin`

could return:

**Artists**

Linkin Park

**Albums**

Meteora  
Hybrid Theory

**Songs**

Numb  
In the End  
Faint

---

## 20. Settings

Keep Settings simple.

### Appearance

- Light
- Dark
- System

### Playback

- Volume
- Crossfade placeholder
- Autoplay placeholder

### Library

- Import music
- Rescan library
- Clear demo data

### Privacy

Display:

> **Your music is yours.**
>
> Echo is designed around local music. In this version, your audio files remain on your device and are not uploaded to a server.

---

## 21. Demo Data

The application should initially contain realistic mock music data so the interface can be evaluated immediately.

Use fictional/demo metadata if necessary.

Do not rely on copyrighted streaming APIs.

Create enough data to demonstrate:

- Multiple artists
- Multiple albums
- Different genres
- Playlists
- Listening history
- Forgotten songs
- Recently added songs

The user should be able to remove the demo data and import their own files.

---

## 22. Technical Direction

Choose a sensible modern web stack supported by Replit.

Prioritize:

- Clean component architecture
- Responsive design
- Good state management
- Local browser storage where appropriate
- Browser audio APIs
- Maintainable code
- Clear separation between UI, player state, and library data

Use localStorage / IndexedDB where appropriate for metadata and application state.

Audio files themselves should remain local for this MVP.

Do not build unnecessary backend infrastructure.

---

## 23. Future-Proofing

Do not implement cloud functionality yet.

However, structure the application so the following could eventually be added:

```text
Echo Local
    ↓
Echo Cloud
    ↓
Sync across devices
    ↓
Cloud backup
    ↓
Web access
```

The future cloud layer should be optional.

Do not design the current product around forcing users into cloud storage.

---

## 24. Important Design Rule

The application should **NOT** look like a clone of Spotify.

It can use familiar interaction patterns because users already understand them, but Echo needs its own visual identity.

Avoid:

- Spotify green
- Spotify-like layouts copied directly
- Generic purple AI gradients
- Excessive glassmorphism
- Giant glowing buttons
- Music-note icon everywhere
- Overloaded dashboards

Echo should feel quieter and more personal.

---

## 25. Overall Impression

When someone opens Echo, the immediate emotional reaction should be:

> "This feels like my place."

Not:

> "This is another streaming service."

Not:

> "This is a complicated music-management tool."

The product should feel like:

**A quiet digital room for the music you already own.**

---

## 26. Final Requirement

Build the first version as a **fully interactive demo**, not a static mockup.

Users should be able to:

1. Navigate the application
2. Import local audio files
3. See them appear in the library
4. Play/pause music
5. Skip tracks
6. Adjust volume
7. Browse albums/artists/songs
8. Create playlists
9. Search the library
10. View listening history
11. Explore Forgotten Echoes
12. Switch between light and dark themes

If some browser limitations prevent full functionality, implement the closest functional behavior possible and clearly separate real functionality from demo/mock functionality.

Prioritize **polish and usability over feature count**.

The final result should feel like the beginning of a real product called:

# Echo

### Your space. Your echo.
