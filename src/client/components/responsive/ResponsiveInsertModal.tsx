/**
 * Responsive Insert Modal Component
 * 
 * Unified modal for inserting new slide elements that adapts to all screen sizes.
 * Progressive enhancement from mobile-first foundation to desktop features.
 */

import React from 'react';
import { ResponsiveModal } from './ResponsiveModal';

interface ResponsiveInsertModalProps {
  onInsertElement: (type: 'hotspot' | 'text' | 'media' | 'shape') => void;
  onClose: () => void;
}

/**
 * ResponsiveInsertModal - Unified modal for inserting new slide elements
 */
export const ResponsiveInsertModal: React.FC<ResponsiveInsertModalProps> = ({
  onInsertElement,
  onClose
}) => {
  const handleInsert = (type: 'hotspot' | 'text' | 'media' | 'shape') => {
    onInsertElement(type);
    onClose();
  };

  const insertOptions = [
    {
      type: 'hotspot' as const,
      title: 'Hotspot',
      description: 'Interactive point for quizzes, links, or actions',
      icon: '🎯',
      color: 'bg-blue-500'
    },
    {
      type: 'text' as const,
      title: 'Text',
      description: 'Add text content to your slide',
      icon: '📝',
      color: 'bg-green-500'
    },
    {
      type: 'media' as const,
      title: 'Media',
      description: 'Insert images, videos, or audio',
      icon: '🖼️',
      color: 'bg-purple-500'
    },
    {
      type: 'shape' as const,
      title: 'Shape',
      description: 'Add geometric shapes and decorations',
      icon: '⬜',
      color: 'bg-orange-500'
    }
  ];

  return (
    <ResponsiveModal
      type="insert"
      isOpen={true}
      onClose={onClose}
      title="Insert Element"
    >
      <div className="p-4 sm:p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Insert Element
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Element options */}
        <div className="max-h-64 sm:max-h-96 overflow-y-auto mb-4 sm:mb-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {insertOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleInsert(option.type)}
                className="w-full p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${option.color} rounded-lg flex items-center justify-center text-white text-lg sm:text-xl shadow-sm group-hover:shadow-md transition-shadow`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {option.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Quick Tips
          </h4>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• Hotspots can trigger quizzes, videos, or navigation</li>
            <li>• Text elements support rich formatting</li>
            <li>• Media elements can be images, videos, or audio files</li>
            <li>• Shapes can be used for backgrounds or decorations</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="pt-3 sm:pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors rounded-lg text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ResponsiveInsertModal;