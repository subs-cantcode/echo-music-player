import { useRef, useEffect, useState } from 'react'

export default function MarqueeText({ children, className = '' }) {
  const containerRef = useRef(null)
  // Always holds exactly one copy, so its width is stable whether or not the
  // marquee is currently duplicated. Measuring the whole scroller would inflate
  // once the second copy is appended and never let the overflow state reset.
  const measureRef = useRef(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const el = measureRef.current
    const container = containerRef.current
    if (!el || !container) return

    const check = () => setIsOverflowing(el.scrollWidth > container.clientWidth)
    check()

    // Re-check when the container is resized (window resizes don't cover e.g.
    // a sidebar expanding, which changes this element's width).
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null
    observer?.observe(container)
    window.addEventListener('resize', check)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', check)
    }
  }, [children])

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${isOverflowing ? 'marquee-running' : ''}`}
    >
      <div
        className={`${className} marquee-text ${isOverflowing ? 'marquee-active' : ''}`}
        style={{ whiteSpace: 'nowrap' }}
      >
        <span ref={measureRef}>{children}</span>
        {isOverflowing && <span aria-hidden="true">{children}</span>}
      </div>
    </div>
  )
}
