import React from 'react';
import { TimelineEventData } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import PanZoomSettings from './PanZoomSettings';
import SpotlightSettings from './SpotlightSettings';
import { InteractionType } from '../../shared/InteractionPresets';

// We'll need to create these new editor components
// For now, let's create placeholders.
const TextInteractionEditor: React.FC<{ event: TimelineEventData, onUpdate: (updates: Partial<TimelineEventData>) => void }> = ({ event, onUpdate }) => (
    <div>
        <label>Text Content</label>
        <textarea
            value={event.textContent || ''}
            onChange={e => onUpdate({ textContent: e.target.value })}
            className="w-full bg-gray-700 p-2 rounded"
        />
    </div>
);

const AudioInteractionEditor: React.FC<{ event: TimelineEventData, onUpdate: (updates: Partial<TimelineEventData>) => void }> = ({ event, onUpdate }) => (
    <div>
        <label>Audio URL</label>
        <input
            type="text"
            value={event.audioUrl || ''}
            onChange={e => onUpdate({ audioUrl: e.target.value })}
            className="w-full bg-gray-700 p-2 rounded"
        />
    </div>
);

const VideoInteractionEditor: React.FC<{ event: TimelineEventData, onUpdate: (updates: Partial<TimelineEventData>) => void }> = ({ event, onUpdate }) => (
    <div>
        <label>Video URL</label>
        <input
            type="text"
            value={event.videoUrl || ''}
            onChange={e => onUpdate({ videoUrl: e.target.value })}
            className="w-full bg-gray-700 p-2 rounded"
        />
    </div>
);

const QuizInteractionEditor: React.FC<{ event: TimelineEventData, onUpdate: (updates: Partial<TimelineEventData>) => void }> = ({ event, onUpdate }) => (
    <div>
        <label>Question</label>
        <input
            type="text"
            value={event.quizQuestion || ''}
            onChange={e => onUpdate({ quizQuestion: e.target.value })}
            className="w-full bg-gray-700 p-2 rounded"
        />
    </div>
);


interface InteractionSettingsModalProps {
  isOpen: boolean;
  event: TimelineEventData | null;
  onUpdate: (event: TimelineEventData) => void;
  onClose: () => void;
}

const InteractionSettingsModal: React.FC<InteractionSettingsModalProps> = ({
  isOpen,
  event,
  onUpdate,
  onClose,
}) => {
  if (!isOpen || !event) {
    return null;
  }

  const handleUpdate = (updates: Partial<TimelineEventData>) => {
    onUpdate({ ...event, ...updates });
  };

  const renderEditorForEvent = () => {
    switch (event.type) {
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return (
          <PanZoomSettings
            zoomLevel={event.zoomLevel || 2}
            onZoomChange={(zoom) => handleUpdate({ zoomLevel: zoom })}
            showTextBanner={!!event.showTextBanner}
            onShowTextBannerChange={(value) => handleUpdate({ showTextBanner: value })}
          />
        );
      case InteractionType.SPOTLIGHT:
        return (
            <SpotlightSettings
                shape={event.spotlightShape || 'circle'}
                onShapeChange={(shape) => handleUpdate({ spotlightShape: shape })}
                dimPercentage={event.backgroundDimPercentage || 70}
                onDimPercentageChange={(dim) => handleUpdate({ backgroundDimPercentage: dim })}
            />
        );
      case InteractionType.SHOW_TEXT:
        return <TextInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.PLAY_AUDIO:
        return <AudioInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.PLAY_VIDEO:
        return <VideoInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.QUIZ:
        return <QuizInteractionEditor event={event} onUpdate={handleUpdate} />;
      default:
        return <div className="text-center py-4 text-gray-400">No specific editor available for this interaction type.</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[80] flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-lg font-semibold">Edit: {event.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {renderEditorForEvent()}
        </div>
      </div>
    </div>
  );
};

export default InteractionSettingsModal;
