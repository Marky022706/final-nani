import React from 'react';
import { Skeleton } from '../Skeleton';
import { SkeletonPage } from '../SkeletonPage';

export const NotificationsHistorySkeleton: React.FC = () => {
  return (
    <SkeletonPage
      titleWidth={220}
      subtitleWidth={320}
      actionsCount={1}
    >
      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'hidden' }}>
        {['All', 'Unread', 'System Alerts', 'Circulation Notice', 'Announcements'].map((_, idx) => (
          <Skeleton
            key={idx}
            width={idx === 0 ? 70 : 110}
            height={32}
            rounded="full"
          />
        ))}
      </div>

      {/* Notifications / Activity Items List */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-main, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden'
        }}
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              borderBottom: idx === 5 ? 'none' : '1px solid var(--border-subtle, #f1f5f9)'
            }}
          >
            {/* Notification Icon Bubble */}
            <Skeleton width={42} height={42} rounded="full" />

            {/* Message Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Skeleton width="40%" height={15} rounded="xs" />
                <Skeleton width={70} height={12} rounded="xs" />
              </div>
              <Skeleton width="85%" height={13} rounded="xs" />
              <Skeleton width="55%" height={11} rounded="xs" style={{ opacity: 0.8 }} />
            </div>

            {/* Action pill */}
            <Skeleton width={28} height={28} rounded="md" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
};
