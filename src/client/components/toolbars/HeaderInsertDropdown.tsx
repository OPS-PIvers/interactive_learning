import React, { useState, useRef, useEffect } from 'react';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { PlusIcon } from './icons/PlusIcon';

interface HeaderInsertDropdownProps {
  onAddElement: (elementType: 'hotspot' | 'text' | 'media' | 'shape') => void;
  onAddBackgroundMedia: () => void;
  isDisabled?: boolean;
  // Responsive design uses CSS breakpoints
}

/**
 * HeaderInsertDropdown - Centralized dropdown for adding slide elements
 * 
 * Replaces scattered "Add Elements" buttons with a unified insert dropdown
 * matching the landing page layout example design.
 */
const HeaderInsertDropdown: React.FC<HeaderInsertDropdownProps> = ({
  onAddElement,
  onAddBackgroundMedia,
  isDisabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isDisabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleAddElementAndClose = (elementType: 'hotspot' | 'text' | 'media' | 'shape') => {
    onAddElement(elementType);
    setIsOpen(false);
  };

  const handleAddBackgroundMediaAndClose = () => {
    onAddBackgroundMedia();
    setIsOpen(false);
  };

  const dropdownItems = [
    {
      icon: '📝',
      label: 'Text',
      action: () => handleAddElementAndClose('text'),
      description: 'Add text element'
    },
    {
      icon: '🔷',
      label: 'Shape',
      action: () => handleAddElementAndClose('shape'),
      description: 'Add shape element'
    },
    {
      icon: '🎯',
      label: 'Hotspot',
      action: () => handleAddElementAndClose('hotspot'),
      description: 'Add interactive hotspot'
    },
    {
      icon: '🖼️',
      label: 'Image',
      action: () => handleAddElementAndClose('media'),
      description: 'Add image element'
    },
    {
      icon: '🎬',
      label: 'Background Media',
      action: handleAddBackgroundMediaAndClose,
      description: 'Set slide background'
    }
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={isDisabled}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 ${
          isDisabled
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-blue-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } px-2 py-1 sm:px-3 sm:py-2`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Insert element menu"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Insert</span>
        <ChevronDownIcon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`origin-top-center absolute ${Z_INDEX_TAILWIND.DROPDOWNS} mt-2 w-56 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${
'right-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:right-auto'
          }`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="insert-button"
        >
          <div className="py-1" role="none">
            {dropdownItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 px-4 py-2 text-sm w-full text-left transition-colors duration-150 focus:outline-none focus:bg-slate-700"
                role="menuitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.action();
                  }
                }}
              >
                <span className="text-base">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="hidden sm:block text-xs text-slate-400">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderInsertDropdown;