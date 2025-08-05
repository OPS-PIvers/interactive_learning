import React from 'react';
import { TimelineEventData } from '../../../shared/types';
import { InteractionType, interactionPresets } from '../../../shared/InteractionPresets';

interface InteractionParameterPreviewProps {
  event: TimelineEventData;
}

const ParameterItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    <div className="text-xs text-gray-400">
      <span className="font-semibold text-gray-300">{label}: </span>
      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
    </div>
  );
};

const InteractionParameterPreview: React.FC<InteractionParameterPreviewProps> = ({ event }) => {
  const preset = interactionPresets[event.type as InteractionType];

  if (!preset) {
    return <div className="text-xs text-gray-500">Unknown interaction type.</div>;
  }

  const parametersToShow = preset.settings;

  const renderParameter = (key: string) => {
    const value = (event as any)[key];
    return <ParameterItem key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} value={value} />;
  };

  return (
    <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-600">
      {parametersToShow.map(renderParameter)}
    </div>
  );
};

export default InteractionParameterPreview;
