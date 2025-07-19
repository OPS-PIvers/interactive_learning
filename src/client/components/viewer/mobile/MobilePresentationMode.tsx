import React from 'react';
import { XMarkIcon } from '../icons/XMarkIcon';

interface MobilePresentationModeProps {
  onExit: () => void;
  children: React.ReactNode;
}

const MobilePresentationMode: React.FC<MobilePresentationModeProps> = ({ onExit, children }) => {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <header className="p-4 flex justify-end">
        <button
          onClick={onExit}
          className="text-white bg-slate-800 bg-opacity-50 p-2 rounded-full hover:bg-opacity-75"
          aria-label="Exit presentation mode"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </header>
      <main className="flex-grow flex items-center justify-center">
        {children}
      </main>
    </div>
  );
};

export default MobilePresentationMode;
