import React, { useState, useRef, useEffect } from 'react';
import type { User as UserType } from '../../types';
import { User, Settings, LogOut, ChevronDown, Mail, HelpCircle } from 'lucide-react';

interface UserProfileDropdownProps {
  currentUser: UserType;
  onNavigate: (destination: string) => void;
  onOpenProfile?: () => void;
  onOpenAccountSettings?: () => void;
  onRequestLogout: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  currentUser,
  onNavigate,
  onOpenProfile,
  onOpenAccountSettings,
  onRequestLogout
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Format role label nicely
  const roleDisplay =
    currentUser.role === 'super_admin'
      ? 'Super Admin'
      : currentUser.role === 'admin'
      ? 'Administrator'
      : currentUser.role === 'volunteer'
      ? 'Volunteer Staff'
      : 'Member';

  // Compute initials
  const initials = currentUser.name
    ? currentUser.name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (destination?: string) => {
    setIsOpen(false);
    if (destination) {
      onNavigate(destination);
    }
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onRequestLogout();
  };

  return (
    <div className="user-profile-dropdown-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`header-user-profile-btn ${isOpen ? 'active' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Open profile menu"
      >
        <div className="header-user-avatar" aria-hidden="true">
          {initials}
        </div>

        <div className="header-user-text">
          <div className="header-user-name">{currentUser.name}</div>
          <div className="header-user-role">{roleDisplay}</div>
        </div>

        <ChevronDown
          size={14}
          strokeWidth={2.4}
          className={`header-user-chevron ${isOpen ? 'rotate-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Interactive Dropdown Menu */}
      {isOpen && (
        <div
          className="user-profile-menu"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-profile-button"
        >
          {/* User Information Header */}
          <div className="profile-menu-header">
            <div className="profile-menu-avatar-large">
              {initials}
            </div>
            <div className="profile-menu-meta">
              <div className="profile-menu-name">{currentUser.name}</div>
              <div className="profile-menu-email">
                <Mail size={12} style={{ flexShrink: 0 }} />
                <span>{currentUser.email}</span>
              </div>
              <div className="profile-menu-badge">
                <span className="sidebar-status-dot" style={{ width: 6, height: 6 }} />
                <span className="profile-role-tag">{roleDisplay}</span>
              </div>
            </div>
          </div>

          <div className="profile-menu-divider" role="separator" />

          {/* Menu Options */}
          <div className="profile-menu-items">
            {/* 1. My Profile */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                if (onOpenProfile) {
                  onOpenProfile();
                } else if (currentUser.role === 'member') {
                  handleSelect('profile');
                } else {
                  handleSelect('dashboard');
                }
              }}
              className="profile-menu-item"
            >
              <User size={16} className="profile-menu-icon" />
              <span>My Profile</span>
            </button>

            {/* 2. Account Settings */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                if (onOpenAccountSettings) {
                  onOpenAccountSettings();
                } else if (currentUser.role === 'super_admin') {
                  handleSelect('system_settings');
                } else {
                  handleSelect('dashboard');
                }
              }}
              className="profile-menu-item"
            >
              <Settings size={16} className="profile-menu-icon" />
              <span>Account Settings</span>
            </button>

            {/* 2b. Help & Support */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect('help_support')}
              className="profile-menu-item"
            >
              <HelpCircle size={16} className="profile-menu-icon" />
              <span>Help & Support</span>
            </button>
          </div>

          <div className="profile-menu-divider" role="separator" />

          {/* 3. Logout (Separated with Red/Danger treatment) */}
          <div className="profile-menu-items">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogoutClick}
              className="profile-menu-item profile-menu-item-danger"
            >
              <LogOut size={16} className="profile-menu-icon" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
