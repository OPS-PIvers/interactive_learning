// src/client/components/EventTypeSelectorButtonGrid.tsx
import React from 'react';
import { InteractionType } from '../../shared/types';
import { interactionPresets } from '../../shared/InteractionPresets';
import { PlusIcon } from './icons/PlusIcon';
import { triggerHapticFeedback } from '../utils/hapticUtils'; // Import haptic utility

interface EventTypeSelectorButtonGridProps {
  onSelectEventType: (type: InteractionType) => void;
  // Define a specific list of types to show on mobile, or filter from InteractionPresets
  // For now, let's use a predefined list relevant to mobile, similar to HotspotEditorModal
  // but we can make this more dynamic using InteractionPresets.
  eventTypesToShow?: InteractionType[];
}

const defaultMobileEventTypes: InteractionType[] = [
  InteractionType.SHOW_TEXT,
  InteractionType.SPOTLIGHT,
  InteractionType.PAN_ZOOM,
  InteractionType.SHOW_IMAGE_MODAL,
  InteractionType.PLAY_VIDEO, // Use the modern video player instead of legacy SHOW_VIDEO
  InteractionType.PLAY_AUDIO, // Use the modern audio player instead of legacy SHOW_AUDIO_MODAL
  InteractionType.QUIZ,
];

const EventTypeSelectorButtonGrid: React.FC<EventTypeSelectorButtonGridProps> = ({
  onSelectEventType,
  eventTypesToShow = defaultMobileEventTypes,
}) => {
  const typesToDisplay = eventTypesToShow
    .map(type => ({ type, preset: interactionPresets[type] }))
    .filter(item => !!item.preset); // Ensure preset exists for the type

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-2 bg-slate-700 rounded-lg">
      {typesToDisplay.map(({ type, preset }) => (
        <button
          key={type}
          onClick={() => onSelectEventType(type)}
          className="flex flex-col items-center justify-center p-3 bg-slate-600 hover:bg-purple-600 text-white rounded-lg transition-colors min-h-[80px] text-center"
          title={preset.description || preset.name}
        >
          {/* Using preset.icon if available, else PlusIcon or preset.name */}
          {preset.icon && preset.icon !== '❓' && preset.icon !== '👁️' && preset.icon !== '🚫' && preset.icon !== '💓' && preset.icon !== '✨' ? ( // Filter out less useful default emoji icons for this context
            <span className="text-2xl mb-1">{preset.icon}</span>
          ) : (
            <PlusIcon className="w-6 h-6 mb-1 text-purple-300" /> // Generic icon
          )}
          <span className="text-xs font-medium">{preset.name}</span>
        </button>
      ))}
      {typesToDisplay.length === 0 && (
        <p className="col-span-full text-center text-slate-400 py-4">No event types available.</p>
      )}
    </div>
  );
};

export default EventTypeSelectorButtonGrid;
