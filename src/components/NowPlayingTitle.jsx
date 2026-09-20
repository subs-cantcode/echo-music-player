import React from 'react'
import { useTextOverflow } from '../hooks/useTextOverflow'

// Memoised so the player bar's rapid timeupdate re-renders never touch it:
// it only re-renders when the actual title changes. The duplicate copy is what
// makes the -50% marquee keyframes loop seamlessly.
const NowPlayingTitle = React.memo(({ title }) => {
  const { elementRef, isOverflowing } = useTextOverflow()

  return (
    <p
      ref={elementRef}
      className={`now-playing-title text-base font-medium text-fg ${isOverflowing ? 'marquee' : ''}`}
    >
      <span className="now-playing-title-reel">
        <span>{title}</span>
        {isOverflowing && <span aria-hidden="true">{title}</span>}
      </span>
    </p>
  )
})

export default NowPlayingTitle