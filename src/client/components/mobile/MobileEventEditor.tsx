import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TimelineEventData } from '../../../shared/types';
import MobileEventCard from './MobileEventCard';

const SortableEventCard = ({ event, onUpdate, onDelete, onSelect }: { event: TimelineEventData, onUpdate: (event: TimelineEventData) => void, onDelete: () => void, onSelect: () => void }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: event.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <MobileEventCard
          event={event}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onSelect={onSelect}
        />
      </div>
    );
  };


interface MobileEventEditorProps {
  events: TimelineEventData[];
  onEventsChange: (events: TimelineEventData[]) => void;
  onSelectEvent: (event: TimelineEventData) => void;
  onAddEvent: () => void;
}

const MobileEventEditor: React.FC<MobileEventEditorProps> = ({
  events,
  onEventsChange,
  onSelectEvent,
  onAddEvent,
}) => {
  const [activeTab, setActiveTab] = useState('events');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = events.findIndex((e) => e.id === active.id);
      const newIndex = events.findIndex((e) => e.id === over?.id);
      onEventsChange(arrayMove(events, oldIndex, newIndex));
    }
  };

  const handleUpdateEvent = (updatedEvent: TimelineEventData) => {
    onEventsChange(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleDeleteEvent = (eventId: string) => {
    onEventsChange(events.filter(e => e.id !== eventId));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700">
        <div className="flex">
          {['events', 'preview'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'events' && (
          <div>
            <button
              onClick={onAddEvent}
              className="w-full mb-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Add New Event
            </button>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={events.map(e => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {events.map((event) => (
                    <SortableEventCard
                      key={event.id}
                      event={event}
                      onUpdate={handleUpdateEvent}
                      onDelete={() => handleDeleteEvent(event.id)}
                      onSelect={() => onSelectEvent(event)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
        {activeTab === 'preview' && (
          <div className="text-center text-gray-400 py-10">
            <p>Event Preview Area</p>
            <p className="text-sm">Previews will be shown here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileEventEditor;
