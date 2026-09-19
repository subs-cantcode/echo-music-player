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
      className={`sidebar transition-all duration-280 overflow-hidden flex flex-col h-screen bg-surface border-r border-border ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="nav-item w-20 h-20 flex items-center justify-center flex-shrink-0 hover:bg-surface-hover transition-colors border-2 border-transparent hover:border-accent"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Nav Items */}
      {navItems.map(item => {
        const IconComponent = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link w-20 flex items-center flex-shrink-0 transition-colors border-l-4 pl-0 ${
              isExpanded ? 'h-auto py-3 px-4' : 'h-20 justify-center border-l-4 pl-0'
            } ${
              isActive(item.path)
                ? 'bg-accent-soft border-l-accent text-accent'
                : 'hover:bg-surface-hover hover:border-l-accent border-l-transparent'
            }`}
            title={item.label}
          >
            <IconComponent size={18} className="flex-shrink-0" />

            {/* Label - Only show when expanded */}
            {isExpanded && (
              <span className="ml-4 text-sm font-500 whitespace-nowrap">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings Button (bottom) */}
      <Link
        to="/settings"
        className={`nav-link w-20 flex items-center flex-shrink-0 transition-colors border-l-4 pl-0 ${
          isExpanded ? 'h-auto py-3 px-4' : 'h-20 justify-center border-l-4 pl-0'
        } ${
          isActive('/settings')
            ? 'bg-accent-soft border-l-accent text-accent'
            : 'hover:bg-surface-hover hover:border-l-accent border-l-transparent'
        }`}
        title="Settings"
      >
        <Gear size={18} className="flex-shrink-0" />

        {/* Label - Only show when expanded */}
        {isExpanded && (
          <span className="ml-4 text-sm font-500 whitespace-nowrap">
            Settings
          </span>
        )}
      </Link>
    </aside>
  );
};