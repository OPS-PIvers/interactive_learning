import React, { useState } from 'react';
import { InteractionType } from '../../shared/InteractionPresets';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

interface InteractionTypeOption {
  type: InteractionType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface InteractionTypeSelectorProps {
  onSelectType: (type: InteractionType) => void;
  onClose?: () => void;
}

// Clean, current interaction types only - no legacy/duplicates
const INTERACTION_TYPES: InteractionTypeOption[] = [
  {
    type: InteractionType.SPOTLIGHT,
    label: 'Spotlight',
    description: 'Highlight an area with a spotlight effect',
    icon: '💡',
    color: 'bg-yellow-500'
  },
  {
    type: InteractionType.PAN_ZOOM,
    label: 'Pan & Zoom',
    description: 'Navigate to specific coordinates with zoom',
    icon: '🔍',
    color: 'bg-green-500'
  },
  {
    type: InteractionType.SHOW_TEXT,
    label: 'Text Display',
    description: 'Show text content with customizable positioning',
    icon: '📝',
    color: 'bg-blue-500'
  },
  {
    type: InteractionType.PLAY_VIDEO,
    label: 'Video',
    description: 'Play video content inline, modal, or overlay',
    icon: '🎬',
    color: 'bg-red-500'
  },
  {
    type: InteractionType.PLAY_AUDIO,
    label: 'Audio',
    description: 'Play audio with optional controls display',
    icon: '🎵',
    color: 'bg-purple-500'
  },
  {
    type: InteractionType.QUIZ,
    label: 'Quiz Question',
    description: 'Interactive quiz with multiple choice answers',
    icon: '❓',
    color: 'bg-orange-500'
  }
];

const InteractionTypeSelector: React.FC<InteractionTypeSelectorProps> = ({ onSelectType }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectType = (type: InteractionType) => {
    onSelectType(type);
    setIsOpen(false);
  };

  return (
    <>
      {/* Add Interaction Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        Add Interaction
      </button>

      {/* Selection Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 ${Z_INDEX_TAILWIND.MODAL_BACKDROP}`}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${Z_INDEX_TAILWIND.MODAL_CONTENT} w-full max-w-md mx-4`}>
            <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-600">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-semibold text-white">Select Interaction Type</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid gap-3">
                  {INTERACTION_TYPES.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => handleSelectType(option.type)}
                      className="flex items-start gap-3 p-3 text-left rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${option.color} flex items-center justify-center text-white text-lg`}>
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white mb-1">{option.label}</div>
                        <div className="text-sm text-gray-300 leading-snug">{option.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Also export a button-only version for when we want just the trigger
export const AddInteractionButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
  >
    <PlusIcon className="w-5 h-5" />
    Add Interaction
  </button>
);

export default InteractionTypeSelector;