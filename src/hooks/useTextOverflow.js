import { useEffect, useRef, useState } from 'react'

// Measures whether an element's content overflows its box. Used by the player
// bar title so short names stay static while genuinely long ones scroll.
// The effect has no dependency array on purpose: the consumer is memoised on
// its text prop, so this re-measures exactly when the text changes.
export function useTextOverflow() {
  const elementRef = useRef(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    let frame = 0
    const raf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb) => setTimeout(cb, 0)
    const cancel = (id) => {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id)
      else clearTimeout(id)
    }

    const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth)
    const schedule = () => {
      cancel(frame)
      frame = raf(check)
    }

    check()
    schedule()

    // Re-check when the title's box resizes (window resizes, sidebar expand).
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    observer?.observe(el)

    // A late web-font swap changes the text width long after first paint.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(schedule).catch(() => {})
    }

    return () => {
      cancel(frame)
      observer?.disconnect()
    }
  })

  return { elementRef, isOverflowing }
}