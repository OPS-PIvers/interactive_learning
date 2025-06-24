import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { TimelineEventData, InteractionType, HotspotData } from '../../shared/types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import DragHandle from './DragHandle';
import EventTypeSelector from './EventTypeSelector';
import SliderControl from './SliderControl';

interface EditableEventCardProps {
  index: number;
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  onDelete: (eventId: string) => void;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onTogglePreview: () => void;
  isPreviewing: boolean;
  allHotspots: HotspotData[];
  isActive?: boolean;
  onJumpToStep?: (step: number) => void;
  className?: string;
}

const EventTypeToggle: React.FC<{ type: InteractionType }> = ({ type }) => {
  const getTypeLabel = () => {
    switch (type) {
      case InteractionType.SPOTLIGHT:
      case InteractionType.HIGHLIGHT_HOTSPOT:
        return 'spotlight';
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return 'pan-zoom';
      case InteractionType.SHOW_TEXT:
        return 'text';
      case InteractionType.SHOW_IMAGE_MODAL:
      case InteractionType.SHOW_VIDEO:
      case InteractionType.SHOW_YOUTUBE:
        return 'media';
      case InteractionType.QUIZ:
        return 'question';
      default:
        return type.toLowerCase().replace('_', ' ');
    }
  };

  return (
    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
      {getTypeLabel()}
    </span>
  );
};

const EditableEventCard: React.FC<EditableEventCardProps> = ({
  index,
  event,
  onUpdate,
  onDelete,
  moveCard,
  onTogglePreview,
  isPreviewing,
  allHotspots,
  isActive = false,
  onJumpToStep,
  className = ''
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(event.name || '');
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    { index: number },
    void,
    { handlerId: Identifier | null }
  >({
    accept: 'card',
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return;

      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: () => ({ id: event.id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const renderSettings = () => {
    switch (event.type) {
      case InteractionType.SPOTLIGHT:
      case InteractionType.HIGHLIGHT_HOTSPOT:
        return (
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm">Shape:</label>
              <select
                value={event.highlightShape || event.shape || 'circle'}
                onChange={(e) => onUpdate({ 
                  ...event, 
                  highlightShape: e.target.value as 'circle' | 'rectangle',
                  shape: e.target.value as 'circle' | 'rectangle'
                })}
                className="bg-gray-800 text-white p-1 rounded"
              >
                <option value="circle">Circle</option>
                <option value="rectangle">Rectangle</option>
              </select>
            </div>
            <SliderControl
              label="Opacity"
              value={event.opacity || event.dimPercentage ? (event.dimPercentage || 70) / 100 : 0.7}
              min={0}
              max={1}
              step={0.01}
              unit=""
              onChange={(val) => onUpdate({ 
                ...event, 
                opacity: val,
                dimPercentage: val * 100
              })}
            />
          </div>
        );

      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return (
          <div className="space-y-2 mt-2">
            <SliderControl
              label="Zoom"
              value={event.zoom || event.zoomLevel || event.zoomFactor || 2}
              min={1}
              max={10}
              step={0.1}
              unit="x"
              onChange={(val) => onUpdate({ 
                ...event, 
                zoom: val,
                zoomLevel: val,
                zoomFactor: val
              })}
            />
          </div>
        );

      case InteractionType.SHOW_TEXT:
        return (
          <textarea
            value={event.content || event.textContent || ''}
            onChange={(e) => onUpdate({ 
              ...event, 
              content: e.target.value,
              textContent: e.target.value
            })}
            className="w-full bg-gray-800 text-white p-1 rounded"
            placeholder="Enter text content..."
          />
        );

      case InteractionType.SHOW_IMAGE_MODAL:
      case InteractionType.SHOW_VIDEO:
      case InteractionType.SHOW_YOUTUBE:
        return (
          <input
            type="text"
            value={event.url || event.mediaUrl || event.imageUrl || event.videoUrl || ''}
            onChange={(e) => onUpdate({ 
              ...event, 
              url: e.target.value,
              mediaUrl: e.target.value,
              imageUrl: e.target.value,
              videoUrl: e.target.value
            })}
            className="w-full bg-gray-800 text-white p-1 rounded"
            placeholder="Enter media URL"
          />
        );

      case InteractionType.QUIZ:
        return (
          <div className="space-y-2 mt-2">
            <input
              type="text"
              value={event.question || event.quizQuestion || ''}
              onChange={(e) => onUpdate({ 
                ...event, 
                question: e.target.value,
                quizQuestion: e.target.value
              })}
              className="w-full bg-gray-800 text-white p-1 rounded"
              placeholder="Enter question..."
            />
            <select
              value={event.targetHotspotId || ''}
              onChange={(e) => onUpdate({ ...event, targetHotspotId: e.target.value })}
              className="w-full bg-gray-800 text-white p-1 rounded"
            >
              <option value="">Select Target Hotspot</option>
              {allHotspots.filter(h => h.id !== event.targetId).map(h => (
                <option key={h.id} value={h.id}>{h.title || h.id}</option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.2 : 1 }}
      data-handler-id={handlerId}
      className="p-3 mb-2 bg-gray-600 rounded-lg shadow cursor-move"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <EventTypeToggle type={event.type} />
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                onUpdate({ ...event, name: title });
              }}
              autoFocus
              className="bg-gray-800 text-white p-1 rounded ml-2"
            />
          ) : (
            <span className="font-bold text-sm ml-2">{event.name}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePreview}
            className="text-gray-400 hover:text-white"
            aria-label="Toggle Preview"
          >
            <EyeIcon className={`w-5 h-5 ${isPreviewing ? 'text-blue-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsEditingTitle(!isEditingTitle)}
            className="text-gray-400 hover:text-white"
            aria-label="Edit Title"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="text-gray-400 hover:text-red-500"
            aria-label="Delete Event"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {renderSettings()}
    </div>
  );
};

export default EditableEventCard;