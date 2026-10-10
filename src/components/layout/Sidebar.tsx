import React from 'react';
import type { UserRole, User as UserType } from '../../types';
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
  ChevronRight,
  Archive
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  badge?: number;
}

interface SidebarProps {
  currentRole: UserRole;
  currentDestination: string;
  onNavigate: (destination: string) => void;
  unreadNotifsCount: number;
  currentUser?: UserType;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  currentDestination,
  onNavigate,
  unreadNotifsCount,
  currentUser
}) => {
  const getNavItems = (): NavItem[] => {
    if (currentRole === 'super_admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'admin_mgmt', label: 'User & Access Management', icon: Users },
        { id: 'audit_logs', label: 'Audit Logs', icon: ShieldCheck },
        { id: 'system_settings', label: 'System Settings', icon: Settings }
      ];
    }

    if (currentRole === 'admin') {
      const privs = currentUser?.privileges;
      const items: NavItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ];

      if (!privs || privs.inventoryManagement !== false) {
        items.push({ id: 'books', label: 'Books', icon: BookOpen });
      }
      if (!privs || privs.memberManagement !== false) {
        items.push({ id: 'members', label: 'Manage Members', icon: UserCheck });
      }
      if (!privs || privs.inventoryManagement !== false) {
        items.push({ id: 'archive', label: 'Archive', icon: Archive });
      }
      if (!privs || privs.servicesManagement !== false) {
        items.push({ id: 'attendance', label: 'Attendance', icon: Clock });
      }
      if (!privs || privs.circulationDesk !== false) {
        items.push({ id: 'circulation', label: 'Circulation', icon: Repeat });
      }
      items.push({ id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined });
      items.push({ id: 'history', label: 'History', icon: History });
      if (!privs || privs.reportsExport !== false) {
        items.push({ id: 'reports', label: 'Reports', icon: BarChart3 });
      }
      items.push({ id: 'admin_mgmt', label: 'User & Access Management', icon: Users });
      return items;
    }

    if (currentRole === 'volunteer') {
      const privs = currentUser?.privileges;
      const items: NavItem[] = [
        { id: 'dashboard', label: 'Operations Desk', icon: LayoutDashboard }
      ];

      // Volunteer navigation items are strictly driven by granted privileges
      if (!privs || privs.servicesManagement !== false) {
        items.push({ id: 'attendance', label: 'Attendance', icon: Clock });
      }
      if (!privs || privs.circulationDesk !== false) {
        items.push({ id: 'circulation', label: 'Circulation & Loans', icon: Repeat });
      }
      if (privs?.inventoryManagement) {
        items.push({ id: 'books', label: 'Book Catalog', icon: BookOpen });
      }
      if (!privs || privs.memberManagement !== false) {
        items.push({ id: 'members', label: 'Manage Members', icon: UserCheck });
      }
      if (privs?.reportsExport) {
        items.push({ id: 'reports', label: 'Reports', icon: BarChart3 });
      }
      items.push({ id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined });
      return items;
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
          <img
            src="/logo.png"
            alt="Balingasag Municipal Library Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
          />
        </div>
        <div className="brand-info">
          <div className="brand-title">Balingasag Library</div>
          <div className="brand-subtitle">Municipal Library System</div>
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
            >
              <span className="nav-accent-bar" aria-hidden="true" />
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} className="nav-item-icon" />
              <span className="nav-item-label" style={{ flex: 1 }}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: isActive ? 'var(--deep-green)' : 'var(--danger)',
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
              <ChevronRight
                size={14}
                className="nav-slide-indicator"
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

