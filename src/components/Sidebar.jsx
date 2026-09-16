import { useState, useRef, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', icon: 'bi-house', label: 'Home', end: true },
  { to: '/upload', icon: 'bi-cloud-upload', label: 'Upload' },
  { to: '/search', icon: 'bi-search', label: 'Search' },
  { to: '/playlists', icon: 'bi-music-note-list', label: 'Playlists' },
  { to: '/favourites', icon: 'bi-heart', label: 'Favourites' },
  { to: '/settings', icon: 'bi-gear', label: 'Settings' },
]

function NavItem({ item, isActive, collapsed }) {
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef(null)

  const enter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setHovered(true)
  }, [])

  const leave = useCallback(() => {
    timerRef.current = setTimeout(() => setHovered(false), 100)
  }, [])

  return (
    <div
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <NavLink
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

      {/* Collapsed tooltip */}
      {collapsed && (
        <div
          className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-panel border border-border/60 rounded-md shadow-md text-xs text-text-primary whitespace-nowrap pointer-events-none z-50 transition-all duration-150 ease-out ${
            hovered
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-1'
          }`}
        >
          {item.label}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  return (
    <aside
      className={`sidebar-panel fixed top-0 left-0 h-full bg-panel z-30 flex flex-col ${
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
          className="player-btn w-8 h-8 text-text-secondary hover:text-text-primary flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-lg transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${collapsed ? 'rotate-0' : 'rotate-0'}`} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 mt-1">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname === item.to || location.pathname.startsWith(item.to + '/')

          return (
            <NavItem
              key={item.to}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
            />
          )
        })}
      </nav>
    </aside>
  )
}
