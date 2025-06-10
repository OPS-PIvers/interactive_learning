// src/client/components/EnhancedTimelineEventModal.tsx - NEW FILE
import React, { useState, useEffect } from 'react';
import { TimelineEventData, InteractionData, InteractionType, HotspotData } from '../../shared/types';
import { interactionPresets } from '../../shared/InteractionPresets';
import { DataMigration } from '../../shared/DataMigration';
import Modal from './Modal';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';

interface EnhancedTimelineEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: TimelineEventData) => void;
  event?: TimelineEventData | null;
  hotspots: HotspotData[];
  isTimedMode?: boolean;
}

const EnhancedTimelineEventModal: React.FC<EnhancedTimelineEventModalProps> = ({
  isOpen,
  onClose, 
  onSave,
  event,
  hotspots,
  isTimedMode = false
}) => {
  // Initialize with backward compatibility
  const [editingEvent, setEditingEvent] = useState<TimelineEventData>(() => {
    if (event) {
      // Convert legacy event to new format if needed
      return DataMigration.convertLegacyEvent(event);
    }
    
    return {
      id: `event_${Date.now()}`,
      name: 'New Event',
      step: 1,
      type: InteractionType.SHOW_TEXT,
      targetId: '',
      duration: 3000,
      interactions: [
        {
          id: `interaction_${Date.now()}`,
          type: InteractionType.SHOW_TEXT,
          content: ''
        }
      ]
    };
  });

  // Reset state when event prop changes
  useEffect(() => {
    if (event) {
      setEditingEvent(DataMigration.convertLegacyEvent(event));
    } else {
      setEditingEvent({
        id: `event_${Date.now()}`,
        name: 'New Event',
        step: 1,
        type: InteractionType.SHOW_TEXT,
        targetId: '',
        duration: 3000,
        interactions: [
          {
            id: `interaction_${Date.now()}`,
            type: InteractionType.SHOW_TEXT,
            content: ''
          }
        ]
      });
    }
  }, [event]);

  const addInteraction = () => {
    const newInteraction: InteractionData = {
      id: `interaction_${Date.now()}`,
      type: InteractionType.SHOW_TEXT,
      content: ''
    };
    
    setEditingEvent(prev => ({
      ...prev,
      interactions: [...(prev.interactions || []), newInteraction]
    }));
  };

  const removeInteraction = (interactionId: string) => {
    setEditingEvent(prev => ({
      ...prev,
      interactions: prev.interactions?.filter(i => i.id !== interactionId) || []
    }));
  };

  const updateInteraction = (interactionId: string, updates: Partial<InteractionData>) => {
    setEditingEvent(prev => ({
      ...prev,
      interactions: prev.interactions?.map(interaction => 
        interaction.id === interactionId 
          ? { ...interaction, ...updates }
          : interaction
      ) || []
    }));
  };

  const handleSave = () => {
    // Ensure backward compatibility by setting legacy properties
    const eventToSave = DataMigration.convertToLegacyEvent(editingEvent);
    onSave(eventToSave);
    onClose();
  };

  const renderInteractionSettings = (interaction: InteractionData) => {
    const preset = interactionPresets[interaction.type];
    
    return (
      <div key={interaction.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{preset.icon}</span>
            <span className="font-medium text-white">{preset.name}</span>
          </div>
          <button
            onClick={() => removeInteraction(interaction.id)}
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Interaction Type
          </label>
          <select
            value={interaction.type}
            onChange={(e) => updateInteraction(interaction.id, { type: e.target.value as InteractionType })}
            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
          >
            {Object.values(InteractionType).map(type => (
              <option key={type} value={type}>
                {interactionPresets[type]?.name || type}
              </option>
            ))}
          </select>
        </div>

        {/* Render type-specific settings */}
        {interaction.type === InteractionType.SHOW_TEXT && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Text Content
            </label>
            <textarea
              value={interaction.content || ''}
              onChange={(e) => updateInteraction(interaction.id, { content: e.target.value })}
              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white h-20"
              placeholder="Enter text to display..."
            />
          </div>
        )}

        {interaction.type === InteractionType.SHOW_IMAGE && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={interaction.imageUrl || ''}
                onChange={(e) => updateInteraction(interaction.id, { imageUrl: e.target.value })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Caption (optional)
              </label>
              <input
                type="text"
                value={interaction.caption || ''}
                onChange={(e) => updateInteraction(interaction.id, { caption: e.target.value })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                placeholder="Image caption..."
              />
            </div>
          </>
        )}

        {interaction.type === InteractionType.PAN_ZOOM && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Zoom Level
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={interaction.zoomLevel || 2}
                onChange={(e) => updateInteraction(interaction.id, { zoomLevel: parseFloat(e.target.value) })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={interaction.smooth !== false}
                  onChange={(e) => updateInteraction(interaction.id, { smooth: e.target.checked })}
                  className="accent-purple-500"
                />
                <span className="text-sm">Smooth transition</span>
              </label>
            </div>
          </div>
        )}

        {interaction.type === InteractionType.SPOTLIGHT && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Radius (px)
              </label>
              <input
                type="number"
                min="20"
                max="200"
                value={interaction.radius || 60}
                onChange={(e) => updateInteraction(interaction.id, { radius: parseInt(e.target.value) })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Intensity
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={interaction.intensity || 0.7}
                onChange={(e) => updateInteraction(interaction.id, { intensity: parseFloat(e.target.value) })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        )}

        {(interaction.type === InteractionType.PULSE_HIGHLIGHT || interaction.type === InteractionType.PULSE_HOTSPOT) && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={interaction.duration || 2}
              onChange={(e) => updateInteraction(interaction.id, { duration: parseFloat(e.target.value) })}
              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
            />
          </div>
        )}

        {interaction.type === InteractionType.QUIZ && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Question
              </label>
              <input
                type="text"
                value={interaction.question || ''}
                onChange={(e) => updateInteraction(interaction.id, { question: e.target.value })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                placeholder="Enter quiz question..."
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Options (one per line)
              </label>
              <textarea
                value={interaction.options?.join('\n') || ''}
                onChange={(e) => updateInteraction(interaction.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white h-20"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Correct Answer (option number)
              </label>
              <input
                type="number"
                min="1"
                value={interaction.correctAnswer || 1}
                onChange={(e) => updateInteraction(interaction.id, { correctAnswer: parseInt(e.target.value) })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
            </div>
          </>
        )}

        {interaction.type === InteractionType.PLAY_AUDIO && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Audio URL
              </label>
              <input
                type="url"
                value={interaction.audioUrl || ''}
                onChange={(e) => updateInteraction(interaction.id, { audioUrl: e.target.value })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                placeholder="https://example.com/audio.mp3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Volume
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={interaction.volume || 0.5}
                onChange={(e) => updateInteraction(interaction.id, { volume: parseFloat(e.target.value) })}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enhanced Event Editor"
    >
      <div className="space-y-6">
        {/* Basic Event Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={editingEvent.name}
              onChange={(e) => setEditingEvent(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              placeholder="Enter event name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Step Number
            </label>
            <input
              type="number"
              min="1"
              value={editingEvent.step}
              onChange={(e) => setEditingEvent(prev => ({ ...prev, step: parseInt(e.target.value) }))}
              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Target Hotspot Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Target Hotspot (optional)
          </label>
          <select
            value={editingEvent.targetId || ''}
            onChange={(e) => setEditingEvent(prev => ({ ...prev, targetId: e.target.value || undefined }))}
            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
          >
            <option value="">None</option>
            {hotspots.map(hotspot => (
              <option key={hotspot.id} value={hotspot.id}>
                {hotspot.title}
              </option>
            ))}
          </select>
        </div>

        {/* Timing Settings for Timed Mode */}
        {isTimedMode && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Auto-advance Duration (ms)
            </label>
            <input
              type="number"
              min="1000"
              step="500"
              value={editingEvent.duration || 3000}
              onChange={(e) => setEditingEvent(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
            />
          </div>
        )}

        {/* Interactions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Interactions</h3>
            <button
              onClick={addInteraction}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded flex items-center space-x-1"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Interaction</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {editingEvent.interactions?.map(interaction => 
              renderInteractionSettings(interaction)
            )}
            
            {(!editingEvent.interactions || editingEvent.interactions.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <p>No interactions added yet.</p>
                <p className="text-sm">Click "Add Interaction" to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            Save Event
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EnhancedTimelineEventModal;