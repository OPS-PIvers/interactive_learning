import React from 'react';
import { TimelineEventData } from '../../shared/types';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface EventCardProps {
  event: TimelineEventData;
  onPreviewEvent?: (event: TimelineEventData) => void;
  onStopPreview?: () => void;
  onDeleteTimelineEvent: (eventId: string) => void;
  isCurrentlyPreviewing: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onPreviewEvent,
  onStopPreview,
  onDeleteTimelineEvent,
  isCurrentlyPreviewing,
}) => {
  return (
    <div key={event.id} className="bg-slate-700 rounded-lg p-3 border border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium text-sm">{event.name}</span>
          <span className="text-xs text-slate-400">Step {event.step}</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Preview Toggle Button */}
          <button
            onClick={() => isCurrentlyPreviewing ? onStopPreview?.() : onPreviewEvent?.(event)}
            className={`p-1 rounded transition-colors ${
              isCurrentlyPreviewing
                ? 'text-purple-400 bg-purple-400/20'
                : 'text-slate-400 hover:text-purple-400'
            }`}
            title={isCurrentlyPreviewing ? "Stop Preview" : "Preview Event"}
          >
            {isCurrentlyPreviewing ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => { /* TODO: Implement event editing */ }}
            className="p-1 text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit event (Not yet implemented)"
            disabled
          >
            <PencilIcon className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDeleteTimelineEvent(event.id)}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete event"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Event details */}
      <div className="text-xs text-slate-400 space-y-1">
        <div>Type: {event.type.replace(/_/g, ' ')}</div>
        {event.message && <div>Message: "{event.message}"</div>}
        {event.duration && <div>Duration: {event.duration}ms</div>}
        {event.zoomFactor && <div>Zoom: {event.zoomFactor}x</div>}
      </div>
    </div>
  );
};

export default React.memo(EventCard);
