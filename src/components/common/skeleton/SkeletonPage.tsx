import React from 'react';
import { Skeleton } from './Skeleton';

export interface SkeletonPageProps {
  titleWidth?: string | number;
  subtitleWidth?: string | number;
  actionsCount?: number;
  hasBreadcrumbs?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonPage: React.FC<SkeletonPageProps> = ({
  titleWidth = 200,
  subtitleWidth = 320,
  actionsCount = 2,
  hasBreadcrumbs = true,
  children,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`page-content-enter ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        ...style
      }}
    >
      {/* Optional Breadcrumbs */}
      {hasBreadcrumbs && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-8px' }}>
          <Skeleton width={60} height={12} rounded="xs" />
          <span style={{ color: 'var(--text-subtle, #cbd5e1)', fontSize: '12px' }}>/</span>
          <Skeleton width={90} height={12} rounded="xs" />
        </div>
      )}

      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width={titleWidth} height={26} rounded="sm" />
          <Skeleton width={subtitleWidth} height={14} rounded="xs" />
        </div>

        {actionsCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {Array.from({ length: actionsCount }).map((_, idx) => (
              <Skeleton
                key={idx}
                width={idx === actionsCount - 1 ? 120 : 100}
                height={38}
                rounded="md"
              />
            ))}
          </div>
        )}
      </div>

      {/* Page Body Content */}
      {children}
    </div>
  );
};
