import React, { useState, useRef } from 'react';
import { TimelineEventData, InteractionType } from '../../shared/types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import DragHandle from './DragHandle';
import EventTypeSelector from './EventTypeSelector';
import SliderControl from './SliderControl';

interface EditableEventCardProps {
  event: TimelineEventData;
  isActive: boolean;
  isDragging: boolean;
  onUpdate: (event: TimelineEventData) => void;
  onDelete: (eventId: string) => void;
  onJumpToStep: (step: number) => void;
  onDragStart: (e: React.DragEvent, eventId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetEventId: string) => void;
  className?: string;
}

const EditableEventCard: React.FC<EditableEventCardProps> = ({
  event,
  isActive,
  isDragging,
  onUpdate,
  onDelete,
  onJumpToStep,
  onDragStart,
  onDragOver,
  onDrop,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<TimelineEventData>(event);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = (newType: InteractionType) => {
    const updatedEvent = { ...editedEvent, type: newType };
    
    // Reset type-specific properties when changing type
    if (newType === InteractionType.PAN_ZOOM_TO_HOTSPOT) {
      updatedEvent.zoomFactor = updatedEvent.zoomFactor || 2.0;
    } else if (newType === InteractionType.HIGHLIGHT_HOTSPOT) {
      updatedEvent.highlightRadius = updatedEvent.highlightRadius || 60;
    } else if (newType === InteractionType.SHOW_MESSAGE) {
      updatedEvent.message = updatedEvent.message || '';
    } else if (newType === InteractionType.PULSE_HOTSPOT) {
      updatedEvent.duration = updatedEvent.duration || 2000;
    }
    
    setEditedEvent(updatedEvent);
    onUpdate(updatedEvent);
  };

  const handleNameChange = (newName: string) => {
    const updatedEvent = { ...editedEvent, name: newName };
    setEditedEvent(updatedEvent);
    onUpdate(updatedEvent);
  };

  const handleZoomFactorChange = (zoomFactor: number) => {
    const updatedEvent = { ...editedEvent, zoomFactor };
    setEditedEvent(updatedEvent);
    onUpdate(updatedEvent);
  };

  const handleHighlightRadiusChange = (highlightRadius: number) => {
    const updatedEvent = { ...editedEvent, highlightRadius };
    setEditedEvent(updatedEvent);
    onUpdate(updatedEvent);
  };

  const handleMessageChange = (message: string) => {
    const updatedEvent = { ...editedEvent, message };
    setEditedEvent(updatedEvent);
    onUpdate(updatedEvent);
  };

  const handleDurationChange = (duration: number) => {
    const updatedEvent = { ...editedEvent, duration };
    setEditedEvent(updatedEvent);
    onUpdate(updatedEvent);
  };

  const handleDeleteClick = () => {
    if (confirm(`Delete event "${event.name}"?`)) {
      onDelete(event.id);
    }
  };

  const getEventIcon = (type: InteractionType) => {
    switch (type) {
      case InteractionType.SHOW_HOTSPOT: return '👁️';
      case InteractionType.HIDE_HOTSPOT: return '🫥';
      case InteractionType.PULSE_HOTSPOT: return '💓';
      case InteractionType.SHOW_MESSAGE: return '💬';
      case InteractionType.PAN_ZOOM_TO_HOTSPOT: return '🔍';
      case InteractionType.HIGHLIGHT_HOTSPOT: return '🎯';
      default: return '❓';
    }
  };

  const renderTypeSpecificControls = () => {
    switch (editedEvent.type) {
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return (
          <div className="mt-3">
            <SliderControl
              label="Zoom Factor"
              value={editedEvent.zoomFactor || 2.0}
              min={1.0}
              max={5.0}
              step={0.1}
              unit="x"
              onChange={handleZoomFactorChange}
            />
          </div>
        );
        
      case InteractionType.HIGHLIGHT_HOTSPOT:
        return (
          <div className="mt-3">
            <SliderControl
              label="Highlight Radius"
              value={editedEvent.highlightRadius || 60}
              min={20}
              max={200}
              step={5}
              unit="px"
              onChange={handleHighlightRadiusChange}
            />
          </div>
        );
        
      case InteractionType.SHOW_MESSAGE:
        return (
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
            <textarea
              value={editedEvent.message || ''}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="Enter message to display..."
              className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        );
        
      case InteractionType.PULSE_HOTSPOT:
        return (
          <div className="mt-3">
            <SliderControl
              label="Pulse Duration"
              value={editedEvent.duration || 2000}
              min={500}
              max={5000}
              step={100}
              unit="ms"
              onChange={handleDurationChange}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={(e) => onDragStart(e, event.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, event.id)}
      className={`border rounded-lg transition-all duration-200 ${
        isDragging 
          ? 'opacity-50 scale-95 border-purple-500' 
          : isActive
            ? 'bg-purple-600/20 border-purple-500'
            : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
      } ${className}`}
    >
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <DragHandle isDragging={isDragging} className="flex-shrink-0" />
          
          {/* Event Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                Step {event.step}
              </span>
              {isActive && (
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                  Active
                </span>
              )}
            </div>
            
            {/* Event Name */}
            {isEditing ? (
              <input
                type="text"
                value={editedEvent.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditing(false);
                  if (e.key === 'Escape') {
                    setEditedEvent(event);
                    setIsEditing(false);
                  }
                }}
                className="bg-slate-700 text-slate-100 border border-slate-600 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            ) : (
              <h5 
                className="font-medium text-slate-100 text-sm cursor-pointer hover:text-purple-300"
                onClick={() => setIsEditing(true)}
              >
                {event.name}
              </h5>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">
                {getEventIcon(event.type)} {event.type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onJumpToStep(event.step)}
              className="p-1 text-slate-400 hover:text-purple-400 transition-colors"
              title="Jump to this step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
              title="Edit event"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete event"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="border-t border-slate-600 p-3 space-y-3">
          {/* Event Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
            <EventTypeSelector
              value={editedEvent.type}
              onChange={handleTypeChange}
            />
          </div>
          
          {/* Type-specific Controls */}
          {renderTypeSpecificControls()}
        </div>
      )}
    </div>
  );
};

export default EditableEventCard;