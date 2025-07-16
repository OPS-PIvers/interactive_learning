import React from 'react';
import { InteractionType } from '../../../shared/types';

const MOBILE_INTERACTION_TYPES = [
  {
    category: 'Visual Effects',
    types: [
      { value: InteractionType.SPOTLIGHT, label: 'Spotlight', icon: '💡', description: 'Focus attention on area' },
      { value: InteractionType.PAN_ZOOM, label: 'Pan & Zoom', icon: '🔍', description: 'Focus on area' },
      { value: InteractionType.PULSE_HOTSPOT, label: 'Pulse', icon: '💓', description: 'Animate hotspot' },
    ]
  },
  {
    category: 'Media',
    types: [
      { value: InteractionType.PLAY_VIDEO, label: 'Video', icon: '🎥', description: 'File, YouTube, or record video' },
      { value: InteractionType.PLAY_AUDIO, label: 'Audio', icon: '🔊', description: 'File or record audio' },
      { value: InteractionType.SHOW_IMAGE_MODAL, label: 'Image', icon: '🖼️', description: 'Show image' },
    ]
  },
  {
    category: 'Interactive',
    types: [
      { value: InteractionType.SHOW_TEXT, label: 'Text', icon: '💬', description: 'Show text content' },
      { value: InteractionType.QUIZ, label: 'Quiz', icon: '❓', description: 'Ask question' },
    ]
  }
];

const MobileEventTypeSelector: React.FC<{
  onSelect: (type: InteractionType) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-60 bg-black bg-opacity-75 flex flex-col justify-end">
      <div className="bg-slate-800 rounded-t-2xl p-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Select Event Type</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close event type selector">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto">
          {MOBILE_INTERACTION_TYPES.map(category => (
            <div key={category.category} className="mb-4">
              <h4 className="text-sm font-bold text-purple-400 mb-2 px-2">{category.category}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {category.types.map(type => (
                  <button
                    key={type.value}
                    onClick={() => onSelect(type.value)}
                    className="bg-slate-700 rounded-lg p-4 text-left hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-semibold text-white">{type.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileEventTypeSelector;
