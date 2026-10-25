import React, { useState } from 'react';
import type { User, UserRole, NotificationItem } from '../../types';
import { QrCode, Search, Menu } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { UserProfileDropdown } from './UserProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface HeaderProps {
  currentUser: User;
  currentDestination: string;
  onNavigate: (destination: string) => void;
  onRoleChange?: (role: UserRole) => void;
  onOpenScanner: () => void;
  notifications?: NotificationItem[];
  unreadCount: number;
  onMarkAllAsRead?: () => void;
  onMarkSingleAsRead?: (id: string) => void;
  onDeleteSingle?: (id: string) => void;
  onClearAll?: () => void;
  onOpenNotifications?: () => void;
  onResetData?: () => void;
  onOpenProfile?: () => void;
  onOpenAccountSettings?: () => void;
  onLogout?: () => void;
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentDestination,
  onNavigate,
  onOpenScanner,
  notifications = [],
  unreadCount,
  onMarkAllAsRead = () => {},
  onMarkSingleAsRead = () => {},
  onDeleteSingle,
  onClearAll,
  onOpenNotifications: _onOpenNotifications,
  onOpenProfile,
  onOpenAccountSettings,
  onLogout,
  onOpenMobileSidebar
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNavigate('books');
    }
  };

  return (
    <header className="app-header no-print">
      <div className="header-left">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="mobile-menu-btn"
            aria-label="Open sidebar navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <Breadcrumbs
          currentRole={currentUser.role}
          currentDestination={currentDestination}
          onNavigate={onNavigate}
        />
      </div>

      {/* Global Quick Search per spec */}
      <div className="header-search-container">
        <Search size={15} className="header-search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search catalog, members, records... (Enter)"
          className="header-search-input"
          aria-label="Quick search"
        />
      </div>

      <div className="header-right">

        {/* Attendance quick scanner button (for Librarian staff & Volunteers) */}
        {(currentUser.role === 'admin' || currentUser.role === 'volunteer') && (
          <button
            onClick={onOpenScanner}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
            title="Scan Member QR for Attendance or Circulation"
          >
            <QrCode size={16} color="var(--primary-green)" />
            <span>Scan QR / Card</span>
          </button>
        )}

        {/* Theme Appearance Quick Switcher */}
        <ThemeSwitcher variant="button" />

        {/* Interactive Notification Bell Dropdown */}
        <NotificationDropdown
          currentUser={currentUser}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllAsRead={onMarkAllAsRead}
          onMarkSingleAsRead={onMarkSingleAsRead}
          onDeleteSingle={onDeleteSingle}
          onClearAll={onClearAll}
          onNavigate={onNavigate}
        />


        {/* Interactive User Profile Dropdown */}
        <UserProfileDropdown
          currentUser={currentUser}
          onNavigate={onNavigate}
          onOpenProfile={onOpenProfile}
          onOpenAccountSettings={onOpenAccountSettings}
          onRequestLogout={onLogout || (() => {})}
        />
      </div>
    </header>
  );
};

