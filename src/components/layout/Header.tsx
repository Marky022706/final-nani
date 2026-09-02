import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '../../types';
import { QrCode, Bell, User as UserIcon, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '../common/Breadcrumbs';

interface HeaderProps {
  currentUser: User;
  currentDestination: string;
  onNavigate: (destination: string) => void;
  onRoleChange: (role: UserRole) => void;
  onOpenScanner: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentDestination,
  onNavigate,
  onRoleChange,
  onOpenScanner,
  unreadCount,
  onOpenNotifications,
  onResetData
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }) +
          ' • ' +
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header no-print">
      <div className="header-left">
        <Breadcrumbs
          currentRole={currentUser.role}
          currentDestination={currentDestination}
          onNavigate={onNavigate}
        />
        <div className="header-breadcrumbs-divider" />
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {timeStr}
        </span>
      </div>

      <div className="header-right">
        {/* Role Switcher for paired testing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Role:
          </span>
          <div className="role-switcher-container">
            <button
              onClick={() => onRoleChange('super_admin')}
              className={`role-tab ${currentUser.role === 'super_admin' ? 'active' : ''}`}
            >
              Super Admin
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`role-tab ${currentUser.role === 'admin' ? 'active' : ''}`}
            >
              Admin
            </button>
            <button
              onClick={() => onRoleChange('member')}
              className={`role-tab ${currentUser.role === 'member' ? 'active' : ''}`}
            >
              Member
            </button>
          </div>
        </div>

        {/* Attendance quick scanner button (for Admin and Super Admin) */}
        {currentUser.role !== 'member' && (
          <button
            onClick={onOpenScanner}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
            title="Scan Member QR for Attendance or Circulation"
          >
            <QrCode size={16} />
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
          <Bell size={18} />
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

        {/* Reset Mock Data trigger */}
        <button
          onClick={onResetData}
          className="btn btn-ghost btn-sm"
          title="Reset demo data to initial state"
          style={{ padding: '8px', color: 'var(--text-subtle)' }}
        >
          <RefreshCw size={15} />
        </button>

        {/* Active User pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingLeft: '8px',
            borderLeft: '1px solid var(--border-main)'
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <UserIcon size={16} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
