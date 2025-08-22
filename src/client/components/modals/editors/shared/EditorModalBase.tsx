import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Z_INDEX_TAILWIND } from '../../../../utils/zIndexLevels';

interface EditorModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const EditorModalBase: React.FC<EditorModalBaseProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`
          fixed inset-0 ${Z_INDEX_TAILWIND.SYSTEM_MODAL} bg-black bg-opacity-50 flex items-center justify-center p-4
          transform transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      >
        <div
          className={`
            ${Z_INDEX_TAILWIND.SYSTEM_MODAL} bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-lg shadow-2xl flex flex-col
            w-[95vw] h-[90vh]
            sm:w-full sm:max-w-2xl sm:h-[80vh] sm:max-h-[600px]
            transform transition-all duration-300 ease-out
            ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DndProvider>
  );
};

export default EditorModalBase;
