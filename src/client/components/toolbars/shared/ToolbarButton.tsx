import React from 'react';

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ children, isActive, ...props }) => {
  const activeClasses = isActive ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300';
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-md transition-colors font-medium ${activeClasses} ${props.className || ''}`}
    >
      {children}
    </button>
  );
};

export default ToolbarButton;
