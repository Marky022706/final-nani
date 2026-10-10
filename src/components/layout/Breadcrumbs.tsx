import React from 'react';
import type { UserRole } from '../../types';
import { useBreadcrumbs, type BreadcrumbItem } from '../../context/BreadcrumbContext';

export type { BreadcrumbItem };

interface BreadcrumbsProps {
  currentRole?: UserRole;
  currentDestination?: string;
  onNavigate?: (destination: string) => void;
  items?: BreadcrumbItem[];
}

interface NavMeta {
  label: string;
  category?: string;
  categoryRoute?: string;
}

const DESTINATION_META: Record<string, NavMeta> = {
  books: {
    label: 'Book Management'
  },
  members: {
    label: 'Manage Members'
  },
  attendance: {
    label: 'Attendance Tracker'
  },
  circulation: {
    label: 'Circulation & Loans'
  },
  services: {
    label: 'Library Services'
  },
  notifications: {
    label: 'Notifications'
  },
  history: {
    label: 'Activity History'
  },
  reports: {
    label: 'Analytics & Reports'
  },
  admin_mgmt: {
    category: 'Governance',
    categoryRoute: 'admin_mgmt',
    label: 'Admin Accounts'
  },
  audit_logs: {
    category: 'Governance',
    categoryRoute: 'admin_mgmt',
    label: 'Audit Trail'
  },
  system_settings: {
    category: 'Governance',
    categoryRoute: 'admin_mgmt',
    label: 'System Settings'
  },
  my_books: {
    label: 'My Borrowed Books'
  },
  reservations: {
    label: 'Hold Reservations'
  },
  profile: {
    label: 'Profile & Digital Card'
  }
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentRole,
  currentDestination = 'dashboard',
  onNavigate,
  items: customItems
}) => {
  const { subTrail, clearSubTrail } = useBreadcrumbs();

  // Dynamically assemble breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    if (customItems && customItems.length > 0) {
      return customItems;
    }

    const isDashboard = currentDestination === 'dashboard';
    const hasSubTrail = subTrail && subTrail.length > 0;

    // Always start with Dashboard
    const list: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        route: 'dashboard',
        current: isDashboard && !hasSubTrail
      }
    ];

    if (isDashboard) {
      if (hasSubTrail) {
        list.push(...subTrail);
      }
      return list;
    }

    const meta = DESTINATION_META[currentDestination];

    if (meta) {
      // Add Category parent if present (e.g. Governance for Super Admin settings/audit)
      if (meta.category) {
        list.push({
          label: meta.category,
          route: meta.categoryRoute || currentDestination,
          current: false
        });
      }

      // Customize label based on role
      let pageLabel = meta.label;
      if (currentDestination === 'books' && currentRole === 'member') {
        pageLabel = 'Book Catalog';
      }

      // Add Primary Destination
      list.push({
        label: pageLabel,
        route: currentDestination,
        current: !hasSubTrail
      });

      // Append dynamic sub-items (e.g. active tab, filter mode, or selected record)
      if (hasSubTrail) {
        list.push(...subTrail);
      }
    } else {
      // Fallback for dynamic custom destinations
      const formatted =
        currentDestination.charAt(0).toUpperCase() +
        currentDestination.slice(1).replace(/_/g, ' ');

      list.push({
        label: formatted,
        route: currentDestination,
        current: !hasSubTrail
      });

      if (hasSubTrail) {
        list.push(...subTrail);
      }
    }

    return list;
  }, [currentDestination, currentRole, customItems, subTrail]);

  const handleItemClick = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    item: BreadcrumbItem
  ) => {
    e.preventDefault();
    if (item.onClick) {
      item.onClick();
    } else if (item.route && onNavigate) {
      clearSubTrail();
      onNavigate(item.route);
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs-nav">
      <ol className="breadcrumbs-list">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1 || Boolean(item.current);

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <li className="breadcrumb-item">
                {isLast ? (
                  <span
                    className="breadcrumb-current-text"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleItemClick(e, item)}
                    className="breadcrumb-link-btn"
                    title={`Go to ${item.label}`}
                  >
                    {item.label}
                  </button>
                )}
              </li>

              {/* Visual separator '>' between items */}
              {!isLast && (
                <li className="breadcrumb-separator-symbol" aria-hidden="true">
                  &gt;
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
