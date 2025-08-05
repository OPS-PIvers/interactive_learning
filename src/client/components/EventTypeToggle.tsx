import React from 'react';
import { InteractionType } from '../../shared/enums';

interface EventTypeOption {
  type: InteractionType;
  label: string;
  description: string;
  color: string;
  hoverColor: string;
  textColor: string;
}

interface EventTypeToggleProps {
  selectedTypes: Set<InteractionType>;
  onToggle: (type: InteractionType) => void;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  {
    type: InteractionType.PAN_ZOOM_TO_HOTSPOT,
    label: 'Pan & Zoom',
    description: 'Focus view',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    textColor: 'text-blue-200'
  },
  {
    type: InteractionType.SPOTLIGHT,
    label: 'Spotlight',
    description: 'Highlight area',
    color: 'bg-yellow-600',
    hoverColor: 'hover:bg-yellow-700',
    textColor: 'text-yellow-200'
  },
  {
    type: InteractionType.SHOW_TEXT,
    label: 'Show Text',
    description: 'Display message',
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    textColor: 'text-purple-200'
  },
  {
    type: InteractionType.QUIZ,
    label: 'Quiz',
    description: 'Ask question',
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-red-200'
  },
  {
    type: InteractionType.SHOW_VIDEO,
    label: 'Video',
    description: 'Play video file',
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    textColor: 'text-green-200'
  },
  {
    type: InteractionType.SHOW_AUDIO_MODAL,
    label: 'Audio',
    description: 'Play audio file',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    textColor: 'text-blue-200'
  },
  {
    type: InteractionType.SHOW_YOUTUBE,
    label: 'YouTube',
    description: 'Play YouTube video',
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-red-200'
  }
];

const EventTypeToggle: React.FC<EventTypeToggleProps> = ({ selectedTypes, onToggle }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-white mb-4">Event Types</h3>
      <div className="grid grid-cols-2 gap-3">
        {EVENT_TYPE_OPTIONS.map((option) => {
          const isSelected = selectedTypes.has(option.type);
          return (
            <button
              key={option.type}
              onClick={() => onToggle(option.type)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all transform
                ${isSelected 
                  ? `${option.color} border-opacity-100 -translate-y-0.5 shadow-lg` 
                  : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                }
                ${isSelected ? option.hoverColor : ''}
              `}
            >
              <div>
                <div>
                  <div className={`font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {option.label}
                  </div>
                  <div className={`text-sm ${isSelected ? option.textColor : 'text-slate-400'}`}>
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EventTypeToggle;