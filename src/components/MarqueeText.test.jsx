import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarqueeText from './MarqueeText.jsx'

const LONG_NAME = 'A Very Long Track Title That Overflows'
const SHORT_NAME = 'Short'

const container = () => document.querySelector('.marquee-container')

describe('MarqueeText', () => {
  it('renders a fitting name once with no reel', () => {
    render(<MarqueeText>{SHORT_NAME}</MarqueeText>)

    expect(screen.getAllByText(SHORT_NAME)).toHaveLength(1)
    expect(container()).not.toHaveClass('marquee-running')
  })

  it('duplicates an overflowing name so the loop is seamless', () => {
    render(<MarqueeText>{LONG_NAME}</MarqueeText>)

    expect(screen.getAllByText(LONG_NAME)).toHaveLength(2)
    expect(container()).toHaveClass('marquee-running')
  })

  it('hides the duplicate copy from assistive tech', () => {
    render(<MarqueeText>{LONG_NAME}</MarqueeText>)

    const copies = screen.getAllByText(LONG_NAME)
    expect(copies[0]).not.toHaveAttribute('aria-hidden')
    expect(copies[1]).toHaveAttribute('aria-hidden', 'true')
  })

  it('passes the className through to the scrolling element', () => {
    render(<MarqueeText className="text-sm font-medium">{LONG_NAME}</MarqueeText>)

    expect(container().querySelector('.marquee-text')).toHaveClass(
      'text-sm',
      'font-medium',
      'marquee-text',
    )
  })
})
