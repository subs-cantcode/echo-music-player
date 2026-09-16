import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: 'bi-house', label: 'Home', end: true },
  { to: '/search', icon: 'bi-search', label: 'Search' },
  { to: '/playlists', icon: 'bi-music-note-list', label: 'Playlists' },
  { to: '/favourites', icon: 'bi-heart', label: 'Favourites' },
  { to: '/settings', icon: 'bi-gear', label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-panel z-30 flex flex-col transition-all duration-250 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      {/* Header with app name + toggle */}
      <div className="flex items-center justify-between px-4 h-16 flex-shrink-0">
        {!collapsed && (
          <span className="font-serif text-lg font-medium text-text-primary truncate">
            Echo
          </span>
        )}
        <button
          onClick={onToggle}
          className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-lg`} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded transition-colors ${
                isActive
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <i className={`bi ${item.icon} text-xl flex-shrink-0`} />
            {!collapsed && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
