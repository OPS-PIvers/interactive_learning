import type { Identifier, XYCoord } from 'dnd-core';
import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TimelineEventData, InteractionType } from '../../../shared/type-defs';
import { HotspotData } from '../../../shared/types';
import DragHandle from './DragHandle'; // Assuming DragHandle.tsx exists
import { Icon } from '../Icon';
// import EventTypeSelector from '../selectors/EventTypeSelector';
import InteractionParameterPreview from '../interactions/InteractionParameterPreview';
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
  // New props for timeline control
  onMoveUp?: (eventId: string) => void;
  onMoveDown?: (eventId: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const EventTypeToggle: React.FC<{ type: InteractionType }> = ({ type }) => {
  const getTypeLabel = () => {
    // ... (same as existing getTypeLabel)
    switch (type) {
      case InteractionType.SPOTLIGHT:
        return 'spotlight';
      case InteractionType.PAN_ZOOM:
        return 'pan-zoom';
      case InteractionType.TEXT:
        return 'text';
      case InteractionType.VIDEO:
        return 'media';
      case InteractionType.QUIZ:
        return 'question';
      case InteractionType.AUDIO:
        return 'audio';
      default:
        return type.toLowerCase().replace(/_/g, ' ').replace('hotspot', '').trim();
    }
  };

  return (
    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-300 bg-purple-700">
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
  allHotspots: _allHotspots,
  isActive = false,
  onJumpToStep,
  className = '',
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false
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

  const cardBaseClasses = `p-3 mb-2 rounded-lg shadow-md transition-opacity`;
  const cardBgColor = isDragging ? 'bg-slate-800' : 'bg-slate-700/50';
  const cardActiveColor = isActive ? 'ring-2 ring-purple-600 ring-offset-2 ring-offset-slate-900' : '';

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
              className="text-slate-500"
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
                  className="ml-2 p-1 bg-slate-800 border border-slate-600 rounded-md text-white text-sm font-semibold flex-grow min-w-0"
                />
              ) : (
                <button
                  onClick={() => onJumpToStep && onJumpToStep(event.step)}
                  className="ml-2 text-sm font-semibold text-left text-slate-200 truncate hover:text-purple-400 transition-colors"
                  title={event.name}
                >
                  {event.name || `Event at step ${event.step}`}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 ml-0">
              Step: {event.step}{event.duration ? `, Duration: ${event.duration/1000}s` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-0.5 flex-shrink-0 ml-1">
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePreview(); }}
            className="p-1.5 text-slate-500 hover:text-purple-500 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Toggle Preview"
          >
            {isPreviewing ? ( <Icon name="EyeSlash" className="w-5 h-5" /> ) : ( <Icon name="Eye" className="w-5 h-5" /> )}
          </button>
          
          {/* Timeline ordering controls */}
          {onMoveUp && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(event.id); }}
              disabled={!canMoveUp}
              className={`p-1.5 rounded-md transition-colors ${
                canMoveUp 
                  ? 'text-slate-500 hover:text-purple-500 hover:bg-slate-800'
                  : 'text-slate-700 cursor-not-allowed'
              }`}
              aria-label="Move Up"
              title="Move event up in timeline"
            >
              <Icon name="ArrowUp" className="w-4 h-4" />
            </button>
          )}
          
          {onMoveDown && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(event.id); }}
              disabled={!canMoveDown}
              className={`p-1.5 rounded-md transition-colors ${
                canMoveDown 
                  ? 'text-slate-500 hover:text-purple-500 hover:bg-slate-800'
                  : 'text-slate-700 cursor-not-allowed'
              }`}
              aria-label="Move Down"
              title="Move event down in timeline"
            >
              <Icon name="ArrowDown" className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Edit Title"
          >
            <Icon name="Pencil" className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Edit Parameters"
          >
            <Icon name="Gear" className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Delete Event"
          >
            <Icon name="Trash" className="w-4 h-4" />
          </button>
        </div>
      </div>
      <InteractionParameterPreview event={event} />
    </div>
  );
};

export default EditableEventCard;