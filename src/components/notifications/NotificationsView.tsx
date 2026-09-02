import React from 'react';
import type { NotificationItem, UserRole } from '../../types';
import { Bell, CheckCircle2, AlertTriangle, Info, AlertCircle, Check } from 'lucide-react';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  userRole: UserRole;
  currentMemberId?: string;
  onMarkAllAsRead: () => void;
  onMarkSingleAsRead: (id: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  userRole,
  currentMemberId,
  onMarkAllAsRead,
  onMarkSingleAsRead
}) => {
  const relevantNotifs = notifications.filter((notif) => {
    if (userRole === 'member') {
      return notif.targetRole === 'member' || notif.targetMemberId === currentMemberId;
    }
    if (userRole === 'admin') {
      return notif.targetRole === 'admin' || notif.targetRole === 'all';
    }
    return true;
  });

  const unreadCount = relevantNotifs.filter((n) => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Notification Center</div>
          <div className="page-subtitle">
            System alerts, due date reminders, reservation pickup notices, and attendance confirmations
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="page-actions">
            <button onClick={onMarkAllAsRead} className="btn btn-secondary btn-sm">
              <Check size={15} />
              <span>Mark All as Read</span>
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {relevantNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Bell size={36} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
              No notifications
            </div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
              You're completely caught up with all library updates.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {relevantNotifs.map((item) => {
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
                  onClick={() => onMarkSingleAsRead(item.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: item.read ? 'var(--border-subtle)' : 'var(--accent-blue-border)',
                    backgroundColor: item.read ? 'var(--bg-surface)' : 'var(--accent-blue-light)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
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

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: item.read ? 600 : 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                        {item.timestamp}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.message}
                    </div>
                  </div>

                  {!item.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-blue)',
                        marginTop: 6,
                        flexShrink: 0
                      }}
                      title="Unread"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
