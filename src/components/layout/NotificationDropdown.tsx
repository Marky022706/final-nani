import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { NotificationItem, User } from '../../types';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  Check,
  Trash2,
  X,
  ArrowRight
} from 'lucide-react';

interface NotificationDropdownProps {
  currentUser: User;
  notifications: NotificationItem[];
  unreadCount?: number;
  onMarkAllAsRead: () => void;
  onMarkSingleAsRead: (id: string) => void;
  onDeleteSingle?: (id: string) => void;
  onClearAll?: () => void;
  onNavigate: (destination: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  currentUser,
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onMarkSingleAsRead,
  onDeleteSingle,
  onClearAll,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Filter notifications relevant to the current user
  const relevantNotifs = useMemo(() => {
    return notifications.filter((notif) => {
      if (currentUser.role === 'member') {
        return notif.targetRole === 'member' || notif.targetMemberId === currentUser.memberId || notif.targetRole === 'all';
      }
      if (currentUser.role === 'admin') {
        return notif.targetRole === 'admin' || notif.targetRole === 'all';
      }
      if (currentUser.role === 'volunteer') {
        return notif.targetRole === 'volunteer' || notif.targetRole === 'admin' || notif.targetRole === 'all';
      }
      return true; // super_admin sees all
    });
  }, [notifications, currentUser]);

  const displayedNotifs = useMemo(() => {
    if (activeFilter === 'unread') {
      return relevantNotifs.filter((n) => !n.read);
    }
    return relevantNotifs;
  }, [relevantNotifs, activeFilter]);

  const totalUnread = useMemo(() => {
    return unreadCount !== undefined ? unreadCount : relevantNotifs.filter((n) => !n.read).length;
  }, [relevantNotifs, unreadCount]);

  // Close when clicking outside or pressing Escape
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

  // Handle clicking a notification card
  const handleNotificationClick = (notif: NotificationItem) => {
    // 1. Mark as read
    if (!notif.read) {
      onMarkSingleAsRead(notif.id);
    }

    // 2. Determine target destination
    let dest = notif.destination;
    if (!dest) {
      const titleLower = notif.title.toLowerCase();
      const msgLower = notif.message.toLowerCase();
      if (titleLower.includes('borrow') || titleLower.includes('loan') || titleLower.includes('overdue') || msgLower.includes('return')) {
        dest = currentUser.role === 'member' ? 'my_books' : 'circulation';
      } else if (titleLower.includes('reservation') || titleLower.includes('hold')) {
        dest = currentUser.role === 'member' ? 'reservations' : 'circulation';
      } else if (titleLower.includes('attendance') || msgLower.includes('time-in') || msgLower.includes('time-out')) {
        dest = 'attendance';
      } else if (titleLower.includes('book') || titleLower.includes('catalog')) {
        dest = 'books';
      }
    }

    // 3. Navigate if destination exists and close dropdown
    if (dest) {
      setIsOpen(false);
      onNavigate(dest);
    }
  };

  const handleQuickMarkRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onMarkSingleAsRead(id);
  };

  const handleQuickDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteSingle) {
      onDeleteSingle(id);
    } else {
      onMarkSingleAsRead(id);
    }
  };

  const handleViewAllClick = () => {
    setIsOpen(false);
    onNavigate('notifications');
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="var(--success, #16a34a)" />;
      case 'warning':
        return <AlertTriangle size={16} color="var(--warning, #d97706)" />;
      case 'alert':
        return <AlertCircle size={16} color="var(--danger, #dc2626)" />;
      default:
        return <Info size={16} color="var(--accent-blue, #2563eb)" />;
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`notification-trigger-btn ${isOpen ? 'active' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="View Notifications"
        aria-label={`Notifications (${totalUnread} unread)`}
      >
        <Bell size={18} color={isOpen ? 'var(--deep-green, #166534)' : 'var(--text-secondary)'} />
        {totalUnread > 0 && (
          <span className="notification-trigger-badge" aria-hidden="true">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Interactive Dropdown Panel */}
      {isOpen && (
        <div
          className="notifications-dropdown-menu"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="notification-dropdown-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {totalUnread > 0 && (
                <span
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}
                >
                  {totalUnread} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {totalUnread > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="btn btn-ghost btn-xs"
                  style={{
                    fontSize: '11px',
                    color: '#166534',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                  title="Mark all notifications as read"
                >
                  <Check size={12} />
                  <span>Mark all read</span>
                </button>
              )}

              {onClearAll && relevantNotifs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="btn btn-ghost btn-xs"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '3px 6px',
                    borderRadius: '6px'
                  }}
                  title="Clear all notifications"
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills (All / Unread) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid var(--border-subtle, #f1f5f9)'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                fontSize: '11.5px',
                fontWeight: activeFilter === 'all' ? 700 : 500,
                color: activeFilter === 'all' ? '#166534' : 'var(--text-muted)',
                backgroundColor: activeFilter === 'all' ? '#ffffff' : 'transparent',
                border: activeFilter === 'all' ? '1px solid var(--border-main)' : '1px solid transparent',
                borderRadius: '12px',
                padding: '2px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All ({relevantNotifs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              style={{
                fontSize: '11.5px',
                fontWeight: activeFilter === 'unread' ? 700 : 500,
                color: activeFilter === 'unread' ? '#166534' : 'var(--text-muted)',
                backgroundColor: activeFilter === 'unread' ? '#ffffff' : 'transparent',
                border: activeFilter === 'unread' ? '1px solid var(--border-main)' : '1px solid transparent',
                borderRadius: '12px',
                padding: '2px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Unread ({totalUnread})
            </button>
          </div>

          {/* List of Notifications */}
          <div className="notification-dropdown-list">
            {displayedNotifs.length === 0 ? (
              <div className="notification-empty-state">
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Bell size={20} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  {activeFilter === 'unread' ? 'No unread notifications' : 'All caught up!'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeFilter === 'unread'
                    ? 'You have read all your notifications.'
                    : 'No library updates or alerts at this time.'}
                </div>
              </div>
            ) : (
              displayedNotifs.map((notif) => {
                const isUnread = !notif.read;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`notification-dropdown-item ${isUnread ? 'unread' : ''}`}
                    role="button"
                    tabIndex={0}
                    title="Click to view details & jump to section"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notif);
                      }
                    }}
                  >
                    {/* Icon Column */}
                    <div className="notification-item-icon-wrapper">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content Column */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <span className="notification-item-title">{notif.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {isUnread && <span className="notification-unread-dot" title="Unread" />}
                        </div>
                      </div>

                      <p className="notification-item-msg">{notif.message}</p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span className="notification-item-time">{notif.timestamp}</span>

                        <div className="notification-item-actions" onClick={(e) => e.stopPropagation()}>
                          {isUnread && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickMarkRead(e, notif.id)}
                              className="btn btn-ghost btn-xs"
                              style={{ padding: '2px 5px', fontSize: '10.5px', color: '#166534', gap: '2px' }}
                              title="Mark as read"
                            >
                              <Check size={11} />
                              <span>Read</span>
                            </button>
                          )}

                          {onDeleteSingle && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickDismiss(e, notif.id)}
                              className="btn btn-ghost btn-xs"
                              style={{ padding: '2px 5px', fontSize: '10.5px', color: 'var(--text-subtle)' }}
                              title="Dismiss notification"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="notification-dropdown-footer">
            <button
              type="button"
              onClick={handleViewAllClick}
              className="notification-view-all-btn"
            >
              <span>View all in Notification Center</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
