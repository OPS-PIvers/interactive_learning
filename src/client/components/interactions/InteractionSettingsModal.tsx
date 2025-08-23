import React, { useCallback } from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/type-defs';
import { Icon } from '../Icon';
import PanZoomSettings from '../editors/PanZoomSettings';
import SpotlightSettings from '../editors/SpotlightSettings';
import AudioInteractionEditor from './editors/AudioInteractionEditor';
import QuizInteractionEditor from './editors/QuizInteractionEditor';
import TextInteractionEditor from './editors/TextInteractionEditor';
import VideoInteractionEditor from './editors/VideoInteractionEditor';
import { useInteractionValidation } from './validation/InteractionValidationHook';

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
  const { validationErrors, hasValidated, validate, runValidation } = useInteractionValidation(event);

  const handleUpdate = useCallback((updates: Partial<TimelineEventData>) => {
    if (!event) return;
    const updatedEvent = { ...event, ...updates };
    runValidation(updatedEvent);
    onUpdate(updatedEvent);
  }, [event, onUpdate, runValidation]);

  const handleSave = useCallback(() => {
    if (validate()) {
      onClose();
    }
  }, [validate, onClose]);

  if (!isOpen || !event) {
    return null;
  }

  const renderEditorForEvent = () => {
    switch (event.type) {
      case InteractionType.PAN_ZOOM:
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
            showTextBanner={event.showTextBanner || false}
            onShowTextBannerChange={(value) => handleUpdate({ showTextBanner: value })}
          />
        );
      case InteractionType.TEXT:
        return <TextInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.AUDIO:
        return <AudioInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.VIDEO:
        return <VideoInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.QUIZ:
        return <QuizInteractionEditor event={event} onUpdate={handleUpdate} />;
      default:
        return <div className="text-center py-4 text-gray-400">No specific editor available for this interaction type.</div>;
    }
  };

  return (
    <div className="text-white w-full">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <h2 className="text-lg font-semibold">Edit: {event.name}</h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full">
          <Icon name="XMark" className="w-5 h-5" />
        </button>
      </div>

      {hasValidated && validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <h3 className="text-sm font-semibold text-red-300 mb-2">Please fix the following errors:</h3>
          <ul className="text-xs text-red-200 space-y-1">
            {validationErrors.map((error) => (
              <li key={error.field + error.message}>• {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4 mb-6 overflow-y-auto max-h-[60vh] pr-2">
        {renderEditorForEvent()}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={hasValidated && validationErrors.length > 0}
          className={`px-4 py-2 rounded-lg transition-colors ${
            hasValidated && validationErrors.length > 0
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {hasValidated && validationErrors.length > 0 ? 'Fix Errors First' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default InteractionSettingsModal;
