import React, { useState, useMemo } from 'react';
import type { NotificationItem, UserRole } from '../../types';
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

interface NotificationsViewProps {
  notifications: NotificationItem[];
  userRole: UserRole;
  currentMemberId?: string;
  onMarkAllAsRead: () => void;
  onMarkSingleAsRead: (id: string) => void;
  onDeleteSingle?: (id: string) => void;
  onClearAll?: () => void;
  onNavigate?: (destination: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  userRole,
  currentMemberId,
  onMarkAllAsRead,
  onMarkSingleAsRead,
  onDeleteSingle,
  onClearAll,
  onNavigate
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'circulation' | 'reservations' | 'attendance'>('all');

  const relevantNotifs = useMemo(() => {
    return notifications.filter((notif) => {
      if (userRole === 'member') {
        return notif.targetRole === 'member' || notif.targetMemberId === currentMemberId || notif.targetRole === 'all';
      }
      if (userRole === 'admin') {
        return notif.targetRole === 'admin' || notif.targetRole === 'all';
      }
      if (userRole === 'volunteer') {
        return notif.targetRole === 'volunteer' || notif.targetRole === 'admin' || notif.targetRole === 'all';
      }
      return true;
    });
  }, [notifications, userRole, currentMemberId]);

  const filteredNotifs = useMemo(() => {
    return relevantNotifs.filter((n) => {
      if (filterTab === 'unread') return !n.read;
      if (filterTab === 'circulation') {
        const text = (n.title + ' ' + n.message).toLowerCase();
        return text.includes('loan') || text.includes('borrow') || text.includes('overdue') || text.includes('return') || n.destination === 'circulation' || n.destination === 'my_books';
      }
      if (filterTab === 'reservations') {
        const text = (n.title + ' ' + n.message).toLowerCase();
        return text.includes('reservation') || text.includes('hold') || n.destination === 'reservations';
      }
      if (filterTab === 'attendance') {
        const text = (n.title + ' ' + n.message).toLowerCase();
        return text.includes('attendance') || text.includes('time-in') || text.includes('time-out') || n.destination === 'attendance';
      }
      return true;
    });
  }, [relevantNotifs, filterTab]);

  const unreadCount = relevantNotifs.filter((n) => !n.read).length;

  const handleCardClick = (item: NotificationItem) => {
    if (!item.read) {
      onMarkSingleAsRead(item.id);
    }
    if (onNavigate) {
      let dest = item.destination;
      if (!dest) {
        const titleLower = item.title.toLowerCase();
        const msgLower = item.message.toLowerCase();
        if (titleLower.includes('borrow') || titleLower.includes('loan') || titleLower.includes('overdue') || msgLower.includes('return')) {
          dest = userRole === 'member' ? 'my_books' : 'circulation';
        } else if (titleLower.includes('reservation') || titleLower.includes('hold')) {
          dest = userRole === 'member' ? 'reservations' : 'circulation';
        } else if (titleLower.includes('attendance')) {
          dest = 'attendance';
        } else if (titleLower.includes('book')) {
          dest = 'books';
        }
      }
      if (dest) {
        onNavigate(dest);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Notification Center</div>
          <div className="page-subtitle">
            System alerts, due date reminders, reservation notices, and attendance confirmations
          </div>
        </div>

        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && (
            <button onClick={onMarkAllAsRead} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              <Check size={15} />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}

          {onClearAll && relevantNotifs.length > 0 && (
            <button onClick={onClearAll} className="btn btn-ghost btn-sm" style={{ gap: '6px', color: 'var(--text-muted)' }}>
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`tab-btn ${filterTab === 'all' ? 'active' : ''}`}
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          All ({relevantNotifs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('unread')}
          className={`tab-btn ${filterTab === 'unread' ? 'active' : ''}`}
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('circulation')}
          className={`tab-btn ${filterTab === 'circulation' ? 'active' : ''}`}
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          Circulation & Loans
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('reservations')}
          className={`tab-btn ${filterTab === 'reservations' ? 'active' : ''}`}
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          Holds & Reservations
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('attendance')}
          className={`tab-btn ${filterTab === 'attendance' ? 'active' : ''}`}
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          Attendance
        </button>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {filteredNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Bell size={36} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
              No notifications found
            </div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
              {filterTab === 'unread'
                ? "You have marked all notifications as read."
                : "You're completely caught up with all library updates."}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifs.map((item) => {
              let Icon = Info;
              let iconColor = 'var(--info)';
              let iconBg = 'var(--info-bg)';

              if (item.type === 'alert') {
                Icon = AlertCircle;
                iconColor = 'var(--danger)';
                iconBg = 'var(--danger-bg)';
              } else if (item.type === 'warning') {
                Icon = AlertTriangle;
                iconColor = 'var(--warning)';
                iconBg = 'var(--warning-bg)';
              } else if (item.type === 'success') {
                Icon = CheckCircle2;
                iconColor = 'var(--success)';
                iconBg = 'var(--success-bg)';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: item.read ? 'var(--border-subtle, #e2e8f0)' : '#86efac',
                    backgroundColor: item.read ? 'var(--bg-surface, #ffffff)' : '#f0fdf4',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: item.read ? 'none' : '0 2px 6px rgba(22, 101, 52, 0.06)'
                  }}
                  className="notification-view-card"
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: iconBg,
                      color: iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontWeight: item.read ? 600 : 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)', flexShrink: 0 }}>
                        {item.timestamp}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                      {item.message}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#166534',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {item.actionText || 'Take Action'} <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => onMarkSingleAsRead(item.id)}
                        className="btn btn-ghost btn-xs"
                        style={{ padding: '4px 8px', fontSize: '11px', color: '#166534', gap: '4px' }}
                        title="Mark as read"
                      >
                        <Check size={12} />
                        <span>Read</span>
                      </button>
                    )}

                    {onDeleteSingle && (
                      <button
                        type="button"
                        onClick={() => onDeleteSingle(item.id)}
                        className="btn btn-ghost btn-xs"
                        style={{ padding: '4px 6px', color: 'var(--text-subtle)' }}
                        title="Dismiss notification"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
