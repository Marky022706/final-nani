import React from 'react';
import { Skeleton } from './Skeleton';
import { SkeletonText } from './SkeletonText';

export interface SkeletonCardProps {
  hasIcon?: boolean;
  type?: 'metric' | 'standard' | 'detailed';
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasIcon = true,
  type = 'metric',
  className = '',
  style = {}
}) => {
  if (type === 'metric') {
    return (
      <div
        className={`stat-card ${className}`.trim()}
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-main, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          ...style
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width="45%" height={12} rounded="xs" />
          <Skeleton width="60%" height={28} rounded="sm" />
          <Skeleton width="75%" height={11} rounded="xs" style={{ marginTop: '4px' }} />
        </div>
        {hasIcon && (
          <Skeleton width={44} height={44} rounded="md" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`card ${className}`.trim()}
      style={{
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-main, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasIcon && <Skeleton width={36} height={36} rounded="md" />}
          <div>
            <Skeleton width={140} height={16} rounded="xs" />
            <Skeleton width={90} height={12} rounded="xs" style={{ marginTop: '6px' }} />
          </div>
        </div>
        <Skeleton width={64} height={24} rounded="full" />
      </div>

      <SkeletonText lines={3} gap={10} lineHeight={13} lastLineWidth="60%" />

      {type === 'detailed' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle, #f1f5f9)',
            paddingTop: '14px',
            marginTop: '4px'
          }}
        >
          <Skeleton width={110} height={12} rounded="xs" />
          <Skeleton width={80} height={28} rounded="sm" />
        </div>
      )}
    </div>
  );
};
