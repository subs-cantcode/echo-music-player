import { NavLink, useLocation } from 'react-router-dom'

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

  return (
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
    </aside>
  )
}
