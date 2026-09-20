import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Home from './Home.jsx'

// The particle canvas needs a 2D context jsdom does not implement; the section
// under test does not depend on it.
vi.mock('../components/ParticleBackground.jsx', () => ({ default: () => null }))

const makeTrack = (n, pinned = false) => ({
  id: `t${n}`,
  title: `Song ${n}`,
  artist: `Artist ${n}`,
  duration: 180,
  isFavourite: false,
  isPinned: pinned,
  pinnedAt: pinned ? new Date(2026, 0, n).toISOString() : null,
})

const renderHome = (tracks, props = {}) =>
  render(
    <Home
      tracks={tracks}
      currentTrack={null}
      onPlay={() => {}}
      onDelete={() => {}}
      onToggleFavourite={() => {}}
      recentlyPlayed={[]}
      onShuffleAll={() => {}}
      {...props}
    />
  )

describe('Home — Instant Replay', () => {
  it('sits above Forgotten Echoes', () => {
    const tracks = Array.from({ length: 8 }, (_, i) => makeTrack(i + 1, i < 3))
    renderHome(tracks)

    const instant = screen.getByText('Instant Replay')
    const forgotten = screen.getByText('Forgotten Echoes')

    expect(instant.compareDocumentPosition(forgotten) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows only pinned tracks and never more than the limit', () => {
    const tracks = Array.from({ length: 12 }, (_, i) => makeTrack(i + 1, i < 10))
    renderHome(tracks, { pinLimit: 9 })

    // 10 tracks are pinned but the shelf is capped at 9.
    expect(screen.getAllByLabelText(/^Unpin /)).toHaveLength(9)
    expect(screen.getByText('9/9 pinned')).toBeInTheDocument()
  })

  it('unpins a track from its card', () => {
    const tracks = [makeTrack(1, true), makeTrack(2, false), makeTrack(3, false)]
    const onTogglePin = vi.fn()
    renderHome(tracks, { onTogglePin })

    fireEvent.click(screen.getByLabelText('Unpin Song 1 from Instant Replay'))

    expect(onTogglePin).toHaveBeenCalledWith('t1')
  })

  it('invites a new listener to pin something', () => {
    const tracks = [makeTrack(1), makeTrack(2)]
    renderHome(tracks, { pinLimit: 9 })

    expect(screen.getByText(/Pin up to 9 tracks/)).toBeInTheDocument()
    expect(screen.queryAllByLabelText(/^Unpin /)).toHaveLength(0)
  })
})
