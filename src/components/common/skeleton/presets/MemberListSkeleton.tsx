import React from 'react';
import { Skeleton } from '../Skeleton';
import { SkeletonTable } from '../SkeletonTable';
import { SkeletonPage } from '../SkeletonPage';

export const MemberListSkeleton: React.FC = () => {
  return (
    <SkeletonPage
      titleWidth={200}
      subtitleWidth={340}
      actionsCount={2}
    >
      {/* Search & Filter Toolbar */}
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
          <Skeleton width={110} height={38} rounded="md" />
        </div>
      </div>

      {/* Membership Tier Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'hidden' }}>
        {['All Patrons', 'Students', 'Faculty & Staff', 'Community', 'Senior / PWD', 'Researchers'].map((_, idx) => (
          <Skeleton
            key={idx}
            width={idx === 0 ? 90 : 110}
            height={32}
            rounded="full"
          />
        ))}
      </div>

      {/* Members Table */}
      <SkeletonTable
        rows={8}
        hasThumbnail={false}
        hasActions={true}
        columns={[
          { headerWidth: 160, cellWidth: '85%' }, // Member Name & ID
          { headerWidth: 130, cellWidth: '75%' }, // Contact (Phone / Email)
          { headerWidth: 100, cellWidth: '60%' }, // Membership Tier
          { headerWidth: 110, cellWidth: '70%' }, // Join Date / Expiry
          { headerWidth: 80, cellWidth: '50%' },  // Borrow Count
          { headerWidth: 80, cellWidth: '55%' }   // Status (Active/Inactive)
        ]}
      />
    </SkeletonPage>
  );
};
