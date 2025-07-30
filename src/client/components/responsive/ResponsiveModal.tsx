/**
 * Responsive Modal System
 * 
 * Unified modal component that adapts between desktop and mobile presentations.
 * Uses mobile-first approach with desktop enhancements. Replaces separate
 * desktop and mobile modal implementations.
 */

import React, { useEffect, useCallback } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useContentAreaHeight } from '../../hooks/useMobileToolbar';
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
  const isMobile = useIsMobile();
  const { contentAreaHeight } = useContentAreaHeight(false);
  
  // Auto-determine position based on device and modal type
  const effectivePosition = position === 'auto' 
    ? isMobile 
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
    if (isMobile) {
      e.stopPropagation();
    }
  }, [isMobile]);
  
  if (!isOpen) return null;
  
  // Size mappings for different screen sizes
  const getSizeClasses = () => {
    if (isMobile) {
      switch (size) {
        case 'small':
          return 'w-full max-w-sm';
        case 'medium':
          return 'w-full max-w-md';
        case 'large':
          return 'w-full max-w-lg';
        case 'fullscreen':
          return 'w-full h-full';
        default:
          return 'w-full max-w-md';
      }
    } else {
      switch (size) {
        case 'small':
          return 'w-full max-w-md';
        case 'medium':
          return 'w-full max-w-lg';
        case 'large':
          return 'w-full max-w-2xl';
        case 'fullscreen':
          return 'w-full h-full';
        default:
          return 'w-full max-w-lg';
      }
    }
  };
  
  // Position classes
  const getPositionClasses = () => {
    switch (effectivePosition) {
      case 'bottom':
        return 'items-end justify-center';
      case 'right':
        return 'items-center justify-end';
      case 'center':
      default:
        return 'items-center justify-center';
    }
  };
  
  // Modal content height for mobile
  const getModalHeight = () => {
    if (!isMobile) return undefined;
    
    if (size === 'fullscreen') {
      return contentAreaHeight;
    }
    
    if (effectivePosition === 'bottom') {
      return Math.min(contentAreaHeight * 0.8, 600);
    }
    
    return Math.min(contentAreaHeight * 0.9, 500);
  };
  
  return (
    <div
      className={`fixed inset-0 ${Z_INDEX_TAILWIND.MOBILE_MODAL_SYSTEM} flex ${getPositionClasses()}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
    >
      <div
        className={`
          ${getSizeClasses()}
          ${effectivePosition === 'bottom' && isMobile ? 'rounded-t-2xl' : 'rounded-lg'}
          ${effectivePosition === 'right' && !isMobile ? 'rounded-l-lg rounded-r-none' : ''}
          bg-slate-800 text-white shadow-2xl overflow-hidden
          ${className}
        `}
        style={{
          height: getModalHeight(),
          maxHeight: isMobile ? contentAreaHeight : '90vh',
          marginBottom: effectivePosition === 'bottom' && isMobile ? 0 : undefined,
          marginRight: effectivePosition === 'right' && !isMobile ? 0 : undefined,
        }}
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