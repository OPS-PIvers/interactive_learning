import React from 'react';

interface ArrowUpIconProps {
  className?: string;
}

export const ArrowUpIcon: React.FC<ArrowUpIconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l5-5 5 5" />
  </svg>
);