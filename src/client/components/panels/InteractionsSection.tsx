import React, { useState } from 'react';
import { SlideElement, ElementInteraction, SlideEffect, SlideEffectType } from '../../../shared/slideTypes';

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
        duration: 3000,
        parameters: {
          position: { x: 100, y: 100, width: 200, height: 200 },
          shape: 'circle',
          intensity: 70,
          fadeEdges: true
        } as any
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
                <option value="oval">Oval</option>
              </select>
            </div>
            <div>
              <label className={FORM_STYLES.label}>
                Intensity: {params.intensity || 70}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={params.intensity || 70}
                onChange={(e) => updateEffectParameters(index, { intensity: Number(e.target.value) })}
                className="w-full"
              />
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
            <div>
              <label className={FORM_STYLES.label}>Display Mode</label>
              <select 
                value={params.displayMode || 'modal'}
                onChange={(e) => updateEffectParameters(index, { displayMode: e.target.value })}
                className={FORM_STYLES.select}
              >
                <option value="modal">Modal</option>
                <option value="tooltip">Tooltip</option>
                <option value="overlay">Overlay</option>
                <option value="banner">Banner</option>
              </select>
            </div>
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label className={FORM_STYLES.label}>Video Source</label>
              <select 
                value={params.videoSource || 'url'}
                onChange={(e) => updateEffectParameters(index, { videoSource: e.target.value })}
                className={FORM_STYLES.select}
              >
                <option value="url">URL</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            {params.videoSource === 'youtube' ? (
              <div>
                <label className={FORM_STYLES.label}>YouTube Video ID</label>
                <input
                  type="text"
                  value={params.youtubeVideoId || ''}
                  onChange={(e) => updateEffectParameters(index, { youtubeVideoId: e.target.value })}
                  className={FORM_STYLES.input}
                  placeholder="e.g. dQw4w9WgXcQ"
                />
              </div>
            ) : (
              <div>
                <label className={FORM_STYLES.label}>Video URL</label>
                <input
                  type="url"
                  value={params.videoUrl || ''}
                  onChange={(e) => updateEffectParameters(index, { videoUrl: e.target.value })}
                  className={FORM_STYLES.input}
                  placeholder="https://example.com/video.mp4"
                />
              </div>
            )}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`autoplay-${index}`}
                  checked={params.autoplay || false}
                  onChange={(e) => updateEffectParameters(index, { autoplay: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor={`autoplay-${index}`} className={FORM_STYLES.label}>Autoplay</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`controls-${index}`}
                  checked={params.showControls !== false}
                  onChange={(e) => updateEffectParameters(index, { showControls: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor={`controls-${index}`} className={FORM_STYLES.label}>Show Controls</label>
              </div>
            </div>
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-4">
            <div>
              <label className={FORM_STYLES.label}>Question</label>
              <input
                type="text"
                value={params.question || ''}
                onChange={(e) => updateEffectParameters(index, { question: e.target.value })}
                className={FORM_STYLES.input}
                placeholder="Enter your question..."
              />
            </div>
            <div>
              <label className={FORM_STYLES.label}>Question Type</label>
              <select 
                value={params.questionType || 'multiple-choice'}
                onChange={(e) => updateEffectParameters(index, { questionType: e.target.value })}
                className={FORM_STYLES.select}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="fill-in-the-blank">Fill in the Blank</option>
              </select>
            </div>
            {params.questionType === 'multiple-choice' && (
              <div>
                <label className={FORM_STYLES.label}>Choices (one per line)</label>
                <textarea 
                  value={(params.choices as string[])?.join('\n') || ''}
                  onChange={(e) => updateEffectParameters(index, { 
                    choices: e.target.value.split('\n').filter(c => c.trim())
                  })}
                  className={`${FORM_STYLES.textarea} h-20`}
                  placeholder="Option A&#10;Option B&#10;Option C"
                />
              </div>
            )}
            <div>
              <label className={FORM_STYLES.label}>Correct Answer</label>
              <input
                type="text"
                value={params.correctAnswer || ''}
                onChange={(e) => updateEffectParameters(index, { correctAnswer: e.target.value })}
                className={FORM_STYLES.input}
                placeholder="Correct answer..."
              />
            </div>
          </div>
        );
        
      case 'pan_zoom':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={FORM_STYLES.label}>Target X</label>
                <input
                  type="number"
                  value={params.targetPosition?.x || 0}
                  onChange={(e) => updateEffectParameters(index, { 
                    targetPosition: { ...params.targetPosition, x: Number(e.target.value) }
                  })}
                  className={FORM_STYLES.input}
                />
              </div>
              <div>
                <label className={FORM_STYLES.label}>Target Y</label>
                <input
                  type="number"
                  value={params.targetPosition?.y || 0}
                  onChange={(e) => updateEffectParameters(index, { 
                    targetPosition: { ...params.targetPosition, y: Number(e.target.value) }
                  })}
                  className={FORM_STYLES.input}
                />
              </div>
            </div>
            <div>
              <label className={FORM_STYLES.label}>
                Zoom Level: {params.zoomLevel || 2}x
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={params.zoomLevel || 2}
                onChange={(e) => updateEffectParameters(index, { zoomLevel: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        );

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
                      <div className="text-xs text-gray-400">
                        Duration: {interaction.effect.duration}ms
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
                    const newType = e.target.value as SlideEffectType;
                    let newParameters: any = {};
                    
                    // Set default parameters based on effect type
                    switch (newType) {
                      case 'spotlight':
                        newParameters = {
                          position: { x: 100, y: 100, width: 200, height: 200 },
                          shape: 'circle',
                          intensity: 70,
                          fadeEdges: true
                        };
                        break;
                      case 'text':
                        newParameters = {
                          text: '',
                          position: { x: 0, y: 0, width: 200, height: 100 },
                          style: { fontSize: 16, color: '#000000' },
                          displayMode: 'modal'
                        };
                        break;
                      case 'video':
                        newParameters = {
                          videoSource: 'url',
                          displayMode: 'modal',
                          showControls: true,
                          autoplay: false
                        };
                        break;
                      case 'quiz':
                        newParameters = {
                          question: '',
                          questionType: 'multiple-choice',
                          choices: [],
                          correctAnswer: '',
                          allowMultipleAttempts: true,
                          resumeAfterCompletion: true
                        };
                        break;
                      case 'pan_zoom':
                        newParameters = {
                          targetPosition: { x: 0, y: 0, width: 100, height: 100 },
                          zoomLevel: 2,
                          centerOnTarget: true
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
                  <option value="video">Play Video</option>
                  <option value="quiz">Quiz</option>
                  <option value="pan_zoom">Pan & Zoom</option>
                  <option value="tooltip">Tooltip</option>
                </select>
              </div>

              {/* Effect Duration */}
              <div>
                <label className={FORM_STYLES.label}>
                  Duration: {selectedInteraction.effect.duration}ms
                </label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={selectedInteraction.effect.duration}
                  onChange={(e) => updateEffect(selectedInteractionIndex, { duration: Number(e.target.value) })}
                  className="w-full"
                />
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