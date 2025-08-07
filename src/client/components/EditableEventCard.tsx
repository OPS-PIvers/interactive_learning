import type { Identifier, XYCoord } from 'dnd-core';
import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { InteractionType } from '../../shared/InteractionPresets';
import { TimelineEventData, HotspotData, MediaQuizTrigger } from '../../shared/types';
import { triggerHapticFeedback } from '../utils/hapticUtils'; // Import haptic utility
import DragHandle from './DragHandle'; // Assuming DragHandle.tsx exists
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { GearIcon } from './icons/GearIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
// import EventTypeSelector from './EventTypeSelector';
import InteractionParameterPreview from './interactions/InteractionParameterPreview';
interface EditableEventCardProps {
  index: number;
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  onDelete: (eventId: string) => void;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onTogglePreview: () => void;
  onEdit: () => void;
  isPreviewing: boolean;
  // isBeingDragged?: boolean; // This will be determined by the useDrag hook within this component
  allHotspots: HotspotData[];
  isActive?: boolean;
  onJumpToStep?: (step: number) => void;
  className?: string;
}

const EventTypeToggle: React.FC<{ type: InteractionType }> = ({ type }) => {
  const getTypeLabel = () => {
    // ... (same as existing getTypeLabel)
    switch (type) {
      case InteractionType.SPOTLIGHT:
        return 'spotlight';
      case InteractionType.PAN_ZOOM:
        return 'pan-zoom';
      case InteractionType.SHOW_TEXT:
        return 'text';
      case InteractionType.PLAY_VIDEO:
        return 'media';
      case InteractionType.QUIZ:
        return 'question';
      case InteractionType.PLAY_AUDIO:
        return 'audio';
      default:
        return type.toLowerCase().replace(/_/g, ' ').replace('hotspot', '').trim();
    }
  };

  return (
    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200 dark:text-purple-300 dark:bg-purple-700">
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
  onEdit,
  isPreviewing,
  allHotspots,
  isActive = false,
  onJumpToStep,
  className = ''
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(event.name || '');
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    { id: string; index: number; type: string }, // item object type from useDrag
    void,
    { handlerId: Identifier | null }
  >({
    accept: 'EditableEventCard',
    hover(item, monitor) {
      if (!cardRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = cardRef.current?.getBoundingClientRect();
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

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'EditableEventCard',
    item: () => ({ id: event.id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // Connect drag source to the handle, preview to the card, drop to the card
  if (dragHandleRef.current) {
    drag(dragHandleRef);
  }
  if (cardRef.current) {
    preview(cardRef);
    drop(cardRef);
  }

  const inputBaseClasses = "w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:focus:ring-purple-600 dark:focus:border-purple-600";
  const checkboxLabelClasses = "flex items-center space-x-2 cursor-pointer text-sm text-slate-300 dark:text-slate-400";
  const checkboxInputClasses = "form-checkbox h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-offset-slate-900";

  const cardBaseClasses = `p-3 mb-2 rounded-lg shadow transition-opacity dark:shadow-md`;
  const cardBgColor = isDragging ? 'bg-slate-700 dark:bg-slate-800' : 'bg-slate-600 dark:bg-slate-700/50';
  const cardActiveColor = isActive ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-800 dark:ring-purple-600 dark:ring-offset-slate-900' : '';

  return (
    <div
      ref={cardRef}
      style={{ opacity: isDragging ? 0.4 : 1 }} // More pronounced opacity change
      data-handler-id={handlerId}
      className={`${cardBaseClasses} ${cardBgColor} ${cardActiveColor} ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center flex-grow min-w-0">
          <div ref={dragHandleRef} className="cursor-grab active:cursor-grabbing touch-manipulation p-1 -ml-1">
            <DragHandle
              className="text-slate-400 dark:text-slate-500"
              isDragging={isDragging}
            />
          </div>
          <div className="flex-grow min-w-0 ml-1">
            <div className="flex items-center mb-0.5">
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
                  onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditingTitle(false); onUpdate({ ...event, name: title });}}}
                  autoFocus
                  className="ml-2 p-1 bg-slate-700 border border-slate-500 rounded-md text-white text-sm font-semibold flex-grow min-w-0 dark:bg-slate-800 dark:border-slate-600"
                />
              ) : (
                <button
                  onClick={() => onJumpToStep && onJumpToStep(event.step)}
                  className="ml-2 text-sm font-semibold text-left text-white dark:text-slate-200 truncate hover:text-purple-300 dark:hover:text-purple-400 transition-colors"
                  title={event.name}
                >
                  {event.name || `Event at step ${event.step}`}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 ml-0">
              Step: {event.step}{event.duration ? `, Duration: ${event.duration/1000}s` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-0.5 flex-shrink-0 ml-1">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePreview(); }}
            className="p-1.5 text-slate-400 hover:text-purple-400 rounded-md hover:bg-slate-700 dark:text-slate-500 dark:hover:text-purple-500 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Preview"
          >
            {isPreviewing ? ( <EyeSlashIcon className="w-5 h-5" /> ) : ( <EyeIcon className="w-5 h-5" /> )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Edit Title"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Edit Parameters"
          >
            <GearIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-700 dark:text-slate-500 dark:hover:text-red-600 dark:hover:bg-slate-800 transition-colors"
            aria-label="Delete Event"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <InteractionParameterPreview event={event} />
    </div>
  );
};

export default EditableEventCard;