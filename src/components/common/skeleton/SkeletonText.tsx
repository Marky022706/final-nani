import React from 'react';
import { Skeleton } from './Skeleton';

export interface SkeletonTextProps {
  lines?: number;
  gap?: number;
  lineHeight?: number | string;
  lastLineWidth?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  gap = 8,
  lineHeight = 14,
  lastLineWidth = '70%',
  className = '',
  style = {}
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        width: '100%',
        ...style
      }}
      className={className}
    >
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1;
        const width = isLast ? lastLineWidth : index % 2 === 1 ? '92%' : '100%';

        return (
          <Skeleton
            key={index}
            width={width}
            height={lineHeight}
            rounded="sm"
          />
        );
      })}
    </div>
  );
};
