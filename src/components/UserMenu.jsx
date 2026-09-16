import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTheme } from '../lib/ThemeContext.jsx'

const menuItems = [
  { label: 'Account', icon: 'bi-person', action: 'account' },
  { label: 'Recents', icon: 'bi-clock-history', action: 'recents' },
  { label: 'Support', icon: 'bi-headset', action: 'support' },
  { label: 'Settings', icon: 'bi-gear', action: 'settings' },
]

export default function UserMenu() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [displayName, setDisplayName] = useState('Guest')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const menuRef = useRef(null)
  const tooltipTimer = useRef(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData?.session?.user
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .maybeSingle()
        if (data?.username) setDisplayName(data.username)
      } catch {}
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleTooltipEnter = useCallback(() => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltipVisible(true)
  }, [])

  const handleTooltipLeave = useCallback(() => {
    tooltipTimer.current = setTimeout(() => setTooltipVisible(false), 150)
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }, [])

  const handleMenuAction = useCallback((action) => {
    setMenuOpen(false)
    switch (action) {
      case 'settings':
        navigate('/settings')
        break
      case 'account':
      case 'recents':
      case 'support':
        break
    }
  }, [navigate])

  const initial = (displayName || 'G').charAt(0).toUpperCase()

  return (
    <div className="fixed top-3 right-4 z-50 flex items-center gap-1.5" ref={menuRef}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="player-btn w-9 h-9 text-text-secondary hover:text-text-primary"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'} text-base`} />
      </button>

      {/* Avatar with tooltip */}
      <div
        className="relative"
        onMouseEnter={handleTooltipEnter}
        onMouseLeave={handleTooltipLeave}
      >
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-semibold hover:bg-accent/30 transition-all duration-200 ease-out active:scale-90"
          aria-label="User menu"
        >
          {initial}
        </button>

        {/* Hover tooltip — username */}
        <div
          className={`absolute top-full right-0 mt-2 px-2.5 py-1 bg-panel border border-border/60 rounded-md shadow-md text-xs text-text-primary whitespace-nowrap pointer-events-none transition-all duration-200 ease-out ${
            tooltipVisible && !menuOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-1'
          }`}
        >
          {displayName}
        </div>
      </div>

      {/* Dropdown menu */}
      <div
        className={`absolute top-full right-0 mt-2 w-48 bg-panel border border-border/60 rounded-xl shadow-xl overflow-hidden transition-all duration-200 ease-out origin-top-right ${
          menuOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
      >
        {/* User header */}
        <div className="px-3.5 py-3 border-b divider-soft">
          <div className="text-sm font-medium text-text-primary truncate">{displayName}</div>
        </div>

        {/* Menu items */}
        <div className="py-1">
          {menuItems.map((item) => (
            <button
              key={item.action}
              onClick={() => handleMenuAction(item.action)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-hover-inactive transition-colors duration-150"
            >
              <i className={`bi ${item.icon} text-base w-5 text-center`} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t divider-soft" />

        {/* Sign out */}
        <div className="py-1">
          <button
            onClick={() => {
              setMenuOpen(false)
              setShowSignOutConfirm(true)
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors duration-150"
            style={{ color: document.documentElement.classList.contains('dark') ? '#E5726B' : '#D64545' }}
          >
            <i className="bi bi-box-arrow-right text-base w-5 text-center" />
            Sign out
          </button>
        </div>
      </div>

      {/* Sign out confirmation dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-panel border border-border rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <p className="text-text-primary text-sm leading-relaxed mb-5">
              This will clear your current session. Since there's no account login yet, you may lose access to your uploaded library from this browser. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-white rounded-lg transition-colors"
                style={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#E5726B' : '#D64545' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
