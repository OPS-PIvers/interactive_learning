import React from 'react';
import { TimelineEventData, InteractionType, HotspotData } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PencilIcon } from './icons/PencilIcon'; // Import PencilIcon

interface TimelineControlsProps {
  events: TimelineEventData[];
  currentStep: number;
  maxStep: number;
  onStepChange: (step: number) => void;
  isEditing: boolean;
  onAddEvent: () => void;
  onRemoveEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void; // Added for edit functionality
  hotspots: HotspotData[]; 
}

const TimelineControls: React.FC<TimelineControlsProps> = ({ events, currentStep, maxStep, onStepChange, isEditing, onAddEvent, onRemoveEvent, onEditEvent, hotspots }) => {
  
  if (!isEditing) {
    return null; // Render nothing if not in editing mode
  }

  const getEventDetails = (event: TimelineEventData): string => {
    let details = `${event.type}`;
    if (event.targetId) {
      const targetHotspot = hotspots.find(h => h.id === event.targetId);
      details += ` (${targetHotspot ? targetHotspot.title : event.targetId})`;
    }
    if (event.type === InteractionType.SHOW_MESSAGE && event.message) {
      details += `: "${event.message.substring(0,20)}${event.message.length > 20 ? '...' : ''}"`;
    }
    if (event.type === InteractionType.PULSE_HOTSPOT && event.duration) {
      details += ` (${event.duration}ms)`;
    }
    if (event.type === InteractionType.PAN_ZOOM_TO_HOTSPOT && event.zoomFactor) {
      details += ` (${event.zoomFactor}x)`;
    }
     if (event.type === InteractionType.HIGHLIGHT_HOTSPOT && event.highlightRadius) {
      details += ` (r:${event.highlightRadius}px)`;
    }
    return details;
  };
  
  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 text-slate-100">Timeline</h3>
      
      <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4 max-h-[300px] lg:max-h-none min-h-[100px]">
        {events.length === 0 && <p className="text-slate-400">No timeline events yet.</p>}
        {events.map((event) => (
          <div
            key={event.id}
            className={`p-3 rounded-md transition-all duration-200 cursor-pointer flex justify-between items-center group ${
              currentStep === event.step ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
            onClick={() => onStepChange(event.step)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onStepChange(event.step)}
            aria-label={`Event: ${event.name}, Step ${event.step}. Details: ${getEventDetails(event)}${currentStep === event.step ? '. Current step.' : ''}`}
          >
            <div>
              <p className={`font-medium ${currentStep === event.step ? 'text-white' : 'text-slate-100'}`}>{event.name}</p>
              <p className={`text-xs ${currentStep === event.step ? 'text-purple-200' : 'text-slate-400'}`}>
                Step {event.step} - {getEventDetails(event)}
              </p>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
              <button
                  onClick={(e) => { e.stopPropagation(); onEditEvent(event.id); }}
                  className="p-1 bg-blue-500/30 hover:bg-blue-500 text-white rounded-full"
                  aria-label={`Edit event ${event.name}`}
                >
                  <PencilIcon className="w-4 h-4"/>
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveEvent(event.id); }}
                  className="p-1 bg-red-500/30 hover:bg-red-500 text-white rounded-full"
                  aria-label={`Remove event ${event.name}`}
                >
                  <XMarkIcon className="w-4 h-4"/>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700">
          <button
            onClick={() => onStepChange(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous step"
          >
            Prev
          </button>
          <span className="text-slate-300" aria-live="polite">Step {currentStep} / {maxStep}</span>
          <button
            onClick={() => onStepChange(Math.min(maxStep || 1, currentStep + 1))}
            disabled={currentStep === maxStep && events.length > 0}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next step"
          >
            Next
          </button>
        </div>
        <button
          onClick={onAddEvent}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center justify-center space-x-2"
          aria-label="Add new timeline event"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Timeline Event</span>
        </button>
      </>
    </div>
  );
};

export default TimelineControls;