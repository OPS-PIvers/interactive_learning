import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TimelineEventData } from '../../../shared/types';
import { TrashIcon } from '../icons/TrashIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { ExclamationCircleIcon } from '../icons/ExclamationCircleIcon';

const ItemTypes = {
  STEP: 'step',
};

interface MobileTimelineStepProps {
  index: number;
  step: number;
  isActive: boolean;
  events: TimelineEventData[];
  isEditing: boolean;
  isSelecting: boolean;
  isSelected: boolean;
  error?: string;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (newStep: number) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const MobileTimelineStep: React.FC<MobileTimelineStepProps> = ({
  index,
  step,
  isActive,
  events,
  isEditing,
  isSelecting,
  isSelected,
  error,
  onSelect,
  onDelete,
  onUpdate,
  onMove,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STEP,
    hover(item: { index: number }) {
      if (!ref.current || !isEditing) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.STEP,
    item: { index },
    canDrag: isEditing && !isSelecting,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const getBackgroundColor = () => {
    if (isSelected) return 'bg-blue-500';
    if (isActive) return 'bg-purple-600';
    return 'bg-slate-700';
  };

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`relative flex-shrink-0 w-24 h-24 rounded-lg p-2 text-center transition-all duration-200
        ${getBackgroundColor()}
        ${isEditing && !isSelecting ? 'cursor-grab' : 'cursor-pointer'}
        ${error ? 'border-2 border-red-500' : ''}
      `}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          onSelect();
        }
      }}
      tabIndex={isEditing ? -1 : 0}
      data-step={step}
      aria-label={`Step ${step}, ${events.length} events`}
      aria-current={isActive}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-lg font-bold text-white" aria-hidden="true">{step}</span>
        <span className="text-xs text-slate-300" aria-hidden="true">{events.length} events</span>
      </div>
      {error && (
        <div className="absolute bottom-1 left-1" title={error}>
          <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
        </div>
      )}
      {isEditing && !isSelecting && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white"
          aria-label={`Delete step ${step}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
      {isSelecting && (
        <div className="absolute top-1 right-1">
          {isSelected ? (
            <CheckCircleIcon className="w-6 h-6 text-white bg-blue-500 rounded-full" />
          ) : (
            <div className="w-6 h-6 border-2 border-white rounded-full bg-slate-600 bg-opacity-50"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileTimelineStep;
