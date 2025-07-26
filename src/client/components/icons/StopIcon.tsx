import React from 'react';

interface StopIconProps {
  className?: string;
}

export const StopIcon: React.FC<StopIconProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 18h12V6H6v12zM8 8h8v8H8V8z" />
    </svg>
  );
};