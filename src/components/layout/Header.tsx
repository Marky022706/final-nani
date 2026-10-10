import React, { useState } from 'react';
import type { User, UserRole } from '../../types';
import { QrCode, Bell, Search } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { UserProfileDropdown } from './UserProfileDropdown';

interface HeaderProps {
  currentUser: User;
  currentDestination: string;
  onNavigate: (destination: string) => void;
  onRoleChange?: (role: UserRole) => void;
  onOpenScanner: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onResetData?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentDestination,
  onNavigate,
  onOpenScanner,
  unreadCount,
  onOpenNotifications,
  onLogout
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

        {/* Notifications trigger */}
        <button
          onClick={onOpenNotifications}
          className="btn btn-ghost btn-sm"
          style={{ position: 'relative', padding: '8px' }}
          aria-label="View notifications"
        >
          <Bell size={18} color="var(--text-secondary)" />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--danger)',
                borderRadius: '50%',
                border: '2px solid #ffffff'
              }}
            />
          )}
        </button>


        {/* Interactive User Profile Dropdown */}
        <UserProfileDropdown
          currentUser={currentUser}
          onNavigate={onNavigate}
          onRequestLogout={onLogout || (() => {})}
        />
      </div>
    </header>
  );
};

