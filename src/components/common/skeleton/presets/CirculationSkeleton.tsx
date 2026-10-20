import React from 'react';
import { Skeleton } from '../Skeleton';
import { SkeletonCard } from '../SkeletonCard';
import { SkeletonTable } from '../SkeletonTable';
import { SkeletonPage } from '../SkeletonPage';

export const CirculationSkeleton: React.FC = () => {
  return (
    <SkeletonPage
      titleWidth={220}
      subtitleWidth={360}
      actionsCount={3}
    >
      {/* 4 Circulation Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <SkeletonCard type="metric" />
        <SkeletonCard type="metric" />
        <SkeletonCard type="metric" />
        <SkeletonCard type="metric" />
      </div>

      {/* Circulation Toolbar: Search & Quick Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-main, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <Skeleton width="100%" height={38} rounded="md" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Skeleton width={140} height={38} rounded="md" />
          <Skeleton width={130} height={38} rounded="md" />
        </div>
      </div>

      {/* Transaction Status Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'hidden' }}>
        {['All Transactions', 'Active Loans', 'Overdue', 'Returned', 'Pending Approvals'].map((_, idx) => (
          <Skeleton
            key={idx}
            width={idx === 0 ? 110 : 100}
            height={32}
            rounded="full"
          />
        ))}
      </div>

      {/* Circulation Transactions Table */}
      <SkeletonTable
        rows={7}
        hasThumbnail={false}
        hasActions={true}
        columns={[
          { headerWidth: 150, cellWidth: '85%' }, // Transaction ID & Date
          { headerWidth: 160, cellWidth: '90%' }, // Book Title & Barcode
          { headerWidth: 140, cellWidth: '80%' }, // Patron / Member ID
          { headerWidth: 110, cellWidth: '70%' }, // Due Date
          { headerWidth: 90, cellWidth: '60%' },  // Fine Amount
          { headerWidth: 85, cellWidth: '65%' }   // Status (Borrowed/Returned/Overdue)
        ]}
      />
    </SkeletonPage>
  );
};
