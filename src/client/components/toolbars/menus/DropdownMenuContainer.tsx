import React, { useState } from 'react';

interface DropdownMenuContainerProps {
  trigger: (isOpen: boolean, toggle: () => void) => React.ReactNode;
  children: React.ReactNode;
}

const DropdownMenuContainer: React.FC<DropdownMenuContainerProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      {trigger(isOpen, toggle)}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenuContainer;
