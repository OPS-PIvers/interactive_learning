import React, { useState, useCallback } from 'react';
import { SlideElement, ElementInteraction, SlideEffect, SlideEffectType } from '../../../shared/slideTypes';
import { EffectExecutor } from '../../utils/EffectExecutor';
import { generateId } from '../../utils/generateId';
import InteractionWizard from './InteractionWizard';
import { ResponsiveModal } from '../responsive/ResponsiveModal';

interface SimpleHotspotEditorProps {
  hotspot: SlideElement;
  onSave: (updatedHotspot: SlideElement) => void;
  onClose: () => void;
  effectExecutor: EffectExecutor | undefined; // For previewing effects
}

/**
 * SimpleHotspotEditor - Edit hotspot interactions and appearance
 * 
 * Features:
 * - Add/edit interactions with our working effect types
 * - Hotspot appearance (color, size, animation)
 * - Real-time effect preview using EffectExecutor
 * - Simple, focused UI
 */
export const SimpleHotspotEditor: React.FC<SimpleHotspotEditorProps> = ({
  hotspot,
  onSave,
  onClose,
  effectExecutor
}) => {
  const [editedHotspot, setEditedHotspot] = useState<SlideElement>(hotspot);
  const [activeTab, setActiveTab] = useState<'interactions' | 'appearance'>('interactions');
  const [showWizard, setShowWizard] = useState(false);

  // Handle wizard interaction creation
  const handleWizardCreateInteraction = useCallback((interaction: ElementInteraction) => {
    setEditedHotspot(prev => ({
      ...prev,
      interactions: [...(prev.interactions || []), interaction]
    }));
    setShowWizard(false);
  }, []);

  // Update interaction
  const handleUpdateInteraction = useCallback((interactionId: string, updates: Partial<ElementInteraction>) => {
    setEditedHotspot(prev => ({
      ...prev,
      interactions: prev.interactions?.map(i => 
        i.id === interactionId ? { ...i, ...updates } : i
      ) || []
    }));
  }, []);

  // Delete interaction
  const handleDeleteInteraction = useCallback((interactionId: string) => {
    setEditedHotspot(prev => ({
      ...prev,
      interactions: prev.interactions?.filter(i => i.id !== interactionId) || []
    }));
  }, []);

  // Preview effect
  const handlePreviewEffect = useCallback(async (effect: SlideEffect) => {
    if (effectExecutor) {
      try {
        await effectExecutor.executeEffect(effect);
      } catch (error) {
        console.error('Preview failed:', error);
        alert('Effect preview failed. Check console for details.');
      }
    } else {
      alert('Effect preview not available - EffectExecutor not provided');
    }
  }, [effectExecutor]);

  // Update hotspot appearance
  const handleAppearanceChange = useCallback((field: string, value: string | boolean) => {
    setEditedHotspot(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [field]: value
      }
    }));
  }, []);

  // Update hotspot content
  const handleContentChange = useCallback((field: string, value: string) => {
    setEditedHotspot(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  }, []);

  // Create effect for type
  const createEffectForType = useCallback((type: SlideEffectType): SlideEffect => {
    const baseEffect = {
      id: generateId(),
      type,
      duration: 3000
    };

    switch (type) {
      case 'spotlight':
        return {
          ...baseEffect,
          parameters: {
            position: { x: 100, y: 100, width: 200, height: 200 },
            shape: 'circle',
            intensity: 70,
            fadeEdges: true,
            message: 'Spotlight effect'
          }
        };
      
      case 'text':
        return {
          ...baseEffect,
          parameters: {
            text: 'Sample text effect',
            position: { x: 100, y: 100, width: 300, height: 100 },
            style: {
              fontSize: 16,
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: 16,
              borderRadius: 8
            }
          }
        };
      
      case 'video':
        return {
          ...baseEffect,
          duration: 0,
          parameters: {
            videoSource: 'youtube',
            youtubeVideoId: 'dQw4w9WgXcQ',
            displayMode: 'modal',
            showControls: true,
            autoplay: true
          }
        };
      
      case 'quiz':
        return {
          ...baseEffect,
          duration: 0,
          parameters: {
            question: 'What color is the sky?',
            questionType: 'multiple-choice',
            choices: ['Blue', 'Green', 'Red'],
            correctAnswer: 'Blue',
            allowMultipleAttempts: true,
            resumeAfterCompletion: true
          }
        };
      
      case 'tooltip':
        return {
          ...baseEffect,
          duration: 3000,
          parameters: {
            text: 'This is a tooltip',
            position: 'auto',
            arrow: true
          }
        };
      
      default:
        return {
          ...baseEffect,
          parameters: {
            position: { x: 100, y: 100, width: 200, height: 200 },
            shape: 'circle',
            intensity: 70,
            fadeEdges: true,
            message: 'Default effect'
          }
        };
    }
  }, []);

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title="Edit Hotspot"
      type="properties"
      size="large"
      noPadding={true}
    >
      <div className="flex flex-col h-full">
        {/* Tabs - Mobile responsive with consistent styling */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('interactions')}
            className={`flex-1 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-colors min-h-[44px] ${
              activeTab === 'interactions'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
            role="tab"
            aria-selected={activeTab === 'interactions'}
            aria-controls="interactions-panel"
          >
            ⚡ Interactions
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium transition-colors min-h-[44px] ${
              activeTab === 'appearance'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
            role="tab"
            aria-selected={activeTab === 'appearance'}
            aria-controls="appearance-panel"
          >
            🎨 Appearance
          </button>
        </div>

        {/* Content - Fixed scrolling container */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900">
          {activeTab === 'interactions' && (
            <div className="space-y-6">
              {/* Wizard or interaction list */}
              {showWizard ? (
                <InteractionWizard
                  onCreateInteraction={handleWizardCreateInteraction}
                  onCancel={() => setShowWizard(false)}
                />
              ) : (
                <>
                  {/* Add interaction button */}
                  <button
                    onClick={() => setShowWizard(true)}
                    className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 min-h-[44px]"
                  >
                    ✨ Create Interaction
                  </button>

                  {/* Existing interactions list - simplified */}
                  {editedHotspot.interactions?.map((interaction, index) => (
                    <div key={interaction.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {interaction.trigger} → {interaction.effect.type}
                          </h4>
                          <div className="text-sm text-slate-500">
                            Duration: {interaction.effect.duration}ms
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreviewEffect(interaction.effect)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm min-h-[44px] transition-colors"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleDeleteInteraction(interaction.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label={`Delete interaction ${index + 1}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {editedHotspot.interactions?.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <div className="text-4xl mb-2">⚡</div>
                      <div className="text-sm">No interactions yet</div>
                      <div className="text-xs">Click "Create Interaction" to get started with the guided wizard</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Title and description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    type="text"
                    value={editedHotspot.content?.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                    placeholder="Hotspot title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={editedHotspot.content?.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                    placeholder="Hotspot description"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={editedHotspot.style?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleAppearanceChange('backgroundColor', e.target.value)}
                    className="w-12 h-12 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editedHotspot.style?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleAppearanceChange('backgroundColor', e.target.value)}
                    className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              {/* Animation */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Animation</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedHotspot.style?.pulseAnimation || false}
                      onChange={(e) => handleAppearanceChange('pulseAnimation', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 bg-white dark:bg-slate-700"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Pulse animation</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Preview</label>
                <div className="flex items-center justify-center h-20 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: editedHotspot.style?.backgroundColor || '#3b82f6',
                        borderColor: editedHotspot.style?.borderColor || '#1e40af'
                      }}
                    >
                      {editedHotspot.style?.pulseAnimation && (
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Consistent with project styling */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedHotspot)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors min-h-[44px] font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default SimpleHotspotEditor;