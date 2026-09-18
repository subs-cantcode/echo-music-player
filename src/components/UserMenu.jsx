import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTheme } from '../lib/ThemeContext.jsx'

export default function UserMenu() {
  const navigate = useNavigate()
  const { theme, cycleTheme } = useTheme()
  const [displayName, setDisplayName] = useState('Guest')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getSession()
        if (!user) return
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
        if (data?.username) setDisplayName(data.username)
      } catch {}
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleSignOut = useCallback(async () => {
    try { await supabase.auth.signOut() } catch {}
    window.location.reload()
  }, [])

  const initial = (displayName || 'G').charAt(0).toUpperCase()

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
          className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-medium hover:bg-accent/20 active:scale-90 transition-all duration-150"
          aria-label="User menu"
        >
          {initial}
        </button>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg overflow-hidden fade-in">
            <div className="px-3 py-2.5 border-b border-border-subtle">
              <div className="text-sm font-medium text-fg truncate">{displayName}</div>
            </div>
            <div className="py-1">
              <button onClick={() => { setMenuOpen(false); navigate('/settings') }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors">
                <i className="bi bi-gear text-sm w-4" /> Settings
              </button>
            </div>
            <div className="border-t border-border-subtle">
              <button onClick={() => { setMenuOpen(false); setShowSignOut(true) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-surface-hover transition-colors">
                <i className="bi bi-box-arrow-right text-sm w-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-xl max-w-sm w-full mx-4 p-5 fade-in">
            <p className="text-fg text-sm leading-relaxed mb-4">
              This will clear your current session. You may lose access to your uploaded library from this browser.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSignOut(false)} className="px-4 py-2 text-sm text-fg-muted hover:text-fg transition-colors rounded-lg">Cancel</button>
              <button onClick={handleSignOut} className="px-4 py-2 text-sm text-white bg-red-400 hover:bg-red-300 rounded-lg transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
