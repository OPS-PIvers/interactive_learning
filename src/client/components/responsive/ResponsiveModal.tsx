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
import './ResponsiveModal.css';

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
  const { constraints } = useModalConstraints({
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
    if (!allowSwipeDown || !modalRef.current) return;
    
    const touch = e.touches?.[0];
    if (!touch) return;
    
    setStartY(touch.clientY);
    setIsDragging(true);
    modalRef.current.style.transition = 'none'; // Disable transition during drag
  }, [allowSwipeDown]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !allowSwipeDown || !modalRef.current) return;
    
    const touch = e.touches?.[0];
    if (!touch) return;
    
    const deltaY = touch.clientY - startY;
    
    // Only allow downward dragging
    if (deltaY > 0) {
      setDragY(deltaY);
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, [isDragging, startY, allowSwipeDown]);
  
  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !allowSwipeDown || !modalRef.current) return;
    
    setIsDragging(false);
    modalRef.current.style.transition = ''; // Re-enable transition
    
    // If dragged down more than 100px, close the modal
    if (dragY > 100) {
      onClose();
    } else {
      // Snap back to original position
      modalRef.current.style.transform = '';
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
  
  if (!isOpen && !isDragging) return null;

  const backdropClasses = [
    'responsive-modal-backdrop',
    isOpen ? 'open' : '',
    `items-end md:items-center`,
    `justify-center`,
  ].join(' ');

  const contentClasses = [
    'responsive-modal-content',
    isDragging ? 'is-dragging' : '',
    className,
  ].join(' ');

  return (
    <div
      className={backdropClasses}
      style={constraints.cssVariables}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="responsive-modal-title"
        className={contentClasses}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="block md:hidden drag-handle" />
        <div className="modal-header">
          <h2 id="responsive-modal-title" className="modal-title">{title}</h2>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveModal;