import React from 'react';
import { InteractionType } from '../../../../shared/InteractionPresets';
import { TimelineEventData } from '../../../../shared/type-defs';
import { HotspotData } from '../../../../shared/types';
import EditorTabContainer from './shared/EditorTabContainer';
import InteractionsTab from './tabs/InteractionsTab';
import PropertiesTab from './tabs/PropertiesTab';
import StyleTab from './tabs/StyleTab';

interface HotspotEditorContentProps {
  localHotspot: HotspotData;
  setLocalHotspot: React.Dispatch<React.SetStateAction<HotspotData | null>>;
  onUpdateHotspot: (hotspot: HotspotData) => void;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isSettingsModalOpen: boolean;
  editingEventId: string | null;
  relatedEvents: TimelineEventData[];
  handleEventUpdate: (updatedEvent: TimelineEventData) => void;
  closeInteractionEditor: () => void;
  selectedInteractionId: string | null;
  setSelectedInteractionId: (id: string | null) => void;
  handleInteractionTypeSelected: (type: InteractionType) => void;
  localHotspotEvents: TimelineEventData[];
  handleEventDelete: (eventId: string) => void;
  handleTogglePreview: (eventId: string) => void;
  openInteractionEditor: (eventId: string) => void;
  previewingEventIds: string[];
  allHotspots: HotspotData[];
  handleMoveEventUp: (eventId: string) => void;
  handleMoveEventDown: (eventId: string) => void;
}

const HotspotEditorContent: React.FC<HotspotEditorContentProps> = (props) => {
  return (
    <EditorTabContainer
      defaultActiveTab={props.activeTab}
      onTabChange={props.setActiveTab}
      tabs={[
        {
          id: 'hotspot',
          label: 'Hotspot',
          content: (
            <StyleTab
              localHotspot={props.localHotspot}
              setLocalHotspot={props.setLocalHotspot}
              onUpdateHotspot={props.onUpdateHotspot}
            />
          )
        },
        {
          id: 'interactions',
          label: 'Interactions',
          content: (
            <InteractionsTab
              selectedInteractionId={props.selectedInteractionId}
              setSelectedInteractionId={props.setSelectedInteractionId}
              handleInteractionTypeSelected={props.handleInteractionTypeSelected}
              localHotspotEvents={props.localHotspotEvents}
              handleEventUpdate={props.handleEventUpdate}
              handleEventDelete={props.handleEventDelete}
              handleTogglePreview={props.handleTogglePreview}
              openInteractionEditor={props.openInteractionEditor}
              previewingEventIds={props.previewingEventIds}
              allHotspots={props.allHotspots}
              handleMoveEventUp={props.handleMoveEventUp}
              handleMoveEventDown={props.handleMoveEventDown}
            />
          )
        },
        {
          id: 'properties',
          label: 'Properties',
          content: (
            <PropertiesTab
              isSettingsModalOpen={props.isSettingsModalOpen}
              editingEventId={props.editingEventId}
              relatedEvents={props.relatedEvents}
              handleEventUpdate={props.handleEventUpdate}
              closeInteractionEditor={props.closeInteractionEditor}
            />
          )
        }
      ]}
    />
  );
};

export default HotspotEditorContent;
