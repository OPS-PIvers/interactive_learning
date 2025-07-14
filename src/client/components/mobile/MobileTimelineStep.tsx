import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TimelineEventData, HotspotData } from '../../../shared/types';
import { TrashIcon } from '../icons/TrashIcon';

const ItemTypes = {
  STEP: 'step',
};

interface MobileTimelineStepProps {
  index: number;
  step: number;
  isActive: boolean;
  events: TimelineEventData[];
  isEditing: boolean;
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
  onSelect,
  onDelete,
  onUpdate,
  onMove,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemTypes.STEP,
    hover(item: { index: number }) {
      if (!ref.current) {
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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`relative flex-shrink-0 w-24 h-24 rounded-lg p-2 text-center transition-all duration-200
        ${isActive ? 'bg-purple-600' : 'bg-slate-700'}
        ${isEditing ? 'cursor-grab' : 'cursor-pointer'}
      `}
      onClick={!isEditing ? onSelect : undefined}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-lg font-bold text-white">{step}</span>
        <span className="text-xs text-slate-300">{events.length} events</span>
      </div>
      {isEditing && (
        <button
          onClick={onDelete}
          className="absolute top-0 right-0 p-1 bg-red-600 rounded-full text-white"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MobileTimelineStep;
