import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TrackRow from './TrackRow.jsx'

const LONG_TITLE = 'A Very Long Track Title That Overflows The Row'
const track = { id: 't1', title: LONG_TITLE, artist: 'Ann', isFavourite: false }
const shortTrack = { id: 't1', title: 'Song', artist: 'Ann', isFavourite: false, isPinned: false }

const openMenu = () => {
  fireEvent.click(screen.getByLabelText('Actions for Song'))
  return screen.getByRole('menu')
}

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

describe('TrackRow actions menu', () => {
  const handlers = () => ({
    onPlay: vi.fn(),
    onDelete: vi.fn(),
    onToggleFavourite: vi.fn(),
    onTogglePin: vi.fn(),
  })

  it('keeps the row to one action slot and runs each action', () => {
    const props = handlers()
    render(<TrackRow track={shortTrack} {...props} />)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    openMenu()
    const items = screen.getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['Favourite', 'Pin', 'Delete track'])

    fireEvent.click(items[0])
    expect(props.onToggleFavourite).toHaveBeenCalledWith('t1')

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Pin' }))
    expect(props.onTogglePin).toHaveBeenCalledWith('t1')

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete track' }))
    expect(props.onDelete).toHaveBeenCalledWith('t1')
  })

  it('closes the menu after an action and on Escape', () => {
    const props = handlers()
    render(<TrackRow track={shortTrack} {...props} />)

    fireEvent.click(openMenu().querySelector('button'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    openMenu()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    expect(props.onPlay).not.toHaveBeenCalled()
  })

  it('shows the state of a favourited, pinned track', () => {
    render(
      <TrackRow
        track={{ ...shortTrack, isFavourite: true, isPinned: true }}
        onPlay={() => {}}
        onToggleFavourite={() => {}}
        onTogglePin={() => {}}
      />
    )

    openMenu()
    expect(screen.getByRole('menuitem', { name: 'Unfavourite' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Unpin' })).toBeInTheDocument()
  })

  it('greys out pinning once the Instant Replay shelf is full', () => {
    render(
      <TrackRow
        track={shortTrack}
        onPlay={() => {}}
        onTogglePin={() => {}}
        pinDisabled
      />
    )

    openMenu()
    const pin = screen.getByRole('menuitem', { name: 'Pin' })
    expect(pin).toBeDisabled()
    expect(pin).toHaveAttribute('title', 'Instant Replay is full')
  })

  it('only offers the actions a list passes in', () => {
    render(
      <TrackRow
        track={shortTrack}
        onPlay={() => {}}
        onDelete={() => {}}
        deleteIcon="bi-dash-circle"
        deleteLabel="Remove from playlist"
      />
    )

    openMenu()
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
    expect(screen.getByRole('menuitem', { name: 'Remove from playlist' })).toBeInTheDocument()
  })
})
