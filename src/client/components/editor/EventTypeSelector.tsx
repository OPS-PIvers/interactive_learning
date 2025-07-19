import React from 'react';
import { InteractionType } from '../../shared/types';

interface EventTypeOption {
  value: InteractionType;
  label: string;
  description: string;
}

interface EventTypeSelectorProps {
  value: InteractionType;
  onChange: (type: InteractionType) => void;
  className?: string;
}

const eventTypeOptions: EventTypeOption[] = [
  {
    value: InteractionType.PAN_ZOOM,
    label: 'Pan & Zoom',
    description: 'Pan and zoom the image to focus on the hotspot'
  },
  {
    value: InteractionType.SHOW_IMAGE,
    label: 'Show Image',
    description: 'Display an image with optional caption and modal'
  },
  {
    value: InteractionType.QUIZ,
    label: 'Quiz',
    description: 'Show a quiz question'
  },
  {
    value: InteractionType.PLAY_VIDEO,
    label: 'Play Video',
    description: 'Play video from file, YouTube, or URL'
  },
  {
    value: InteractionType.PLAY_AUDIO,
    label: 'Play Audio',
    description: 'Play audio file with various display modes'
  },
  {
    value: InteractionType.SHOW_TEXT,
    label: 'Show Text',
    description: 'Display text content'
  },
  {
    value: InteractionType.SPOTLIGHT,
    label: 'Spotlight',
    description: 'Focus attention on area with spotlight effect'
  }
];

const EventTypeSelector: React.FC<EventTypeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const selectedOption = eventTypeOptions.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as InteractionType)}
        className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none pr-10"
      >
        {eventTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Description tooltip */}
      {selectedOption && (
        <p className="text-xs text-slate-400 mt-1">{selectedOption.description}</p>
      )}
    </div>
  );
};

export default EventTypeSelector;