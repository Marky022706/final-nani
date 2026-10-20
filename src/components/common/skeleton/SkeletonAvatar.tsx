import React from 'react';
import { Skeleton } from './Skeleton';

export interface SkeletonAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  shape?: 'circle' | 'rounded';
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  shape = 'circle',
  className = '',
  style = {}
}) => {
  const getDimension = () => {
    if (typeof size === 'number') return `${size}px`;
    switch (size) {
      case 'xs':
        return '24px';
      case 'sm':
        return '32px';
      case 'md':
        return '40px';
      case 'lg':
        return '48px';
      case 'xl':
        return '64px';
      default:
        return '40px';
    }
  };

  const dim = getDimension();

  return (
    <Skeleton
      width={dim}
      height={dim}
      rounded={shape === 'circle' ? 'full' : 'md'}
      className={className}
      style={style}
    />
  );
};
