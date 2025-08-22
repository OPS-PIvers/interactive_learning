import React from 'react';
import { TimelineEventData } from '../../../../shared/type-defs';

interface InteractionPreviewProps {
  event: TimelineEventData;
}

const InteractionPreview: React.FC<InteractionPreviewProps> = ({ event }) => {
  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <h4 className="text-lg font-semibold mb-2 text-slate-300">Interaction Preview</h4>
      <div className="text-sm text-slate-400">
        <p><strong>Type:</strong> {event.type}</p>
        <p><strong>Name:</strong> {event.name}</p>
        {/* Add more preview details here based on event type */}
      </div>
    </div>
  );
};

export default InteractionPreview;
