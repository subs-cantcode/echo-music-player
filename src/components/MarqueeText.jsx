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

    let frame = 0
    const raf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb) => setTimeout(cb, 0)
    const cancel = (id) => {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id)
      else clearTimeout(id)
    }

    const check = () => setIsOverflowing(el.scrollWidth > container.clientWidth)

    // Re-measure after the browser has flushed the edited text's layout. React
    // runs this effect on the commit that a new title/artist triggers, so the
    // boxes can still reflect the previous string and leave the reel paused.
    const schedule = () => {
      cancel(frame)
      frame = raf(check)
    }

    check()
    schedule()

    // Re-check when the container is resized (window resizes don't cover e.g.
    // a sidebar expanding, which changes this element's width).
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    observer?.observe(container)
    window.addEventListener('resize', schedule)

    // A late web-font swap changes the text width long after first paint, which
    // would otherwise leave an overflow decided against the fallback metrics.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(schedule).catch(() => {})
    }

    return () => {
      cancel(frame)
      observer?.disconnect()
      window.removeEventListener('resize', schedule)
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
