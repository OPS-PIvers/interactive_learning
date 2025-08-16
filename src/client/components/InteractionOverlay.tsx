import React from 'react';
import { ElementInteraction, ShowTextParameters } from '../../shared/slideTypes';

interface InteractionOverlayProps {
  interactions: ElementInteraction[];
  onClose: (interactionId: string) => void;
}

const InteractionOverlay: React.FC<InteractionOverlayProps> = ({ interactions, onClose }) => {
  if (interactions.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {interactions.map((interaction) => {
        if (interaction.effect.type !== 'text') {
          return null;
        }
        const params = interaction.effect.parameters as ShowTextParameters;
        return (
          <div key={interaction.id} className="bg-white p-4 rounded-lg shadow-lg">
            <p>{params.text}</p>
            <button onClick={() => onClose(interaction.id)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default InteractionOverlay;
