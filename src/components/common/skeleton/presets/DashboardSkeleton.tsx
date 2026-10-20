import React from 'react';
import { Skeleton } from '../Skeleton';
import { SkeletonCard } from '../SkeletonCard';
import { SkeletonTable } from '../SkeletonTable';
import { SkeletonPage } from '../SkeletonPage';

export const DashboardSkeleton: React.FC = () => {
  return (
    <SkeletonPage
      titleWidth={240}
      subtitleWidth={340}
      actionsCount={2}
    >
      {/* 4 KPI Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px'
        }}
      >
        <SkeletonCard type="metric" />
        <SkeletonCard type="metric" />
        <SkeletonCard type="metric" />
        <SkeletonCard type="metric" />
      </div>

      {/* Middle Grid: Primary Chart / Trend + Quick Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Main Analytics Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-main, #e2e8f0)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Skeleton width={180} height={16} rounded="xs" />
              <Skeleton width={120} height={12} rounded="xs" style={{ marginTop: '6px' }} />
            </div>
            <Skeleton width={90} height={28} rounded="md" />
          </div>

          {/* Simulated Chart Bars */}
          <div
            style={{
              height: '200px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '16px',
              paddingTop: '20px',
              borderBottom: '1px solid var(--border-subtle, #f1f5f9)'
            }}
          >
            {[45, 75, 60, 90, 50, 80, 65, 85, 40, 70, 95, 60].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Skeleton width="100%" height={`${h}%`} rounded="xs" />
                <Skeleton width="70%" height={10} rounded="xs" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-main, #e2e8f0)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={160} height={16} rounded="xs" />
            <Skeleton width={70} height={12} rounded="xs" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: idx === 3 ? 0 : '12px',
                  borderBottom: idx === 3 ? 'none' : '1px solid var(--border-subtle, #f1f5f9)'
                }}
              >
                <Skeleton width={38} height={38} rounded="full" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Skeleton width="65%" height={13} rounded="xs" />
                  <Skeleton width="40%" height={11} rounded="xs" />
                </div>
                <Skeleton width={50} height={11} rounded="xs" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Summary Table */}
      <SkeletonTable
        rows={4}
        columns={[
          { headerWidth: 140, cellWidth: '85%' },
          { headerWidth: 100, cellWidth: '70%' },
          { headerWidth: 90, cellWidth: '60%' },
          { headerWidth: 80, cellWidth: '50%' }
        ]}
        hasActions={false}
      />
    </SkeletonPage>
  );
};
