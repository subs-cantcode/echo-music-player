import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', icon: 'bi-house', label: 'Home', end: true },
  { to: '/search', icon: 'bi-search', label: 'Search' },
  { to: '/playlists', icon: 'bi-music-note-list', label: 'Playlists' },
  { to: '/favourites', icon: 'bi-heart', label: 'Favourites' },
  { to: '/upload', icon: 'bi-cloud-upload', label: 'Import' },
  { to: '/settings', icon: 'bi-gear', label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  return (
    <aside
      className={`sidebar frosted-panel fixed top-0 left-0 h-full bg-surface z-30 flex flex-col border-r border-border-subtle ${
        collapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      <div className="flex items-center h-14 px-4 flex-shrink-0">
        {!collapsed && (
          <span className="text-[15px] font-medium text-fg tracking-tight">
            Echo
          </span>
        )}
        <button
          onClick={onToggle}
          className="player-btn ml-auto w-7 h-7 text-fg-muted hover:text-fg"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-xs`} />
        </button>
      </div>

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
              className={`nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <i className={`bi ${item.icon} text-lg ${!collapsed ? 'w-5 text-center' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
