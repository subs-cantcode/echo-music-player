import { useRef, useEffect, useState } from 'react'

export default function MarqueeText({ children, className = '' }) {
  const measureRef = useRef(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const container = el.parentElement
    if (!container) return

    const check = () => setIsOverflowing(el.scrollWidth > container.clientWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [children])

  return (
    <div className={`marquee-container ${isOverflowing ? 'marquee-running' : ''}`}>
      <div
        ref={measureRef}
        className={`${className} marquee-text ${isOverflowing ? 'marquee-active' : ''}`}
        style={{ whiteSpace: 'nowrap' }}
      >
        {isOverflowing ? (
          <>
            <span>{children}</span>
            <span aria-hidden="true">{children}</span>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
