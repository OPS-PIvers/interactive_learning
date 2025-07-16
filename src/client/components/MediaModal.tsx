import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  disableTouch?: boolean;
}

const MediaModal: React.FC<MediaModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'large',
  disableTouch = false
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl', 
    large: 'max-w-4xl',
    fullscreen: 'max-w-[95vw]'
  };

  const heightStyles = {
    small: 'max-h-[70vh] max-h-[70svh] supports-[height:100svh]:max-h-[70svh] supports-[height:100dvh]:max-h-[70dvh]',
    medium: 'max-h-[80vh] max-h-[80svh] supports-[height:100svh]:max-h-[80svh] supports-[height:100dvh]:max-h-[80dvh]',
    large: 'max-h-[85vh] max-h-[85svh] supports-[height:100svh]:max-h-[85svh] supports-[height:100dvh]:max-h-[85dvh] sm:max-h-[90vh] sm:max-h-[90svh]',
    fullscreen: 'max-h-[95vh] max-h-[95svh] supports-[height:100svh]:max-h-[95svh] supports-[height:100dvh]:max-h-[95dvh]'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-40 p-2 transition-all duration-300 ease-in-out mt-16"
      onClick={handleBackdropClick}
    >
      <div className={`bg-slate-900 rounded-xl shadow-2xl w-full ${sizeClasses[size]} ${heightStyles[size]} flex flex-col overflow-hidden border border-slate-700 animate-in zoom-in-95 duration-200`}>
        <header className="p-3 sm:p-4 flex justify-between items-center border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-white truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700 flex-shrink-0"
            aria-label="Close media modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className={`flex-grow overflow-hidden flex flex-col ${disableTouch ? 'touch-none' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default MediaModal;