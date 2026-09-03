import React from 'react';
import type { UserRole } from '../../types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  Clock,
  Repeat,
  Bell,
  History,
  BarChart3,
  ShieldCheck,
  Settings,
  BookmarkCheck,
  User,
  Library
} from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  currentDestination: string;
  onNavigate: (destination: string) => void;
  unreadNotifsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  currentDestination,
  onNavigate,
  unreadNotifsCount
}) => {
  const getNavItems = () => {
    if (currentRole === 'super_admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'admin_mgmt', label: 'Admin Management', icon: Users },
        { id: 'books', label: 'Books', icon: BookOpen },
        { id: 'members', label: 'Manage Members', icon: UserCheck },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'circulation', label: 'Circulation', icon: Repeat },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined },
        { id: 'history', label: 'History', icon: History },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'audit_logs', label: 'Audit Logs', icon: ShieldCheck },
        { id: 'system_settings', label: 'System Settings', icon: Settings }
      ];
    }

    if (currentRole === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'books', label: 'Books', icon: BookOpen },
        { id: 'members', label: 'Manage Members', icon: UserCheck },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'circulation', label: 'Circulation', icon: Repeat },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined },
        { id: 'history', label: 'History', icon: History },
        { id: 'reports', label: 'Reports', icon: BarChart3 }
      ];
    }

    // Member navigation
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'books', label: 'Book Catalog', icon: BookOpen },
      { id: 'my_books', label: 'My Books', icon: BookmarkCheck },
      { id: 'reservations', label: 'Reservations', icon: Repeat },
      { id: 'attendance', label: 'Attendance', icon: Clock },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined },
      { id: 'history', label: 'History', icon: History },
      { id: 'profile', label: 'Profile & Card', icon: User }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="app-sidebar no-print">
      <div className="sidebar-header">
        <div className="library-brand-icon">
          <Library size={20} strokeWidth={2.2} />
        </div>
        <div className="brand-info">
          <div className="brand-title">Balingasag Library</div>
          <div className="brand-subtitle">Public Library System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentDestination === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    lineHeight: 1.3
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#34d399',
              boxShadow: '0 0 0 2px rgba(52, 211, 153, 0.25)'
            }}
          />
          <span style={{ fontSize: '11.5px', color: '#a7f3d0', fontWeight: 500 }}>
            LLM Studio API Online
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
          BPL v2.4 • Misamis Oriental
        </div>
      </div>
    </aside>
  );
};
