import React from 'react';

interface DragHandleProps {
  className?: string;
  isDragging?: boolean;
}

const DragHandle: React.FC<DragHandleProps> = ({ 
  className = '', 
  isDragging = false 
}) => {
  return (
    <div 
      className={`flex flex-col justify-center items-center cursor-grab active:cursor-grabbing transition-colors ${
        isDragging ? 'text-purple-400' : 'text-slate-400 hover:text-slate-300'
      } ${className}`}
      title="Drag to reorder"
    >
      <svg 
        className="w-4 h-4" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
      </svg>
    </div>
  );
};

export default DragHandle;