import React, { useState } from 'react';
import { SlideElement, ElementInteraction, SlideEffect } from '../../../shared/slideTypes';

const FORM_STYLES = {
  input: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  textarea: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  select: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white",
  label: "block text-sm font-medium mb-1 text-gray-400",
} as const;

const BUTTON_STYLES = {
  base: "px-3 py-2 rounded transition-colors text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none",
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  secondary: "bg-gray-600 text-gray-200 hover:bg-gray-700 focus:ring-gray-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
} as const;

interface InteractionsSectionProps {
  element: SlideElement;
  onUpdate: (updates: Partial<SlideElement>) => void;
}

const InteractionsSection: React.FC<InteractionsSectionProps> = ({
  element,
  onUpdate
}) => {
  const [selectedInteractionIndex, setSelectedInteractionIndex] = useState(0);

  const addInteraction = () => {
    const newInteraction: ElementInteraction = {
      id: `interaction-${Date.now()}`,
      trigger: 'click',
      effect: {
        id: `effect-${Date.now()}`,
        type: 'spotlight',
        parameters: {
          position: { x: 100, y: 100, width: 200, height: 200 },
          shape: 'circle',
        }
      }
    };

    onUpdate({
      interactions: [...(element.interactions || []), newInteraction]
    });
  };

  const updateInteraction = (index: number, updates: Partial<ElementInteraction>) => {
    const updatedInteractions = [...(element.interactions || [])];
    const existingInteraction = updatedInteractions[index];
    if (existingInteraction) {
      updatedInteractions[index] = { ...existingInteraction, ...updates };
      onUpdate({ interactions: updatedInteractions });
    }
  };

  const updateEffect = (interactionIndex: number, effectUpdates: Partial<SlideEffect>) => {
    const updatedInteractions = [...(element.interactions || [])];
    const interaction = updatedInteractions[interactionIndex];
    if (interaction) {
      interaction.effect = { ...interaction.effect, ...effectUpdates };
      onUpdate({ interactions: updatedInteractions });
    }
  };

  const updateEffectParameters = (interactionIndex: number, parameterUpdates: Record<string, unknown>) => {
    const updatedInteractions = [...(element.interactions || [])];
    const interaction = updatedInteractions[interactionIndex];
    if (interaction) {
      interaction.effect.parameters = { 
        ...interaction.effect.parameters,
        ...parameterUpdates
      } as any;
      onUpdate({ interactions: updatedInteractions });
    }
  };

  const removeInteraction = (index: number) => {
    const updatedInteractions = [...(element.interactions || [])];
    updatedInteractions.splice(index, 1);
    onUpdate({ interactions: updatedInteractions });
    
    if (selectedInteractionIndex >= updatedInteractions.length) {
      setSelectedInteractionIndex(Math.max(0, updatedInteractions.length - 1));
    }
  };

  const renderEffectParameters = (interaction: ElementInteraction, index: number) => {
    const effect = interaction.effect;
    const params = effect.parameters as any;

    switch (effect.type) {
      case 'spotlight':
        return (
          <div className="space-y-4">
            <div>
              <label className={FORM_STYLES.label}>Shape</label>
              <select 
                value={params.shape || 'circle'}
                onChange={(e) => updateEffectParameters(index, { shape: e.target.value })}
                className={FORM_STYLES.select}
              >
                <option value="circle">Circle</option>
                <option value="rectangle">Rectangle</option>
              </select>
            </div>
            <div>
              <label className={FORM_STYLES.label}>Message (optional)</label>
              <textarea 
                value={params.message || ''}
                onChange={(e) => updateEffectParameters(index, { message: e.target.value })}
                className={`${FORM_STYLES.textarea} h-16`}
                placeholder="Optional message to show with spotlight..."
              />
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className={FORM_STYLES.label}>Text to Display</label>
              <textarea 
                value={params.text || ''}
                onChange={(e) => updateEffectParameters(index, { text: e.target.value })}
                className={`${FORM_STYLES.textarea} h-20`}
                placeholder="Enter text to display..."
              />
            </div>
          </div>
        );

      case 'tooltip':
        return (
            <div className="space-y-4">
                <div>
                    <label className={FORM_STYLES.label}>Tooltip Text</label>
                    <textarea
                        value={params.text || ''}
                        onChange={(e) => updateEffectParameters(index, { text: e.target.value })}
                        className={`${FORM_STYLES.textarea} h-20`}
                        placeholder="Enter tooltip text..."
                    />
                </div>
            </div>
        )

      default:
        return (
          <div className="text-gray-400 text-sm">
            No parameters available for this effect type.
          </div>
        );
    }
  };

  const interactions = element.interactions || [];
  const selectedInteraction = interactions[selectedInteractionIndex];

  return (
    <div className="properties-section">
      <div className="properties-section__header">
        <h4 className="text-md font-semibold text-gray-300 mb-4">Interactions</h4>
      </div>
      
      <div className="space-y-4">
        {/* Interaction List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={FORM_STYLES.label}>Interactions ({interactions.length})</label>
            <button
              onClick={addInteraction}
              className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.primary} text-xs`}
            >
              + Add
            </button>
          </div>
          
          {interactions.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center border-2 border-dashed border-gray-600 rounded">
              No interactions yet. Click "Add" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {interactions.map((interaction, index) => (
                <div
                  key={interaction.id}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedInteractionIndex === index
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedInteractionIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-200">
                        {interaction.trigger} → {interaction.effect.type}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeInteraction(index);
                      }}
                      className={`${BUTTON_STYLES.base} ${BUTTON_STYLES.danger} text-xs px-2 py-1`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Interaction Editor */}
        {selectedInteraction && (
          <div className="border-t border-gray-600 pt-4">
            <h5 className="text-sm font-semibold text-gray-300 mb-3">Edit Interaction</h5>
            
            <div className="space-y-4">
              {/* Trigger */}
              <div>
                <label className={FORM_STYLES.label}>Trigger</label>
                <select
                  value={selectedInteraction.trigger}
                  onChange={(e) => updateInteraction(selectedInteractionIndex, { trigger: e.target.value as any })}
                  className={FORM_STYLES.select}
                >
                  <option value="click">Click</option>
                  <option value="hover">Hover</option>
                  <option value="double-click">Double Click</option>
                  <option value="long-press">Long Press</option>
                </select>
              </div>

              {/* Effect Type */}
              <div>
                <label className={FORM_STYLES.label}>Effect Type</label>
                <select
                  value={selectedInteraction.effect.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'spotlight' | 'text' | 'tooltip';
                    let newParameters: any = {};
                    
                    // Set default parameters based on effect type
                    switch (newType) {
                      case 'spotlight':
                        newParameters = {
                          position: { x: 100, y: 100, width: 200, height: 200 },
                          shape: 'circle',
                        };
                        break;
                      case 'text':
                        newParameters = {
                          text: '',
                          position: { x: 0, y: 0, width: 200, height: 100 },
                        };
                        break;
                      case 'tooltip':
                        newParameters = {
                          text: '',
                          position: 'top',
                        };
                        break;
                    }
                    
                    updateEffect(selectedInteractionIndex, { 
                      type: newType,
                      parameters: newParameters
                    });
                  }}
                  className={FORM_STYLES.select}
                >
                  <option value="spotlight">Spotlight</option>
                  <option value="text">Show Text</option>
                  <option value="tooltip">Tooltip</option>
                </select>
              </div>

              {/* Effect Parameters */}
              <div>
                <label className={FORM_STYLES.label}>Effect Parameters</label>
                {renderEffectParameters(selectedInteraction, selectedInteractionIndex)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractionsSection;