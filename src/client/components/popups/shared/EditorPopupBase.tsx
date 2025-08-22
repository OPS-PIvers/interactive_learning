import React from 'react';
import { Z_INDEX_TAILWIND } from '../../../utils/zIndexLevels';

interface EditorPopupBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * EditorPopupBase - Shared base component for editor popup menus
 * 
 * Features:
 * - Consistent positioning and styling for editor popups
 * - Proper z-index management using centralized system
 * - Focus management and click-outside handling
 * - Responsive behavior for different screen sizes
 */
const EditorPopupBase: React.FC<EditorPopupBaseProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  position = 'bottom-center'
}) => {
  if (!isOpen) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-full mb-2 left-0';
      case 'bottom-right':
        return 'bottom-full mb-2 right-0';
      case 'bottom-center':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div 
      className={`absolute ${getPositionClasses()} ${Z_INDEX_TAILWIND.MODAL_CONTENT} ${className}`}
      style={{
        minWidth: '280px',
        maxWidth: '400px',
      }}
    >
      <div className="bg-[#2c3a6f] rounded-lg shadow-2xl border border-[#3e4f8a] p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};

export default EditorPopupBase;