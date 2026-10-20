import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  variant?: 'shimmer' | 'pulse';
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = 'md',
  variant = 'shimmer',
  className = '',
  style = {},
  ...props
}) => {
  const getRadius = () => {
    switch (rounded) {
      case 'none':
        return '0px';
      case 'xs':
        return '4px';
      case 'sm':
        return '6px';
      case 'md':
        return '8px';
      case 'lg':
        return '12px';
      case 'xl':
        return '16px';
      case '2xl':
        return '24px';
      case 'full':
        return '9999px';
      default:
        return '8px';
    }
  };

  const animationClass = variant === 'pulse' ? 'bpl-skeleton-pulse' : 'bpl-skeleton-shimmer';

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`${animationClass} ${className}`.trim()}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: getRadius(),
        display: 'block',
        flexShrink: 0,
        ...style
      }}
      {...props}
    />
  );
};
