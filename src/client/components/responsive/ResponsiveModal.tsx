/**
 * Responsive Modal System
 * 
 * Unified modal component that adapts between desktop and mobile presentations.
 * Uses mobile-first approach with desktop enhancements. Replaces separate
 * desktop and mobile modal implementations.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useModalConstraints } from '../../hooks/useLayoutConstraints';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';

export interface ResponsiveModalProps {
  type: 'slides' | 'background' | 'insert' | 'aspectRatio' | 'share' | 'settings' | 'properties';
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'center' | 'bottom' | 'right' | 'auto';
  className?: string;
  preventCloseOnBackdropClick?: boolean;
}

/**
 * ResponsiveModal - Adaptive modal supporting both desktop and mobile layouts
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  type,
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'auto',
  className = '',
  preventCloseOnBackdropClick = false,
}) => {
  const { deviceType, isMobile } = useDeviceDetection();
  
  // Use the unified constraint system for responsive modal positioning
  const { constraints, styles, tailwindClasses } = useModalConstraints({
    type: type === 'properties' ? 'properties' : 'standard',
    position,
    size,
    preventToolbarOverlap: true,
    respectKeyboard: true,
  });
  
  // Auto-determine position based on device and modal type
  const effectivePosition = position === 'auto' 
    ? deviceType === 'mobile'
      ? (type === 'properties' ? 'bottom' : 'center')
      : (type === 'properties' ? 'right' : 'center')
    : position;
  
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventCloseOnBackdropClick) {
      onClose();
    }
  }, [onClose, preventCloseOnBackdropClick]);
  
  // Mobile touch handler to prevent scrolling behind modal  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (deviceType === 'mobile') {
      e.stopPropagation();
    }
  }, [deviceType]);
  
  if (!isOpen) return null;
  
  return (
    <div
      className={`fixed inset-0 ${tailwindClasses.backdrop} flex`}
      style={{
        ...styles.backdrop,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
    >
      <div
        className={`
          bg-slate-800 text-white shadow-2xl overflow-hidden
          ${className}
        `}
        style={styles.content}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveModal;