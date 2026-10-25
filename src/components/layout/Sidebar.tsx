import React, { useMemo, useState, useEffect } from 'react';
import type { UserRole, User as UserType } from '../../types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  Clock,
  Repeat,
  History,
  BarChart3,
  ShieldCheck,
  Settings,
  BookmarkCheck,
  CalendarCheck,
  User,
  ChevronRight,
  Archive,
  HelpCircle,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  badge?: number;
}

export interface NavCategory {
  id: string;
  title: string;
  items: NavItem[];
}

export type SidebarNavItem = NavItem;
export type NavLeafItem = NavItem;
export type NavSingleItem = NavItem;

interface SidebarProps {
  currentRole: UserRole;
  currentDestination: string;
  onNavigate: (destination: string) => void;
  unreadNotifsCount: number;
  currentUser?: UserType;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const STORAGE_COLLAPSED_KEY = 'bpl_sidebar_collapsed';

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  currentDestination,
  onNavigate,
  unreadNotifsCount,
  currentUser,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
  isMobileOpen = false,
  onCloseMobile
}) => {
  // Support both controlled and self-persisting collapsed state
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem(STORAGE_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
    }
  };

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Handle destination navigation & auto-close mobile drawer
  const handleItemClick = (destinationId: string) => {
    onNavigate(destinationId);
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  /**
   * Static Categorized Navigation Structure
   * Groups items under: OVERVIEW, LIBRARY MANAGEMENT, USER MANAGEMENT, REPORTS & ACTIVITIES, ACCOUNT
   * Filters out items/categories disallowed for the active role or privilege set.
   */
  const categories = useMemo<NavCategory[]>(() => {
    const cats: NavCategory[] = [];

    // =========================================================================
    // 1. OVERVIEW
    // =========================================================================
    cats.push({
      id: 'overview',
      title: 'OVERVIEW',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    });

    // =========================================================================
    // 2. LIBRARY MANAGEMENT
    // =========================================================================
    const libraryItems: NavItem[] = [];

    if (currentRole === 'super_admin') {
      // Super admin is governance-focused, but if catalog lookups are needed, can be mapped here.
    } else if (currentRole === 'admin') {
      const privs = currentUser?.privileges;
      if (!privs || privs.inventoryManagement !== false) {
        libraryItems.push({ id: 'books', label: 'Books', icon: BookOpen });
      }
      if (!privs || privs.circulationDesk !== false) {
        libraryItems.push({ id: 'circulation', label: 'Circulation', icon: Repeat });
      }
      if (!privs || privs.servicesManagement !== false) {
        libraryItems.push({ id: 'attendance', label: 'Attendance', icon: Clock });
      }
      if (!privs || privs.inventoryManagement !== false) {
        libraryItems.push({ id: 'archive', label: 'Archive', icon: Archive });
      }
    } else if (currentRole === 'volunteer') {
      const privs = currentUser?.privileges;
      if (!privs || privs.servicesManagement !== false) {
        libraryItems.push({ id: 'attendance', label: 'Attendance', icon: Clock });
      }
      if (!privs || privs.circulationDesk !== false) {
        libraryItems.push({ id: 'circulation', label: 'Circulation', icon: Repeat });
      }
      if (privs?.inventoryManagement) {
        libraryItems.push({ id: 'books', label: 'Books', icon: BookOpen });
      }
    } else if (currentRole === 'member') {
      libraryItems.push({ id: 'books', label: 'Book Catalog', icon: BookOpen });
      libraryItems.push({ id: 'my_books', label: 'My Books', icon: BookmarkCheck });
      libraryItems.push({ id: 'reservations', label: 'Reservations', icon: CalendarCheck });
      libraryItems.push({ id: 'attendance', label: 'Attendance', icon: Clock });
    }

    if (libraryItems.length > 0) {
      cats.push({
        id: 'library_mgmt',
        title: 'LIBRARY MANAGEMENT',
        items: libraryItems
      });
    }

    // =========================================================================
    // 3. USER MANAGEMENT
    // =========================================================================
    const userItems: NavItem[] = [];

    if (currentRole === 'super_admin') {
      userItems.push({ id: 'admin_mgmt', label: 'Library Staff', icon: Users });
    } else if (currentRole === 'admin') {
      const privs = currentUser?.privileges;
      if (!privs || privs.memberManagement !== false) {
        userItems.push({ id: 'members', label: 'Manage Members', icon: UserCheck });
      }
      userItems.push({ id: 'admin_mgmt', label: 'Library Staff', icon: Users });
    } else if (currentRole === 'volunteer') {
      const privs = currentUser?.privileges;
      if (!privs || privs.memberManagement !== false) {
        userItems.push({ id: 'members', label: 'Manage Members', icon: UserCheck });
      }
    }

    if (userItems.length > 0) {
      cats.push({
        id: 'user_mgmt',
        title: 'USER MANAGEMENT',
        items: userItems
      });
    }

    // =========================================================================
    // 4. REPORTS & ACTIVITIES
    // =========================================================================
    const activityItems: NavItem[] = [];

    if (currentRole === 'super_admin') {
      activityItems.push({ id: 'audit_logs', label: 'Audit Logs', icon: ShieldCheck });
      activityItems.push({
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined
      });
    } else if (currentRole === 'admin') {
      const privs = currentUser?.privileges;
      if (!privs || privs.reportsExport !== false) {
        activityItems.push({ id: 'reports', label: 'Reports', icon: BarChart3 });
      }
      activityItems.push({ id: 'history', label: 'History', icon: History });
      activityItems.push({
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined
      });
    } else if (currentRole === 'volunteer') {
      const privs = currentUser?.privileges;
      if (privs?.reportsExport) {
        activityItems.push({ id: 'reports', label: 'Reports', icon: BarChart3 });
      }
      activityItems.push({ id: 'history', label: 'History', icon: History });
      activityItems.push({
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined
      });
    } else if (currentRole === 'member') {
      activityItems.push({ id: 'history', label: 'History', icon: History });
      activityItems.push({
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined
      });
    }

    if (activityItems.length > 0) {
      cats.push({
        id: 'reports_activities',
        title: 'REPORTS & ACTIVITIES',
        items: activityItems
      });
    }

    // =========================================================================
    // 5. ACCOUNT
    // =========================================================================
    const accountItems: NavItem[] = [];

    accountItems.push({ id: 'profile', label: 'Profile', icon: User });

    if (currentRole === 'super_admin') {
      accountItems.push({ id: 'system_settings', label: 'Settings', icon: Settings });
    }

    accountItems.push({ id: 'help_support', label: 'Help & Support', icon: HelpCircle });

    cats.push({
      id: 'account',
      title: 'ACCOUNT',
      items: accountItems
    });

    return cats;
  }, [currentRole, currentUser, unreadNotifsCount]);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar no-print ${isCollapsed ? 'collapsed' : 'expanded'} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Main Navigation"
      >
        {/* ===================================================================== */}
        {/* SIDEBAR HEADER: Branding & Global Toggle Button                       */}
        {/* ===================================================================== */}
        <div className="sidebar-header">
          {!isCollapsed ? (
            <>
              <div className="sidebar-brand-wrapper">
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

              {/* Global Sidebar Toggle Control (Collapse) */}
              <button
                type="button"
                onClick={handleToggle}
                className="sidebar-toggle-btn"
                aria-label="Collapse sidebar"
                aria-expanded={true}
                title="Collapse sidebar (icons only)"
              >
                <PanelLeftClose size={18} strokeWidth={2.2} />
              </button>
            </>
          ) : (
            <div className="sidebar-collapsed-header-controls">
              {/* Brand Logo Button (Click to expand) */}
              <button
                type="button"
                onClick={handleToggle}
                className="sidebar-collapsed-logo-btn"
                aria-label="Expand sidebar"
                title="Expand sidebar (Show text & labels)"
              >
                <div className="library-brand-icon">
                  <img
                    src="/logo.png"
                    alt="Balingasag Municipal Library Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                  />
                </div>
              </button>

              {/* Global Sidebar Toggle Control (Expand back to full menu) */}
              <button
                type="button"
                onClick={handleToggle}
                className="sidebar-toggle-btn"
                aria-label="Expand sidebar"
                aria-expanded={false}
                title="Expand sidebar (Show text & labels)"
              >
                <PanelLeftOpen size={18} strokeWidth={2.2} />
              </button>
            </div>
          )}

          {/* Mobile Drawer Close Button */}
          {isMobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="sidebar-mobile-close-btn"
              aria-label="Close sidebar drawer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ===================================================================== */}
        {/* SIDEBAR NAV: Static Category Headings & Non-Nested Direct Nav Items   */}
        {/* ===================================================================== */}
        <nav className="sidebar-nav" aria-label="Sidebar Categories">
          {categories.map((category, catIdx) => (
            <div key={category.id} className="sidebar-category-group">
              {/* Static Category Heading (Never clickable, no dropdown) */}
              {!isCollapsed ? (
                <div
                  className="sidebar-category-header"
                  role="presentation"
                  id={`cat-heading-${category.id}`}
                >
                  {category.title}
                </div>
              ) : (
                catIdx > 0 && <div className="sidebar-category-divider" role="separator" />
              )}

              {/* Direct Navigation Items under this Category */}
              <div
                className="sidebar-category-items"
                role="group"
                aria-labelledby={!isCollapsed ? `cat-heading-${category.id}` : undefined}
              >
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentDestination === item.id;

                  return (
                    <div key={item.id} className="sidebar-nav-item-wrapper">
                      <button
                        type="button"
                        onClick={() => handleItemClick(item.id)}
                        className={`nav-item ${isActive ? 'active' : ''} ${
                          isCollapsed ? 'collapsed-item' : ''
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={isCollapsed ? item.label : undefined}
                      >
                        {/* Active Accent Bar */}
                        <span className="nav-accent-bar" aria-hidden="true" />

                        {/* Navigation Icon */}
                        <Icon
                          size={19}
                          strokeWidth={isActive ? 2.4 : 1.9}
                          className="nav-item-icon"
                        />

                        {/* Text Label (Hidden in Collapsed State) */}
                        {!isCollapsed && (
                          <span className="nav-item-label" style={{ flex: 1 }}>
                            {item.label}
                          </span>
                        )}

                        {/* Badge Indicator */}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`nav-badge ${isCollapsed ? 'nav-badge-collapsed' : ''}`}
                            aria-label={`${item.badge} unread items`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Right Chevron Indicator (Expanded state only) */}
                        {!isCollapsed && (
                          <ChevronRight
                            size={14}
                            className="nav-slide-indicator"
                            strokeWidth={isActive ? 2.5 : 2}
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      {/* Tooltip on Hover in Collapsed State */}
                      {isCollapsed && (
                        <div className="sidebar-tooltip" role="tooltip">
                          <span className="sidebar-tooltip-label">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="sidebar-tooltip-badge">{item.badge}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ===================================================================== */}
        {/* SIDEBAR FOOTER: Collapsed Status Notice or Version Tag                */}
        {/* ===================================================================== */}
        <div className="sidebar-footer">
          {!isCollapsed ? (
            <div className="sidebar-footer-content">
              <span className="sidebar-footer-brand">Balay Silangan Compound</span>
              <span className="sidebar-footer-ver">Poblacion, Balingasag</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              className="sidebar-footer-expand-btn"
              aria-label="Expand sidebar"
              title="Expand sidebar (Show text & labels)"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
