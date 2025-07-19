
import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-2 transition-opacity duration-300 ease-in-out mobile-viewport-fix"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onTouchMove={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] max-h-[calc(100vh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] flex flex-col overflow-hidden border border-slate-700 mobile-safe-area"
        onTouchMove={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-y' }}
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
