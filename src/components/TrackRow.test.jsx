import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrackRow from './TrackRow.jsx'

const LONG_TITLE = 'A Very Long Track Title That Overflows The Row'
const track = { id: 't1', title: LONG_TITLE, artist: 'Ann', isFavourite: false }

describe('TrackRow', () => {
  it('marquees an overflowing title', () => {
    render(<TrackRow track={track} onPlay={() => {}} />)

    expect(screen.getAllByText(LONG_TITLE)).toHaveLength(2)

    const containers = document.querySelectorAll('.marquee-container')
    expect(containers[0]).toHaveClass('marquee-running')
  })

  it('leaves a short artist line static', () => {
    render(<TrackRow track={track} onPlay={() => {}} />)

    const containers = document.querySelectorAll('.marquee-container')
    expect(containers[1]).not.toHaveClass('marquee-running')
    expect(screen.getByText('Ann')).toBeInTheDocument()
    expect(screen.getAllByText('Ann')).toHaveLength(1)
  })
})
