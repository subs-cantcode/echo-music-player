import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/ThemeContext.jsx'

export default function UserMenu() {
  const navigate = useNavigate()
  const { theme, cycleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className="fixed top-3 right-5 z-50 flex items-center gap-1" ref={menuRef}>
      <button
        onClick={cycleTheme}
        className="player-btn w-8 h-8"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'} text-sm`} />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-8 h-8 rounded-full bg-accent-soft text-accent-text flex items-center justify-center text-xs font-medium hover:bg-accent/20 active:scale-90 transition-all duration-150"
          aria-label="Menu"
        >
          <i className="bi bi-list text-sm" />
        </button>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-52 bg-surface border border-border rounded-xl shadow-lg overflow-hidden fade-in">
            <div className="px-3 py-2.5 border-b border-border-subtle">
              <div className="text-sm font-medium text-fg">Echo</div>
              <div className="text-fg-faint text-xs">Local-first player</div>
            </div>
            <div className="py-1">
              <button onClick={() => { setMenuOpen(false); navigate('/settings') }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors">
                <i className="bi bi-gear text-sm w-4" /> Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
