import React from 'react';

interface PauseIconProps {
  className?: string;
}

export const PauseIcon: React.FC<PauseIconProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z" />
    </svg>
  );
};