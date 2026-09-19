import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlaylistCard from './PlaylistCard.jsx'

const LONG_NAME = 'A Very Long Playlist Name That Overflows Its Card'
const playlist = { id: 'p1', name: LONG_NAME, trackIds: [] }

describe('PlaylistCard', () => {
  it('marquees an overflowing playlist name', () => {
    render(<PlaylistCard playlist={playlist} tracks={[]} />)

    expect(screen.getAllByText(LONG_NAME)).toHaveLength(2)
    expect(document.querySelector('.marquee-container')).toHaveClass('marquee-running')
  })
})
