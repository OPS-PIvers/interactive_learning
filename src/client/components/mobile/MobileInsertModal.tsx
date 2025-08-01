import React from 'react';
import Modal from '../Modal';

interface MobileInsertModalProps {
  onInsertElement: (type: 'hotspot' | 'text' | 'media' | 'shape') => void;
  onClose: () => void;
}

/**
 * MobileInsertModal - Modal for inserting new elements on mobile
 * 
 * Provides easy-to-tap buttons for adding different element types:
 * - Hotspots for interactions
 * - Text elements
 * - Media (images/videos)
 * - Shapes
 */
export const MobileInsertModal: React.FC<MobileInsertModalProps> = ({
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
    <Modal isOpen={true} onClose={onClose} title="Insert Element">
      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
        <div className="grid grid-cols-1 gap-3">
          {insertOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => handleInsert(option.type)}
              className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-white text-xl shadow-sm group-hover:shadow-md transition-shadow`}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick tips */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Quick Tips
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Hotspots can trigger quizzes, videos, or navigation</li>
            <li>• Text elements support rich formatting</li>
            <li>• Media elements can be images, videos, or audio files</li>
            <li>• Shapes can be used for backgrounds or decorations</li>
          </ul>
        </div>
      </div>
      
      {/* Fixed Cancel button at bottom */}
      <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4">
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors rounded-lg"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default MobileInsertModal;