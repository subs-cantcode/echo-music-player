import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HouseFill,
  Search,
  ListUl,
  Heart,
  Upload,
  Gear,
  ChevronLeft,
  ChevronRight,
} from 'react-bootstrap-icons';

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: HouseFill },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/playlists', label: 'Playlists', icon: ListUl },
    { path: '/favourites', label: 'Favourites', icon: Heart },
    { path: '/upload', label: 'Import', icon: Upload },
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
          {isExpanded ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        {/* Nav Items */}
        {navItems.map(item => {
          const IconComponent = item.icon;
          return (
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
              <IconComponent size={24} />
            </Link>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings Button (bottom) */}
        <Link
          to="/settings"
          className="nav-item w-20 h-20 flex items-center justify-center flex-shrink-0 transition-colors border-2 border-transparent hover:bg-surface-hover hover:border-accent"
          title="Settings"
        >
          <Gear size={24} />
        </Link>
      </nav>
    </aside>
  );
};