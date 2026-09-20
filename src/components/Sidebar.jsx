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

  const libraryItems = [
    { path: '/', label: 'Home', icon: HouseFill },
    { path: '/search', label: 'Search', icon: Search },
  ];

  const playlistItems = [
    { path: '/playlists', label: 'Playlists', icon: ListUl },
    { path: '/favourites', label: 'Favourites', icon: Heart },
    { path: '/upload', label: 'Import', icon: Upload },
  ];

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ item }) => (
    <Link
      to={item.path}
      className={`nav-item w-20 flex items-center justify-center flex-shrink-0 transition-all border-2 border-transparent rounded-lg ${
        isExpanded ? 'h-auto py-2 px-4' : 'h-16 justify-center'
      } ${
        isActive(item.path)
          ? 'bg-accent-soft border-accent text-accent'
          : 'bg-surface-hover hover:bg-surface-hover hover:border-accent'
      }`}
      title={item.label}
    >
      <item.icon size={18} className="flex-shrink-0" />
      {isExpanded && (
        <span className="ml-3 text-sm font-500 whitespace-nowrap">
          {item.label}
        </span>
      )}
    </Link>
  );

  const SectionLabel = ({ label }) => (
    isExpanded && (
      <div className="px-4 py-2 text-xs uppercase font-600 text-fg-muted tracking-wider">
        {label}
      </div>
    )
  );

  return (
      <aside
        className={`sidebar transition-all duration-280 overflow-y-auto flex flex-col h-screen bg-surface border-r border-border ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
      >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="nav-item w-16 h-16 flex items-center justify-center flex-shrink-0 hover:bg-surface-hover transition-colors rounded-lg m-2"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Echo Logo */}
      {isExpanded && (
        <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
          <span className="text-2xl">🎵</span>
          <span className="font-600 text-lg">Echo</span>
        </div>
      )}

      {/* Scrollable Nav Content */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
        {libraryItems.map(item => (
          <NavItem key={item.path} item={item} />
        ))}
        {playlistItems.map(item => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Settings Section (Bottom) */}
      <div className="border-t border-border pt-2 px-2 pb-4">
        <SectionLabel label="Settings" />
        <div className="flex flex-col gap-1">
          <NavItem item={{ path: '/settings', label: 'Settings', icon: Gear }} />
        </div>
      </div>
    </aside>
  );
};