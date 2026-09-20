import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetadataEditor from './MetadataEditor.jsx'

// Stub the library so the editor can be driven without IndexedDB.
vi.mock('../lib/LibraryContext.jsx', () => ({
  useLibrary: () => ({ updateTrack: vi.fn() }),
}))

const baseTrack = {
  id: 't1',
  title: 'Old Title',
  artist: 'Ann',
  album: 'Album',
  genre: 'Pop',
  year: 2001,
  artwork: null,
}

describe('MetadataEditor', () => {
  it('renders nothing while closed', () => {
    render(<MetadataEditor track={baseTrack} isOpen={false} onClose={() => {}} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens and seeds the form from the track', () => {
    const { rerender } = render(<MetadataEditor track={baseTrack} isOpen={false} onClose={() => {}} />)

    rerender(<MetadataEditor track={baseTrack} isOpen onClose={() => {}} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Title *')).toHaveValue('Old Title')
    expect(screen.getByLabelText('Artist *')).toHaveValue('Ann')
    expect(screen.getByLabelText('Album')).toHaveValue('Album')
  })

  it('seeds from whichever track it is opened on', () => {
    const { rerender } = render(<MetadataEditor track={baseTrack} isOpen onClose={() => {}} />)

    rerender(<MetadataEditor track={{ ...baseTrack, id: 't2', title: 'Second' }} isOpen onClose={() => {}} />)

    expect(screen.getByLabelText('Title *')).toHaveValue('Second')
  })

  it('drops unsaved edits when it is reopened', () => {
    const { rerender } = render(<MetadataEditor track={baseTrack} isOpen onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Typed' } })
    expect(screen.getByLabelText('Title *')).toHaveValue('Typed')

    rerender(<MetadataEditor track={baseTrack} isOpen={false} onClose={() => {}} />)
    rerender(<MetadataEditor track={baseTrack} isOpen onClose={() => {}} />)

    expect(screen.getByLabelText('Title *')).toHaveValue('Old Title')
  })
})
