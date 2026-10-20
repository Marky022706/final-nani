import React from 'react';
import { Skeleton } from './Skeleton';

export interface SkeletonFormFieldProps {
  hasLabel?: boolean;
  type?: 'input' | 'textarea' | 'select';
  width?: string | number;
}

export interface SkeletonFormProps {
  fields?: number;
  layout?: 'single' | 'grid-2' | 'grid-3';
  hasButtons?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 6,
  layout = 'grid-2',
  hasButtons = true,
  className = '',
  style = {}
}) => {
  const getGridTemplate = () => {
    switch (layout) {
      case 'grid-3':
        return 'repeat(auto-fit, minmax(240px, 1fr))';
      case 'grid-2':
        return 'repeat(auto-fit, minmax(320px, 1fr))';
      default:
        return '1fr';
    }
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-main, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        ...style
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: getGridTemplate(),
          gap: '20px'
        }}
      >
        {Array.from({ length: fields }).map((_, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width="35%" height={12} rounded="xs" />
            <Skeleton width="100%" height={38} rounded="md" />
            <Skeleton width="60%" height={10} rounded="xs" style={{ opacity: 0.7 }} />
          </div>
        ))}
      </div>

      {hasButtons && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--border-subtle, #f1f5f9)',
            paddingTop: '20px',
            marginTop: '4px'
          }}
        >
          <Skeleton width={90} height={38} rounded="md" />
          <Skeleton width={120} height={38} rounded="md" />
        </div>
      )}
    </div>
  );
};
