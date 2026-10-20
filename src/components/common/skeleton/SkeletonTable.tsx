import React from 'react';
import { Skeleton } from './Skeleton';

export interface SkeletonTableColumn {
  headerWidth?: string | number;
  cellWidth?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: SkeletonTableColumn[];
  hasThumbnail?: boolean;
  hasActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_COLUMNS: SkeletonTableColumn[] = [
  { headerWidth: 120, cellWidth: '85%' },
  { headerWidth: 100, cellWidth: '70%' },
  { headerWidth: 80, cellWidth: '60%' },
  { headerWidth: 90, cellWidth: '75%' },
  { headerWidth: 70, cellWidth: '50%' }
];

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 6,
  columns = DEFAULT_COLUMNS,
  hasThumbnail = false,
  hasActions = true,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`table-container ${className}`.trim()}
      style={{
        backgroundColor: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-main, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        overflow: 'hidden',
        width: '100%',
        ...style
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        {/* Table Header */}
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--bg-subtle, #f8fafc)',
              borderBottom: '1px solid var(--border-main, #e2e8f0)'
            }}
          >
            {hasThumbnail && (
              <th style={{ padding: '14px 16px', width: '56px' }}>
                <Skeleton width={28} height={14} rounded="xs" />
              </th>
            )}
            {columns.map((col, idx) => (
              <th key={idx} style={{ padding: '14px 16px' }}>
                <Skeleton width={col.headerWidth || 90} height={13} rounded="xs" />
              </th>
            ))}
            {hasActions && (
              <th style={{ padding: '14px 16px', width: '90px', textAlign: 'right' }}>
                <Skeleton width={60} height={13} rounded="xs" style={{ marginLeft: 'auto' }} />
              </th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr
              key={rIdx}
              style={{
                borderBottom: rIdx === rows - 1 ? 'none' : '1px solid var(--border-subtle, #f1f5f9)'
              }}
            >
              {hasThumbnail && (
                <td style={{ padding: '14px 16px' }}>
                  <Skeleton width={38} height={50} rounded="sm" />
                </td>
              )}
              {columns.map((col, cIdx) => (
                <td key={cIdx} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Skeleton
                      width={col.cellWidth || '80%'}
                      height={13}
                      rounded="xs"
                    />
                    {cIdx === 0 && (
                      <Skeleton width="55%" height={10} rounded="xs" />
                    )}
                  </div>
                </td>
              ))}
              {hasActions && (
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Skeleton width={28} height={28} rounded="md" />
                    <Skeleton width={28} height={28} rounded="md" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
