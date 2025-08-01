
import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { useIsMobile } from '../hooks/useIsMobile';
import { useMobileToolbar } from '../hooks/useMobileToolbar';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const { dimensions } = useMobileToolbar();

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previouslyFocusedElement.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate modal positioning to start just below header toolbar
  const getModalStyle = () => {
    // Header heights based on EditorToolbar implementation
    const headerHeight = isMobile ? 56 : 56;
    const safeAreaTop = 'env(safe-area-inset-top, 0px)';
    const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';
    
    // Calculate top position: header height + safe area top + small margin
    const topMargin = isMobile ? '8px' : '12px';
    const topPosition = `calc(${headerHeight}px + ${safeAreaTop} + ${topMargin})`;
    
    // Calculate available height for modal content
    const toolbarHeight = dimensions.toolbarHeight;
    const bottomMargin = isMobile ? '24px' : '16px'; // Extra margin for footer toolbar
    const safetyBuffer = isMobile ? '20px' : '16px'; // Additional buffer for dynamic toolbars
    
    const maxHeight = `calc(100vh - ${headerHeight}px - ${safeAreaTop} - ${safeAreaBottom} - ${topMargin} - ${bottomMargin} - ${toolbarHeight}px - ${safetyBuffer})`;
    
    return {
      top: topPosition,
      maxHeight: maxHeight,
      height: 'auto' // Let content determine height up to maxHeight
    };
  };

  const modalStyle = getModalStyle();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 transition-opacity duration-300 ease-in-out mobile-viewport-fix"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onTouchMove={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="absolute left-2 right-2 bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 mobile-safe-area"
        onTouchMove={(e) => e.stopPropagation()}
        style={{ 
          touchAction: 'pan-y',
          top: modalStyle.top,
          height: modalStyle.height,
          maxHeight: modalStyle.maxHeight,
          maxWidth: isMobile ? 'calc(100vw - 16px)' : '90vw'
        }}
      >
        <header className="p-4 sm:p-6 flex justify-between items-center border-b border-slate-700 bg-slate-800/50">
          <h2 id="modal-title" className="text-xl sm:text-2xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-4 sm:p-6 flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Modal;
