import { useEffect, useRef, useState } from 'react'

// Measures whether an element's content overflows its own box. Re-runs
// whenever the passed-in text changes, so switching to a new track (without
// remounting the same DOM node) re-measures fresh instead of trusting a stale
// result from whichever text was checked last.
export const useTextOverflow = (text) => {
  const elementRef = useRef(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const checkOverflow = () => {
      // Measure a single copy of the text, not the whole container. When the
      // marquee is running the reel holds the text twice, so comparing the
      // container's scrollWidth against its clientWidth would report overflow
      // even for a short title that fits on its own - the duplicate copy alone
      // is wider than the box, and the marquee would never switch back off.
      let textNode = element
      while (textNode.firstElementChild) textNode = textNode.firstElementChild
      const isOverflow = textNode.scrollWidth > element.clientWidth
      setIsOverflowing(isOverflow)
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)

    return () => window.removeEventListener('resize', checkOverflow)
  }, [text])

  return { elementRef, isOverflowing }
}