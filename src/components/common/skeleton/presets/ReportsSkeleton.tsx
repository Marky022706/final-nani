import React from 'react';
import { Skeleton } from '../Skeleton';
import { SkeletonCard } from '../SkeletonCard';
import { SkeletonTable } from '../SkeletonTable';
import { SkeletonPage } from '../SkeletonPage';

export const ReportsSkeleton: React.FC = () => {
  return (
    <SkeletonPage
      titleWidth={240}
      subtitleWidth={380}
      actionsCount={2}
    >
      {/* Report Selector Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'hidden' }}>
        {['Circulation Analytics', 'Collection Inventory', 'Patron Demographics', 'Overdue & Fines'].map((_, idx) => (
          <Skeleton
            key={idx}
            width={idx === 0 ? 140 : 130}
            height={36}
            rounded="md"
          />
        ))}
      </div>

      {/* 3 Metric Summary Cards */}
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
      </div>

      {/* Chart & Report Breakdown */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-main, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Skeleton width={180} height={18} rounded="xs" />
            <Skeleton width={260} height={12} rounded="xs" style={{ marginTop: '6px' }} />
          </div>
          <Skeleton width={110} height={32} rounded="md" />
        </div>

        {/* Chart representation */}
        <div
          style={{
            height: '180px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '18px',
            paddingTop: '16px',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)'
          }}
        >
          {[60, 85, 45, 95, 70, 50, 75, 90, 65, 80].map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Skeleton width="100%" height={`${h}%`} rounded="xs" />
              <Skeleton width="60%" height={10} rounded="xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Report Data Table */}
      <SkeletonTable
        rows={6}
        columns={[
          { headerWidth: 160, cellWidth: '85%' },
          { headerWidth: 110, cellWidth: '70%' },
          { headerWidth: 100, cellWidth: '60%' },
          { headerWidth: 90, cellWidth: '50%' }
        ]}
        hasActions={false}
      />
    </SkeletonPage>
  );
};
