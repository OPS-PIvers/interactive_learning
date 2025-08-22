import React from 'react';
import { TimelineEventData } from '../../../../../shared/type-defs';
import InteractionSettingsModal from '../../../interactions/InteractionSettingsModal';

interface PropertiesTabProps {
  isSettingsModalOpen: boolean;
  editingEventId: string | null;
  relatedEvents: TimelineEventData[];
  handleEventUpdate: (updatedEvent: TimelineEventData) => void;
  closeInteractionEditor: () => void;
}

const PropertiesTab: React.FC<PropertiesTabProps> = ({
  isSettingsModalOpen,
  editingEventId,
  relatedEvents,
  handleEventUpdate,
  closeInteractionEditor,
}) => {
  return (
    <div className="p-4">
      {editingEventId ? (
        <InteractionSettingsModal
          isOpen={isSettingsModalOpen}
          event={relatedEvents.find((e) => e.id === editingEventId) || null}
          onUpdate={handleEventUpdate}
          onClose={closeInteractionEditor}
        />
      ) : (
        <div className="text-center text-slate-400 py-8">
          Select an interaction from the Interactions tab to edit its properties.
        </div>
      )}
    </div>
  );
};

export default PropertiesTab;
