import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/search', label: 'Search', icon: '🔍' },
    { path: '/playlists', label: 'Playlists', icon: '≡' },
    { path: '/favourites', label: 'Favourites', icon: '♡' },
    { path: '/upload', label: 'Import', icon: '⬆' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={`sidebar transition-all duration-280 overflow-hidden ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      <nav className="flex flex-col h-full bg-surface border-r border-border">
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="nav-item w-20 h-20 flex items-center justify-center hover:bg-surface-hover transition-colors border-2 border-transparent hover:border-accent"
          title="Toggle sidebar"
        >
          <span className="text-lg">{isExpanded ? '‹' : '›'}</span>
        </button>

        {/* Nav Items */}
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item w-20 h-20 flex items-center justify-center flex-shrink-0 transition-colors border-2 border-transparent ${
              isActive(item.path)
                ? 'bg-accent-soft border-accent text-accent'
                : 'hover:bg-surface-hover hover:border-accent'
            }`}
            title={item.label}
          >
            <span className="text-2xl">{item.icon}</span>
          </Link>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings Button (bottom) */}
        <Link
          to="/settings"
          className="nav-item w-20 h-20 flex items-center justify-center flex-shrink-0 transition-colors border-2 border-transparent hover:bg-surface-hover hover:border-accent"
          title="Settings"
        >
          <span className="text-2xl">⚙</span>
        </Link>
      </nav>
    </aside>
  );
};