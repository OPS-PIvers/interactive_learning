import React from 'react';

interface BaseToolbarProps {
  children: React.ReactNode;
}

const BaseToolbar: React.FC<BaseToolbarProps> = ({ children }) => {
  return (
    <div className="bg-slate-800 text-white p-4 flex items-center justify-between shadow-md">
      {children}
    </div>
  );
};

export default BaseToolbar;
