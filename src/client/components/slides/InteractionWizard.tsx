import React, { useState, useCallback } from 'react';
import { SlideEffect, SlideEffectType, ElementInteraction } from '../../../shared/slideTypes';
import { generateId } from '../../utils/generateId';

interface InteractionWizardProps {
  onCreateInteraction: (interaction: ElementInteraction) => void;
  onCancel: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

/**
 * InteractionWizard - Guided interaction creation to replace complex parameter editing
 * 
 * Features:
 * - Step-by-step interaction creation
 * - Template-based effect creation
 * - Visual previews and examples
 * - User-friendly controls instead of raw parameter editing
 */
export const InteractionWizard: React.FC<InteractionWizardProps> = ({
  onCreateInteraction,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedEffectType, setSelectedEffectType] = useState<SlideEffectType | null>(null);
  const [interactionData, setInteractionData] = useState({
    trigger: 'click' as const,
    effectType: null as SlideEffectType | null,
    effectConfig: {} as any
  });

  const steps: WizardStep[] = [
    {
      id: 'trigger',
      title: 'Choose Trigger',
      description: 'How should users activate this interaction?'
    },
    {
      id: 'effect',
      title: 'Select Effect',
      description: 'What should happen when triggered?'
    },
    {
      id: 'configure',
      title: 'Configure Effect',
      description: 'Customize the effect settings'
    },
    {
      id: 'preview',
      title: 'Preview & Create',
      description: 'Review and create your interaction'
    }
  ];

  const effectTypes = [
    {
      type: 'spotlight' as SlideEffectType,
      name: 'Spotlight',
      icon: '🎯',
      description: 'Highlight an area with a spotlight effect',
      example: 'Draw attention to specific content'
    },
    {
      type: 'text' as SlideEffectType,
      name: 'Show Text',
      icon: '📝',
      description: 'Display additional text or information',
      example: 'Show explanations or descriptions'
    },
    {
      type: 'video' as SlideEffectType,
      name: 'Play Video',
      icon: '🎬',
      description: 'Play a video in a modal',
      example: 'YouTube videos or uploaded content'
    },
    {
      type: 'quiz' as SlideEffectType,
      name: 'Quiz Question',
      icon: '❓',
      description: 'Present an interactive quiz',
      example: 'Multiple choice or true/false'
    },
    {
      type: 'tooltip' as SlideEffectType,
      name: 'Tooltip',
      icon: '💬',
      description: 'Show a quick tooltip message',
      example: 'Brief hints or definitions'
    }
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleEffectTypeSelect = useCallback((effectType: SlideEffectType) => {
    setSelectedEffectType(effectType);
    setInteractionData(prev => ({ ...prev, effectType }));
  }, []);

  const createInteraction = useCallback(() => {
    if (!selectedEffectType) return;

    let effect: SlideEffect;

    switch (selectedEffectType) {
      case 'spotlight':
        effect = {
          id: generateId(),
          type: 'spotlight',
          duration: interactionData.effectConfig.duration || 3000,
          parameters: {
            position: { x: 100, y: 100, width: 200, height: 200 },
            shape: interactionData.effectConfig.shape || 'circle',
            intensity: interactionData.effectConfig.intensity || 70,
            fadeEdges: true,
            message: interactionData.effectConfig.message || ''
          }
        };
        break;
        
      case 'text':
        effect = {
          id: generateId(),
          type: 'text',
          duration: interactionData.effectConfig.duration || 5000,
          parameters: {
            text: interactionData.effectConfig.text || 'Sample text',
            position: { x: 100, y: 100, width: 300, height: 100 },
            style: {
              fontSize: interactionData.effectConfig.fontSize || 16,
              color: interactionData.effectConfig.color || '#ffffff',
              backgroundColor: interactionData.effectConfig.backgroundColor || 'rgba(0,0,0,0.8)',
              padding: 16,
              borderRadius: 8
            }
          }
        };
        break;
        
      case 'video':
        effect = {
          id: generateId(),
          type: 'video',
          duration: 0,
          parameters: {
            videoSource: 'youtube',
            youtubeVideoId: interactionData.effectConfig.youtubeVideoId || 'dQw4w9WgXcQ',
            displayMode: 'modal',
            showControls: true,
            autoplay: interactionData.effectConfig.autoplay || false
          }
        };
        break;
        
      case 'quiz':
        effect = {
          id: generateId(),
          type: 'quiz',
          duration: 0,
          parameters: {
            question: interactionData.effectConfig.question || 'Sample question?',
            questionType: 'multiple-choice',
            choices: interactionData.effectConfig.choices || ['Option A', 'Option B'],
            correctAnswer: interactionData.effectConfig.correctAnswer || 'Option A',
            allowMultipleAttempts: true,
            resumeAfterCompletion: true
          }
        };
        break;
        
      case 'tooltip':
        effect = {
          id: generateId(),
          type: 'tooltip',
          duration: interactionData.effectConfig.duration || 3000,
          parameters: {
            text: interactionData.effectConfig.text || 'Tooltip message',
            position: 'auto',
            arrow: true
          }
        };
        break;
        
      default:
        return;
    }

    const interaction: ElementInteraction = {
      id: generateId(),
      trigger: interactionData.trigger,
      effect
    };

    onCreateInteraction(interaction);
  }, [selectedEffectType, interactionData, onCreateInteraction]);

  const updateEffectConfig = useCallback((key: string, value: any) => {
    setInteractionData(prev => ({
      ...prev,
      effectConfig: {
        ...prev.effectConfig,
        [key]: value
      }
    }));
  }, []);

  return (
    <div className="interaction-wizard bg-white rounded-lg border">
      {/* Progress Steps */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Interaction</h3>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        
        <div className="flex items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= currentStep ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  index < currentStep ? 'bg-blue-500' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-4">
        <div className="mb-6">
          <h4 className="text-xl font-semibold mb-2">{steps[currentStep]?.title}</h4>
          <p className="text-slate-600">{steps[currentStep]?.description}</p>
        </div>

        {/* Step 1: Choose Trigger */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'click', label: 'Click', icon: '👆', description: 'Single click or tap' },
                { value: 'hover', label: 'Hover', icon: '🖱️', description: 'Mouse hover (desktop only)' },
                { value: 'double-click', label: 'Double Click', icon: '👆👆', description: 'Double click or tap' }
              ].map((trigger) => (
                <button
                  key={trigger.value}
                  onClick={() => setInteractionData(prev => ({ ...prev, trigger: trigger.value as any }))}
                  className={`p-4 rounded-lg border-2 text-left transition-all min-h-[44px] ${
                    interactionData.trigger === trigger.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{trigger.icon}</div>
                  <div className="font-medium">{trigger.label}</div>
                  <div className="text-sm text-slate-600">{trigger.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Effect */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {effectTypes.map((effect) => (
                <button
                  key={effect.type}
                  onClick={() => handleEffectTypeSelect(effect.type)}
                  className={`p-4 rounded-lg border-2 text-left transition-all min-h-[44px] ${
                    selectedEffectType === effect.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{effect.icon}</div>
                    <div>
                      <div className="font-medium">{effect.name}</div>
                      <div className="text-sm text-slate-600 mb-1">{effect.description}</div>
                      <div className="text-xs text-blue-600">{effect.example}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Configure Effect */}
        {currentStep === 2 && selectedEffectType && (
          <div className="space-y-4">
            {selectedEffectType === 'spotlight' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Message (optional)</label>
                  <input
                    type="text"
                    value={interactionData.effectConfig.message || ''}
                    onChange={(e) => updateEffectConfig('message', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                    placeholder="Optional message to show with spotlight"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Shape</label>
                  <select
                    value={interactionData.effectConfig.shape || 'circle'}
                    onChange={(e) => updateEffectConfig('shape', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="circle">Circle</option>
                    <option value="rectangle">Rectangle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    value={(interactionData.effectConfig.duration || 3000) / 1000}
                    onChange={(e) => updateEffectConfig('duration', parseInt(e.target.value) * 1000)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                    min="1"
                    max="30"
                  />
                </div>
              </>
            )}

            {selectedEffectType === 'text' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Text Content</label>
                  <textarea
                    value={interactionData.effectConfig.text || ''}
                    onChange={(e) => updateEffectConfig('text', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg h-20 resize-none"
                    placeholder="Enter the text to display"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Text Size</label>
                  <select
                    value={interactionData.effectConfig.fontSize || 16}
                    onChange={(e) => updateEffectConfig('fontSize', parseInt(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="14">Small</option>
                    <option value="16">Medium</option>
                    <option value="20">Large</option>
                    <option value="24">Extra Large</option>
                  </select>
                </div>
              </>
            )}

            {selectedEffectType === 'video' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">YouTube Video ID</label>
                  <input
                    type="text"
                    value={interactionData.effectConfig.youtubeVideoId || ''}
                    onChange={(e) => updateEffectConfig('youtubeVideoId', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                    placeholder="e.g., dQw4w9WgXcQ"
                  />
                  <div className="text-xs text-slate-600 mt-1">
                    Copy the video ID from the YouTube URL (the part after "v=")
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={interactionData.effectConfig.autoplay || false}
                      onChange={(e) => updateEffectConfig('autoplay', e.target.checked)}
                      className="rounded"
                    />
                    <span>Auto-play video</span>
                  </label>
                </div>
              </>
            )}

            {selectedEffectType === 'quiz' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Question</label>
                  <input
                    type="text"
                    value={interactionData.effectConfig.question || ''}
                    onChange={(e) => updateEffectConfig('question', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                    placeholder="Enter your question"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Answer Choices</label>
                  <div className="space-y-2">
                    {(interactionData.effectConfig.choices || ['', '']).map((choice: string, index: number) => (
                      <input
                        key={index}
                        type="text"
                        value={choice}
                        onChange={(e) => {
                          const currentChoices = interactionData.effectConfig.choices || ['', ''];
                          const newChoices = [...currentChoices];
                          newChoices[index] = e.target.value;
                          updateEffectConfig('choices', newChoices);
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                        placeholder={`Choice ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Correct Answer</label>
                  <select
                    value={interactionData.effectConfig.correctAnswer || ''}
                    onChange={(e) => updateEffectConfig('correctAnswer', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="">Select correct answer</option>
                    {(interactionData.effectConfig.choices || []).map((choice: string, index: number) => (
                      <option key={index} value={choice}>{choice || `Choice ${index + 1}`}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {selectedEffectType === 'tooltip' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Tooltip Text</label>
                  <input
                    type="text"
                    value={interactionData.effectConfig.text || ''}
                    onChange={(e) => updateEffectConfig('text', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                    placeholder="Enter tooltip message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    value={(interactionData.effectConfig.duration || 3000) / 1000}
                    onChange={(e) => updateEffectConfig('duration', parseInt(e.target.value) * 1000)}
                    className="w-full p-2 border border-slate-300 rounded-lg min-h-[44px]"
                    min="1"
                    max="10"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Preview & Create */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h5 className="font-medium mb-2">Interaction Summary</h5>
              <div className="text-sm text-slate-600 space-y-1">
                <div><strong>Trigger:</strong> {interactionData.trigger}</div>
                <div><strong>Effect:</strong> {effectTypes.find(e => e.type === selectedEffectType)?.name}</div>
                {selectedEffectType === 'text' && interactionData.effectConfig.text && (
                  <div><strong>Text:</strong> "{interactionData.effectConfig.text}"</div>
                )}
                {selectedEffectType === 'video' && interactionData.effectConfig.youtubeVideoId && (
                  <div><strong>Video:</strong> {interactionData.effectConfig.youtubeVideoId}</div>
                )}
                {selectedEffectType === 'quiz' && interactionData.effectConfig.question && (
                  <div><strong>Question:</strong> "{interactionData.effectConfig.question}"</div>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={createInteraction}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium min-h-[44px] transition-colors"
              >
                Create Interaction
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-4 py-2 text-slate-600 disabled:text-slate-400 min-h-[44px] transition-colors"
        >
          Back
        </button>
        
        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !selectedEffectType) ||
              (currentStep === 2 && !interactionData.effectConfig)
            }
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium min-h-[44px] transition-colors"
          >
            Next
          </button>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default InteractionWizard;