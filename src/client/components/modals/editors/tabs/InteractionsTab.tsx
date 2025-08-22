import React from 'react';
import { TimelineEventData } from '../../../../../shared/type-defs';
import { HotspotData } from '../../../../../shared/types';
import { InteractionType } from '../../../../../shared/InteractionPresets';
import EditableEventCard from '../../../ui/EditableEventCard';
import { AddInteractionButton, InteractionTypeSelectorGrid } from '../../../selectors/InteractionTypeSelector';
import { getSortedEvents, canMoveUp, canMoveDown } from '../../../../utils/timelineUtils';

interface InteractionsTabProps {
  selectedInteractionId: string | null;
  setSelectedInteractionId: (id: string | null) => void;
  handleInteractionTypeSelected: (type: InteractionType) => void;
  localHotspotEvents: TimelineEventData[];
  handleEventUpdate: (updatedEvent: TimelineEventData) => void;
  handleEventDelete: (eventId: string) => void;
  handleTogglePreview: (eventId: string) => void;
  openInteractionEditor: (eventId: string) => void;
  previewingEventIds: string[];
  allHotspots: HotspotData[];
  handleMoveEventUp: (eventId: string) => void;
  handleMoveEventDown: (eventId: string) => void;
}

const InteractionsTab: React.FC<InteractionsTabProps> = ({
  selectedInteractionId,
  setSelectedInteractionId,
  handleInteractionTypeSelected,
  localHotspotEvents,
  handleEventUpdate,
  handleEventDelete,
  handleTogglePreview,
  openInteractionEditor,
  previewingEventIds,
  allHotspots,
  handleMoveEventUp,
  handleMoveEventDown,
}) => {
  return (
    <div className="p-4 flex flex-col h-full">
      {selectedInteractionId === 'new' ? (
        <InteractionTypeSelectorGrid
          onSelectType={handleInteractionTypeSelected}
          onClose={() => setSelectedInteractionId(null)}
        />
      ) : (
        <>
          <div className="mb-4">
            <AddInteractionButton onClick={() => setSelectedInteractionId('new')} />
          </div>
          <div className="flex-grow overflow-y-auto">
            {localHotspotEvents?.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No interactions for this hotspot.
                <br />
                Click &quot;Add Interaction&quot; to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {getSortedEvents(localHotspotEvents).map((event, index) => (
                  <EditableEventCard
                    key={event.id}
                    index={index}
                    event={event}
                    onUpdate={handleEventUpdate}
                    onDelete={handleEventDelete}
                    moveCard={() => {}}
                    onTogglePreview={() => handleTogglePreview(event.id)}
                    onEdit={() => openInteractionEditor(event.id)}
                    isPreviewing={previewingEventIds.includes(event.id)}
                    allHotspots={allHotspots}
                    onMoveUp={handleMoveEventUp}
                    onMoveDown={handleMoveEventDown}
                    canMoveUp={canMoveUp(event.id, localHotspotEvents)}
                    canMoveDown={canMoveDown(event.id, localHotspotEvents)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InteractionsTab;
