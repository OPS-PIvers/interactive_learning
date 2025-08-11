/**
 * Responsive Modal System
 * 
 * Unified modal component that adapts between desktop and mobile presentations.
 * Uses mobile-first approach with desktop enhancements. Replaces separate
 * desktop and mobile modal implementations.
 * 
 * Phase 3 Enhancement: Bottom sheet behavior on mobile with touch gestures
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useModalConstraints } from '../../hooks/useLayoutConstraints';

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
  allowSwipeDown?: boolean; // New: Enable swipe-to-dismiss on mobile
}

/**
 * ResponsiveModal - Adaptive modal supporting both desktop and mobile layouts
 * Phase 3 Enhancement: Bottom sheet behavior with touch gestures on mobile
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
  allowSwipeDown = true,
}) => {
  // Use the unified constraint system for responsive modal positioning
  const { constraints, styles, tailwindClasses } = useModalConstraints({
    type: type === 'properties' ? 'properties' : 'standard',
    position,
    size,
    preventToolbarOverlap: true,
    respectKeyboard: true,
  });
  
  // State for bottom sheet drag behavior
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);
  
  // Touch gesture handlers for mobile bottom sheet behavior
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!allowSwipeDown || (window.innerWidth && window.innerWidth > 768)) return; // Only on mobile
    
    const touch = e.touches?.[0];
    if (!touch) return;
    
    setStartY(touch.clientY);
    setIsDragging(true);
  }, [allowSwipeDown]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !allowSwipeDown || (window.innerWidth && window.innerWidth > 768)) return;
    
    const touch = e.touches?.[0];
    if (!touch) return;
    
    const deltaY = touch.clientY - startY;
    
    // Only allow downward dragging
    if (deltaY > 0) {
      setDragY(deltaY);
      
      // Update modal position during drag
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
        modalRef.current.style.transition = 'none';
      }
    }
  }, [isDragging, startY, allowSwipeDown]);
  
  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !allowSwipeDown) return;
    
    setIsDragging(false);
    
    // If dragged down more than 100px, close the modal
    if (dragY > 100) {
      onClose();
    } else {
      // Snap back to original position
      if (modalRef.current) {
        modalRef.current.style.transform = '';
        modalRef.current.style.transition = '';
      }
    }
    
    setDragY(0);
  }, [isDragging, dragY, allowSwipeDown, onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document?.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      if (document.body) document.body.style.overflow = 'hidden';
    } else {
      document?.removeEventListener('keydown', handleKeyDown);
      if (document.body) document.body.style.overflow = '';
    }
    
    return () => {
      document?.removeEventListener('keydown', handleKeyDown);
      if (document.body) document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventCloseOnBackdropClick) {
      onClose();
    }
  }, [onClose, preventCloseOnBackdropClick]);
  
  if (!isOpen) return null;
  
  return (
    <>
      <div
        className={`responsive-modal-desktop ${tailwindClasses.backdrop} flex
                   /* Mobile: items-end for bottom sheet, Desktop: items-center for center */
                   items-end md:items-center justify-center md:justify-center`}
        style={{
          ...styles.backdrop,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className={`
            bg-slate-800 text-white shadow-2xl overflow-hidden
            responsive-modal-mobile md:modal-content
            w-full md:w-auto
            ${isOpen ? 'open' : ''}
            ${className}
          `}
          style={styles.content}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Mobile drag handle - only visible on mobile */}
          <div className="block md:hidden drag-handle"></div>
          
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
          <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-none">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResponsiveModal;