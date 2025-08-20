import React, { useState, useCallback } from 'react';
import { SlideElement, ElementInteraction, SlideEffect, SlideEffectType } from '../../../shared/slideTypes';
import { generateId } from '../../utils/generateId';
import { EffectExecutor } from '../../utils/EffectExecutor';
import { Z_INDEX } from '../../utils/zIndexLevels';

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

  // Add new interaction
  const handleAddInteraction = useCallback(() => {
    const newInteraction: ElementInteraction = {
      id: generateId(),
      trigger: 'click',
      effect: {
        id: generateId(),
        type: 'spotlight',
        duration: 3000,
        parameters: {
          position: { x: 100, y: 100, width: 200, height: 200 },
          shape: 'circle',
          intensity: 70,
          fadeEdges: true
        }
      }
    };

    setEditedHotspot(prev => ({
      ...prev,
      interactions: [...(prev.interactions || []), newInteraction]
    }));
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
  const handleAppearanceChange = useCallback((field: string, value: any) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.MODAL_CONTENT }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Hotspot</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('interactions')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'interactions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚡ Interactions
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'appearance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎨 Appearance
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'interactions' && (
            <div className="space-y-6">
              {/* Add interaction button */}
              <button
                onClick={handleAddInteraction}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
              >
                + Add Interaction
              </button>

              {/* Interactions list */}
              {editedHotspot.interactions?.map((interaction, index) => (
                <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Interaction {index + 1}</h4>
                    <button
                      onClick={() => handleDeleteInteraction(interaction.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Trigger selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Trigger</label>
                    <select
                      value={interaction.trigger}
                      onChange={(e) => handleUpdateInteraction(interaction.id, { 
                        trigger: e.target.value as any 
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="click">Click</option>
                      <option value="hover">Hover</option>
                      <option value="double-click">Double Click</option>
                    </select>
                  </div>

                  {/* Effect type selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Effect Type</label>
                    <select
                      value={interaction.effect.type}
                      onChange={(e) => {
                        const newType = e.target.value as SlideEffectType;
                        const newEffect = createEffectForType(newType);
                        handleUpdateInteraction(interaction.id, { 
                          effect: { ...interaction.effect, ...newEffect }
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="spotlight">🎯 Spotlight</option>
                      <option value="text">📝 Show Text</option>
                      <option value="video">🎬 Play Video</option>
                      <option value="audio">🔊 Play Audio</option>
                      <option value="quiz">❓ Quiz</option>
                      <option value="tooltip">💬 Tooltip</option>
                      <option value="pan_zoom">🔍 Pan & Zoom</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Duration (ms)</label>
                    <input
                      type="number"
                      value={interaction.effect.duration}
                      onChange={(e) => handleUpdateInteraction(interaction.id, {
                        effect: { ...interaction.effect, duration: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="0"
                      step="100"
                    />
                  </div>

                  {/* Preview button */}
                  <button
                    onClick={() => handlePreviewEffect(interaction.effect)}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    🔍 Preview Effect
                  </button>
                </div>
              ))}

              {editedHotspot.interactions?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⚡</div>
                  <div className="text-sm">No interactions yet</div>
                  <div className="text-xs">Click "Add Interaction" to get started</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Title and description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={editedHotspot.content?.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Hotspot title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editedHotspot.content?.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg h-20"
                    placeholder="Hotspot description"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={editedHotspot.style?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleAppearanceChange('backgroundColor', e.target.value)}
                    className="w-12 h-12 rounded border"
                  />
                  <input
                    type="text"
                    value={editedHotspot.style?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleAppearanceChange('backgroundColor', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              {/* Animation */}
              <div>
                <label className="block text-sm font-medium mb-2">Animation</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editedHotspot.style?.pulseAnimation || false}
                      onChange={(e) => handleAppearanceChange('pulseAnimation', e.target.checked)}
                    />
                    <span>Pulse animation</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium mb-2">Preview</label>
                <div className="flex items-center justify-center h-20 bg-gray-100 rounded-lg">
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
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedHotspot)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleHotspotEditor;