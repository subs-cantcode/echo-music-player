import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import App from './App.jsx'

// The particle canvas assumes a real 2D context; the composer under test does
// not draw anything.
vi.mock('./components/ParticleBackground.jsx', () => ({ default: () => null }))
// Both canvases need a real 2D context; jsdom only warns and returns null.
vi.mock('./components/AudioWaves.jsx', () => ({ AudioWaves: () => null, default: () => null }))

// Titles stay under 10 characters so the fake overflow measurement in test
// setup leaves each one as a single copy.
const { TRACKS } = vi.hoisted(() => ({
  TRACKS: [
    { id: 't1', title: 'Song A', artist: 'Ann', duration: 200, artwork: null, objectUrl: 'blob:a' },
    { id: 't2', title: 'Song B', artist: 'Bo', duration: 180, artwork: null, objectUrl: 'blob:b' },
  ],
}))

vi.mock('./hooks/useLocalLibrary.js', () => ({
  useLocalLibrary: () => ({
    tracks: TRACKS,
    playlists: [],
    loading: false,
    maxPinnedTracks: 9,
    addTrack: vi.fn(),
    deleteTrack: vi.fn(),
    toggleFavourite: vi.fn(),
    togglePin: vi.fn(),
    createPlaylist: vi.fn(),
    deletePlaylist: vi.fn(),
    addTrackToPlaylist: vi.fn(),
    removeTrackFromPlaylist: vi.fn(),
    clearAllData: vi.fn(),
    logPlay: vi.fn(),
    getListeningHistory: () => [],
    updateTrack: vi.fn(),
  }),
}))

const renderApp = () => render(<ThemeProvider><App /></ThemeProvider>)

const shelf = () => screen.getByText('Where You Left Off').closest('section')

describe('App — coming back to a quiet player', () => {
  beforeEach(() => {
    localStorage.clear()
    // jsdom has no matchMedia, which the theme provider reads on mount.
    window.matchMedia = window.matchMedia || (() => ({ matches: false }))
  })

  it('leaves the player idle and offers the last track on the shelf instead', () => {
    localStorage.setItem(
      'echo-playback-state',
      JSON.stringify({ trackId: 't1', currentTime: 42, isPlaying: true, volume: 0.8 })
    )

    renderApp()

    expect(screen.getByText('No song is being played right now')).toBeInTheDocument()
    expect(screen.queryByText('Continue Listening')).not.toBeInTheDocument()
    expect(within(shelf()).getByText('Song A')).toBeInTheDocument()
  })

  it('keeps the saved shelf and puts the last played track at its front', () => {
    localStorage.setItem('echo-recently-played', JSON.stringify(['t2']))
    localStorage.setItem('echo-playback-state', JSON.stringify({ trackId: 't1' }))

    renderApp()

    const cards = within(shelf()).getAllByRole('button')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('Song A')
    expect(cards[1]).toHaveTextContent('Song B')
  })

  it('stays quiet for a first-time listener', () => {
    renderApp()

    expect(screen.getByText('No song is being played right now')).toBeInTheDocument()
    expect(screen.queryByText('Where You Left Off')).not.toBeInTheDocument()
  })
})
