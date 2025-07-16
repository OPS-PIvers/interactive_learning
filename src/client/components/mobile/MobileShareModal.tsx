import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '../icons/XMarkIcon';
import QRCode from 'qrcode.react';
import { shareNatively } from '../../utils/mobileSharing';
import { ShareIcon } from '../icons/ShareIcon';
import MobilePresentationMode from './MobilePresentationMode';
import { EyeIcon } from '../icons/EyeIcon';
import useScreenReaderAnnouncements from '../../hooks/useScreenReaderAnnouncements';
import { triggerHapticFeedback } from '../../utils/hapticUtils';

interface MobileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  children: React.ReactNode;
}

const MobileShareModal: React.FC<MobileShareModalProps> = ({ isOpen, onClose, title, shareUrl, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [shareResult, setShareResult] = useState<string | null>(null);
  const { announce } = useScreenReaderAnnouncements();

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      // Reset state when modal closes
      setIsPresenting(false);
      setShareResult(null);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
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

  const handleShare = async () => {
    try {
      const result = await shareNatively(title, `Check out this module: ${title}`, shareUrl);
      if (result === 'shared') {
        setShareResult('Content shared successfully!');
        announce('Content shared successfully!', 'polite');
        triggerHapticFeedback('success');
      } else if (result === 'copied') {
        setShareResult('Link copied to clipboard!');
        announce('Link copied to clipboard!', 'polite');
        triggerHapticFeedback('success');
      }
    } catch (error) {
      setShareResult('Failed to share content. Please try again.');
      announce('Failed to share content. Please try again.', 'assertive');
      triggerHapticFeedback('error');
    }
  };

  const handlePresent = () => {
    setIsPresenting(true);
    announce('Entering presentation mode', 'polite');
  };

  if (isPresenting) {
    return (
      <MobilePresentationMode onExit={() => setIsPresenting(false)}>
        {children}
      </MobilePresentationMode>
    );
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-2"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] h-auto flex flex-col overflow-hidden border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-slate-700">
          <h2 id="modal-title" className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-4 flex-grow flex flex-col items-center">
          <div className="p-2 bg-white rounded-lg">
            <QRCode value={shareUrl} size={128} />
          </div>
          <p className="text-slate-300 mt-4 text-center">Scan QR code to open on another device</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleShare}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <ShareIcon className="w-5 h-5 mr-2" />
              Share
            </button>
            <button
              onClick={handlePresent}
              className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-purple-700 transition-colors"
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              Present
            </button>
          </div>
          {shareResult && (
            <div className="mt-4 p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm text-center">
              {shareResult}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MobileShareModal;
