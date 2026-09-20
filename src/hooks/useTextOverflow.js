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
      const isOverflow = element.scrollWidth > element.clientWidth
      setIsOverflowing(isOverflow)
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)

    return () => window.removeEventListener('resize', checkOverflow)
  }, [text])

  return { elementRef, isOverflowing }
}