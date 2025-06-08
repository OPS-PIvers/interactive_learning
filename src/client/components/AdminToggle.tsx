
import React from 'react';

interface AdminToggleProps {
  isAdmin: boolean;
  onToggle: () => void;
}

const AdminToggle: React.FC<AdminToggleProps> = ({ isAdmin, onToggle }) => {
  return (
    <label htmlFor="admin-toggle" className="flex items-center cursor-pointer">
      <span className="mr-3 text-sm font-medium text-slate-300">Admin Mode</span>
      <div className="relative">
        <input 
          type="checkbox" 
          id="admin-toggle" 
          className="sr-only" 
          checked={isAdmin} 
          onChange={onToggle} 
        />
        <div className={`block w-14 h-8 rounded-full transition-colors ${isAdmin ? 'bg-purple-600' : 'bg-slate-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isAdmin ? 'transform translate-x-6' : ''}`}></div>
      </div>
    </label>
  );
};

export default AdminToggle;
