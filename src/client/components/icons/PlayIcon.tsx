import React from 'react';

interface PlayIconProps {
  className?: string;
}

export const PlayIcon: React.FC<PlayIconProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
    </svg>
  );
};