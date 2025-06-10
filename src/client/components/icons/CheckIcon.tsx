import React from 'react';

interface CheckIconProps {
  className?: string;
}

const CheckIcon: React.FC<CheckIconProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
};

export default CheckIcon;