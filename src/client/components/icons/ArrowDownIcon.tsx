import React from 'react';

interface ArrowDownIconProps {
  className?: string;
}

export const ArrowDownIcon: React.FC<ArrowDownIconProps> = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l-5 5-5-5" />
  </svg>
);