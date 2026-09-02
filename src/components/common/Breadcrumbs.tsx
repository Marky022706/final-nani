import React from 'react';
import type { UserRole } from '../../types';
import {
  ChevronRight,
  Home,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  BookOpen,
  Users,
  Clock,
  Repeat,
  Bell,
  History,
  BarChart3,
  Settings,
  User
} from 'lucide-react';

interface BreadcrumbsProps {
  currentRole: UserRole;
  currentDestination: string;
  onNavigate: (destination: string) => void;
}

const DESTINATION_LABELS: Record<string, { label: string; icon?: React.ElementType }> = {
  dashboard: { label: 'Dashboard', icon: Home },
  admin_mgmt: { label: 'Admin Management', icon: Users },
  books: { label: 'Books', icon: BookOpen },
  members: { label: 'Members', icon: UserCheck },
  attendance: { label: 'Attendance', icon: Clock },
  circulation: { label: 'Circulation', icon: Repeat },
  notifications: { label: 'Notifications', icon: Bell },
  history: { label: 'History', icon: History },
  reports: { label: 'Reports', icon: BarChart3 },
  audit_logs: { label: 'Audit Logs', icon: ShieldAlert },
  system_settings: { label: 'System Settings', icon: Settings },
  services: { label: 'Library Services' },
  my_books: { label: 'My Books' },
  reservations: { label: 'Reservations' },
  profile: { label: 'Profile & Card' }
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentRole,
  currentDestination,
  onNavigate
}) => {
  const roleLabel =
    currentRole === 'super_admin'
      ? 'Super Admin'
      : currentRole === 'admin'
      ? 'Admin'
      : 'Member';

  const RoleIcon =
    currentRole === 'super_admin'
      ? Shield
      : currentRole === 'admin'
      ? ShieldCheck
      : User;

  const currentItem = DESTINATION_LABELS[currentDestination] || {
    label: currentDestination.charAt(0).toUpperCase() + currentDestination.slice(1)
  };

  let activeLabel = currentItem.label;
  if (currentDestination === 'books' && currentRole === 'member') {
    activeLabel = 'Book Catalog';
  }

  const isAtRoot = currentDestination === 'dashboard';

  return (
    <nav aria-label="Breadcrumbs" className="breadcrumbs-nav">
      <ol className="breadcrumbs-list">
        {/* Root / Home item */}
        <li className="breadcrumb-item">
          <button
            onClick={() => onNavigate('dashboard')}
            className="breadcrumb-button breadcrumb-home"
            title="Go to Dashboard"
            aria-label="Dashboard Home"
          >
            <RoleIcon size={14} className="breadcrumb-icon" />
            <span className="breadcrumb-role-label">{roleLabel}</span>
          </button>
        </li>

        {/* Separator and Destination item if not at dashboard */}
        {!isAtRoot && (
          <>
            <li className="breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={13} strokeWidth={2.2} />
            </li>
            <li className="breadcrumb-item breadcrumb-current" aria-current="page">
              <span className="breadcrumb-active-label">{activeLabel}</span>
            </li>
          </>
        )}

        {/* When at dashboard, show Dashboard as current badge */}
        {isAtRoot && (
          <>
            <li className="breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={13} strokeWidth={2.2} />
            </li>
            <li className="breadcrumb-item breadcrumb-current" aria-current="page">
              <span className="breadcrumb-active-label">Dashboard</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
};
