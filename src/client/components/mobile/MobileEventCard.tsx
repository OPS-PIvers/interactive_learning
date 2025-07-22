import React, { useState } from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { MobileEventSettings } from './MobileEventSettings';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';

interface MobileEventCardProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  onDelete: () => void;
  onSelect: () => void;
  onPreview: () => void;
}

const getEventIcon = (type: InteractionType) => {
  const iconMap: Record<InteractionType, string> = {
    [InteractionType.SHOW_TEXT]: '💬',
    [InteractionType.SHOW_VIDEO]: '🎥',
    [InteractionType.SHOW_AUDIO_MODAL]: '🎵',
    [InteractionType.SHOW_YOUTUBE]: '📺',
    [InteractionType.SPOTLIGHT]: '💡',
    [InteractionType.PAN_ZOOM]: '🔍',
    [InteractionType.PULSE_HOTSPOT]: '💓',
    [InteractionType.QUIZ]: '❓',
    // Add other icons as needed
  };
  return iconMap[type] || '⚙️';
};

const MobileEventCard: React.FC<MobileEventCardProps> = ({ event, onUpdate, onDelete, onSelect, onPreview }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...event, name: e.target.value });
  };

  return (
    <div className="bg-slate-700 rounded-lg border border-slate-600 shadow-md" tabIndex={0}>
      <div
        className="flex items-center p-3 cursor-pointer"
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect();
          }
        }}
        role="button"
        aria-label={`Select event: ${event.name || `Event at step ${event.step}`}`}
      >
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-2xl" aria-hidden="true">{getEventIcon(event.type)}</span>
          <div className="flex-1">
            <p className="text-white font-medium">{event.name || `Event at step ${event.step}`}</p>
            <p className="text-sm text-gray-400">
              Step {event.step} • {event.type}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-2 text-gray-400 hover:text-white"
            aria-label={`Preview event: ${event.name}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          <button
            onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
            }}
            className="p-2 text-gray-400 hover:text-white"
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} event details for ${event.name}`}
            aria-expanded={isExpanded}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          <div className="cursor-grab p-2 text-gray-400 hover:text-white" aria-label="Drag to reorder">
            <DragHandleDots2Icon />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-600">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor={`event-name-${event.id}`}>Event Name</label>
              <input
                id={`event-name-${event.id}`}
                type="text"
                value={event.name || ''}
                onChange={handleTitleChange}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400"
                placeholder="Enter event name"
              />
            </div>

            <MobileEventSettings event={event} onUpdate={(update) => onUpdate({ ...event, ...update })} />

            <button
              onClick={onDelete}
              className="w-full py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              aria-label={`Delete event: ${event.name}`}
            >
              Delete Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileEventCard;
