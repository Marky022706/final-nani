import React from 'react';
import { Skeleton } from '../Skeleton';
import { SkeletonForm } from '../SkeletonForm';
import { SkeletonPage } from '../SkeletonPage';

export const ProfileSettingsSkeleton: React.FC = () => {
  return (
    <SkeletonPage
      titleWidth={220}
      subtitleWidth={340}
      actionsCount={1}
    >
      {/* Identity Card Header */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-main, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <Skeleton width={72} height={72} rounded="full" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width={180} height={20} rounded="xs" />
            <Skeleton width={130} height={13} rounded="xs" />
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <Skeleton width={80} height={22} rounded="full" />
              <Skeleton width={100} height={22} rounded="full" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Skeleton width={110} height={38} rounded="md" />
          <Skeleton width={120} height={38} rounded="md" />
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {['Account Overview', 'Personal Details', 'Library Privileges', 'Security & Preferences'].map((_, idx) => (
          <Skeleton
            key={idx}
            width={idx === 0 ? 140 : 130}
            height={36}
            rounded="md"
          />
        ))}
      </div>

      {/* Form Fields Grid */}
      <SkeletonForm fields={6} layout="grid-2" hasButtons={true} />
    </SkeletonPage>
  );
};
