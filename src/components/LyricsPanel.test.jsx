import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LyricsPanel from './LyricsPanel.jsx'
import { updateTrack } from '../lib/localLibrary.js'

vi.mock('../lib/localLibrary.js', () => ({
  updateTrack: vi.fn(async (id, updates) => ({ id, ...updates })),
}))

vi.mock('../lib/lyrics.js', async (importActual) => {
  const actual = await importActual()
  return {
    ...actual,
    fetchLyrics: vi.fn(async () => null),
    searchLyrics: vi.fn(async () => []),
  }
})

const baseTrack = { id: 't1', title: 'My Song', artist: 'Some Artist', lyrics: null, duration: 200 }

describe('LyricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('offers fetch and manual options when there are no lyrics', () => {
    render(<LyricsPanel track={baseTrack} currentTime={0} isOpen onClose={() => {}} />)

    expect(screen.getByText(/No lyrics for this track yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fetch lyrics/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add lyrics manually/i })).toBeInTheDocument()
  })

  it('displays manually added plain lyrics after saving', async () => {
    render(<LyricsPanel track={baseTrack} currentTime={0} isOpen onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /Add lyrics manually/i }))
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'First line of the verse\nSecond line here' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(await screen.findByText('First line of the verse')).toBeInTheDocument()
    expect(screen.getByText('Second line here')).toBeInTheDocument()
  })

  it('nudges the active line with the sync offset control', () => {
    const track = { ...baseTrack, lyrics: '[00:05.00]Line A\n[00:10.00]Line B' }
    render(<LyricsPanel track={track} currentTime={10} isOpen onClose={() => {}} />)

    expect(screen.getByText('Line B')).toHaveClass('active')

    fireEvent.click(screen.getByRole('button', { name: /Shift lyrics later/i }))

    expect(screen.getByText('Line B')).not.toHaveClass('active')
    expect(screen.getByText('Line A')).toHaveClass('active')
  })

  it('still shows the lyrics when saving to the library fails', async () => {
    updateTrack.mockRejectedValueOnce(new Error('indexeddb down'))
    render(<LyricsPanel track={baseTrack} currentTime={0} isOpen onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /Add lyrics manually/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Still visible line' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(await screen.findByText('Still visible line')).toBeInTheDocument()
  })

  it('syncs and highlights a manually added timestamped line', async () => {
    render(<LyricsPanel track={baseTrack} currentTime={10} isOpen onClose={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /Add lyrics manually/i }))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '[00:01.00]Opening line\n[00:10.00]Later line' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    const later = await screen.findByText('Later line')
    expect(later).toHaveClass('lyric-line')
    expect(later).toHaveClass('active')
  })
})
