import React from 'react';
import { Skeleton } from '../Skeleton';
import { SkeletonTable } from '../SkeletonTable';
import { SkeletonPage } from '../SkeletonPage';

export const BookCatalogSkeleton: React.FC = () => {
  return (
    <SkeletonPage
      titleWidth={220}
      subtitleWidth={360}
      actionsCount={3}
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
          <Skeleton width={130} height={38} rounded="md" />
          <Skeleton width={90} height={38} rounded="md" />
        </div>
      </div>

      {/* Category Pills Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'hidden' }}>
        {['All Books', 'Filipiniana', 'General Science', 'Technology & IT', 'Literature', 'History', 'Children'].map((_, idx) => (
          <Skeleton
            key={idx}
            width={idx === 0 ? 80 : 100}
            height={32}
            rounded="full"
          />
        ))}
      </div>

      {/* Book Catalog Table with book covers */}
      <SkeletonTable
        rows={8}
        hasThumbnail={true}
        hasActions={true}
        columns={[
          { headerWidth: 160, cellWidth: '90%' }, // Title & Subtitle
          { headerWidth: 120, cellWidth: '70%' }, // Author
          { headerWidth: 100, cellWidth: '60%' }, // Category / Dewey
          { headerWidth: 110, cellWidth: '75%' }, // ISBN / Accession
          { headerWidth: 80, cellWidth: '45%' },  // Available Copies
          { headerWidth: 85, cellWidth: '55%' }   // Status Badge
        ]}
      />
    </SkeletonPage>
  );
};
