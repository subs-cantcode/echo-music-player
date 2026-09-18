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
    <div className="marquee-container">
      <div
        ref={measureRef}
        className={isOverflowing ? 'marquee-text' : ''}
        style={{ whiteSpace: 'nowrap', ...(isOverflowing ? {} : {}) }}
      >
        {isOverflowing ? (
          <>
            {children}<span>{children}</span>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
