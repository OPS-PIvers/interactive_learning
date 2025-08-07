import React from 'react';
import { TimelineEventData } from '../../../shared/types';
import { InteractionType, interactionPresets } from '../../../shared/InteractionPresets';

interface InteractionParameterPreviewProps {
  event: TimelineEventData;
}

const ParameterItem: React.FC<{ label: string; value: any }> = ({ label, value }) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  let displayValue: string;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (value instanceof File) {
    displayValue = `File: ${value.name}`;
  } else if (value instanceof Blob) {
    displayValue = `Blob data (size: ${value.size} bytes)`;
  } else if (Array.isArray(value)) {
    displayValue = `[${value.length} items]`;
  } else if (typeof value === 'object') {
    try {
      displayValue = JSON.stringify(value);
      if (displayValue.length > 40) displayValue = `${displayValue.substring(0, 37)}...`;
    } catch {
      displayValue = '[Object]';
    }
  } else {
    displayValue = String(value);
  }

  return (
    <div className="text-xs text-gray-400">
      <span className="font-semibold text-gray-300">{label}: </span>
      {displayValue}
    </div>
  );
};

const InteractionParameterPreview: React.FC<InteractionParameterPreviewProps> = ({ event }) => {
  const preset = interactionPresets[event.type as InteractionType];

  if (!preset) {
    return <div className="text-xs text-gray-500">Unknown interaction type.</div>;
  }

  const parametersToShow = preset.settings;

  const renderParameter = (key: keyof TimelineEventData) => {
    const value = event[key];
    return <ParameterItem key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())} value={value} />;
  };

  return (
    <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-600">
      {parametersToShow.map(renderParameter)}
    </div>
  );
};

export default InteractionParameterPreview;
