import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const navItems = [
  { to: '/', icon: 'bi-house', label: 'Home', end: true },
  { to: '/upload', icon: 'bi-cloud-upload', label: 'Upload' },
  { to: '/search', icon: 'bi-search', label: 'Search' },
  { to: '/playlists', icon: 'bi-music-note-list', label: 'Playlists' },
  { to: '/favourites', icon: 'bi-heart', label: 'Favourites' },
  { to: '/settings', icon: 'bi-gear', label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData?.session?.user
        if (!user) {
          setDisplayName('Guest')
          return
        }
        const { data } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .maybeSingle()
        const name = data?.username || 'Guest'
        setProfile(data)
        setDisplayName(name)
      } catch {
        setDisplayName('Guest')
      }
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

  const handleNameSave = useCallback(async () => {
    const trimmed = displayName.trim()
    if (!trimmed || trimmed === (profile?.username || '')) {
      setEditingName(false)
      setDisplayName(profile?.username || 'Guest')
      return
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) return
      const { error } = await supabase
        .from('profiles')
        .update({ username: trimmed })
        .eq('id', user.id)
      if (error) {
        console.warn('Could not update username:', error)
        setDisplayName(profile?.username || 'Guest')
      } else {
        setProfile((p) => ({ ...p, username: trimmed }))
      }
    } catch {
      setDisplayName(profile?.username || 'Guest')
    }
    setEditingName(false)
  }, [displayName, profile])

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }, [])

  const initial = (displayName || 'G').charAt(0).toUpperCase()

  return (
    <>
    <aside
      className={`fixed top-0 left-0 h-full bg-panel z-30 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Header with app name + toggle */}
      <div className="flex items-center px-4 h-16 flex-shrink-0">
        <div className="flex-1 min-w-0">
          {!collapsed && (
            <span className="font-serif text-lg font-medium text-text-primary truncate block sidebar-label">
              Echo
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-text-secondary hover:text-text-primary transition-colors duration-200 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-lg transition-transform duration-300`} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 mt-1">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname === item.to || location.pathname.startsWith(item.to + '/')

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg btn-press ${
                isActive
                  ? 'active text-accent font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <i className={`bi ${item.icon} text-xl flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              {!collapsed && (
                <span className="text-sm truncate sidebar-label">{item.label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Account section */}
      <div className={`flex-shrink-0 border-t border-border/50 ${collapsed ? 'px-2 py-3' : 'px-4 py-3'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium flex-shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              {editingName ? (
                <input
                  autoFocus
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave()
                    if (e.key === 'Escape') {
                      setEditingName(false)
                      setDisplayName(profile?.username || 'Guest')
                    }
                  }}
                  className="flex-1 min-w-0 bg-transparent border-b border-accent text-text-primary text-sm outline-none px-0 py-0"
                />
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="flex-1 min-w-0 text-sm text-text-primary text-left truncate hover:text-accent transition-colors"
                  title="Click to edit display name"
                >
                  {displayName}
                </button>
              )}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="text-text-secondary hover:text-text-primary transition-colors p-0.5 rounded"
                  aria-label="Account menu"
                >
                  <i className="bi bi-three-dots-vertical text-sm" />
                </button>
                {menuOpen && (
                  <div className="absolute bottom-full right-0 mb-1 bg-panel border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        setShowSignOutConfirm(true)
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors"
                      style={{ color: document.documentElement.classList.contains('dark') ? '#E5726B' : '#D64545' }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>

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
    </>
  )
}
