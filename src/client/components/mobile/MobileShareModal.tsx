import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '../icons/XMarkIcon';
import QRCode from 'qrcode.react';
import { shareNatively } from '../../utils/mobileSharing';
import { ShareIcon } from '../icons/ShareIcon';
import MobilePresentationMode from './MobilePresentationMode';
import { EyeIcon } from '../icons/EyeIcon';

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

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = () => {
    shareNatively(title, `Check out this module: ${title}`, shareUrl);
  };

  const handlePresent = () => {
    setIsPresenting(true);
  };

  if (isPresenting) {
    return (
      <MobilePresentationMode onExit={() => setIsPresenting(false)}>
        {children}
      </MobilePresentationMode>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-2"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] h-auto flex flex-col overflow-hidden border border-slate-700"
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
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
            >
              <ShareIcon className="w-5 h-5 mr-2" />
              Share
            </button>
            <button
              onClick={handlePresent}
              className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
            >
              <EyeIcon className="w-5 h-5 mr-2" />
              Present
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MobileShareModal;
