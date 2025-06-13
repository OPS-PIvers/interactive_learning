import React from 'react';
import { InteractionType } from '../../shared/types';

interface EventTypeOption {
  value: InteractionType;
  label: string;
  icon: string;
  description: string;
}

interface EventTypeSelectorProps {
  value: InteractionType;
  onChange: (type: InteractionType) => void;
  className?: string;
}

const eventTypeOptions: EventTypeOption[] = [
  {
    value: InteractionType.SHOW_HOTSPOT,
    label: 'Show Hotspot',
    icon: '👁️',
    description: 'Make the hotspot visible'
  },
  {
    value: InteractionType.HIDE_HOTSPOT,
    label: 'Hide Hotspot',
    icon: '🫥',
    description: 'Hide the hotspot from view'
  },
  {
    value: InteractionType.PULSE_HOTSPOT,
    label: 'Pulse Hotspot',
    icon: '💓',
    description: 'Make the hotspot pulse to attract attention'
  },
  {
    value: InteractionType.SHOW_MESSAGE,
    label: 'Show Message',
    icon: '💬',
    description: 'Display a text message'
  },
  {
    value: InteractionType.PAN_ZOOM_TO_HOTSPOT,
    label: 'Pan & Zoom',
    icon: '🔍',
    description: 'Pan and zoom the image to focus on the hotspot'
  },
  {
    value: InteractionType.HIGHLIGHT_HOTSPOT,
    label: 'Highlight',
    icon: '🎯',
    description: 'Highlight the hotspot while dimming the rest'
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
            {option.icon} {option.label}
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