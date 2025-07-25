import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SlideElement, ElementInteraction } from '../../shared/slideTypes';
import { InteractionType } from '../../shared/types';
import { interactionPresets, InteractionPreset } from '../../shared/InteractionPresets';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { useIsMobile } from '../hooks/useIsMobile';

interface ElementInteractionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: SlideElement;
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
}

const ElementInteractionsModal: React.FC<ElementInteractionsModalProps> = ({
  isOpen,
  onClose,
  element,
  onElementUpdate
}) => {
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleAddInteraction = useCallback((interactionType: InteractionType) => {
    const newInteraction: ElementInteraction = {
      id: `interaction_${Date.now()}`,
      trigger: 'click',
      effect: {
        type: interactionType,
        parameters: {},
        duration: 500,
        delay: 0
      }
    };

    const updatedInteractions = [...element.interactions, newInteraction];
    onElementUpdate(element.id, { interactions: updatedInteractions });
    setSelectedInteractionId(newInteraction.id);
    setShowAddInteraction(false);
  }, [element.id, element.interactions, onElementUpdate]);

  const handleRemoveInteraction = useCallback((interactionId: string) => {
    const updatedInteractions = element.interactions.filter(i => i.id !== interactionId);
    onElementUpdate(element.id, { interactions: updatedInteractions });
    if (selectedInteractionId === interactionId) {
      setSelectedInteractionId(null);
    }
  }, [element.id, element.interactions, onElementUpdate, selectedInteractionId]);

  const handleInteractionUpdate = useCallback((interactionId: string, updates: Partial<ElementInteraction>) => {
    const updatedInteractions = element.interactions.map(interaction =>
      interaction.id === interactionId 
        ? { ...interaction, ...updates }
        : interaction
    );
    onElementUpdate(element.id, { interactions: updatedInteractions });
  }, [element.id, element.interactions, onElementUpdate]);

  if (!isOpen) return null;

  const selectedInteraction = element.interactions.find(i => i.id === selectedInteractionId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div
        ref={modalRef}
        className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden ${
          isMobile ? 'w-full h-full max-h-full' : 'max-w-4xl w-full max-h-[80vh]'
        }`}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Element Interactions</h2>
            <p className="text-slate-400 text-sm mt-1">
              Configure interactions for: {element.content.text || element.content.imageUrl || `${element.type} element`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full`}>
          {/* Interactions List */}
          <div className={`${isMobile ? 'border-b' : 'border-r'} border-slate-700 ${isMobile ? 'h-1/2' : 'w-1/3'} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Interactions ({element.interactions.length})</h3>
              <button
                onClick={() => setShowAddInteraction(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </button>
            </div>

            {element.interactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-sm">No interactions configured</p>
                <p className="text-xs mt-1">Click "Add" to create your first interaction</p>
              </div>
            ) : (
              <div className="space-y-2">
                {element.interactions.map((interaction) => {
                  const preset = interactionPresets[interaction.effect.type as InteractionType];
                  return (
                    <div
                      key={interaction.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedInteractionId === interaction.id
                          ? 'border-purple-400 bg-purple-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                      }`}
                      onClick={() => setSelectedInteractionId(interaction.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{preset?.icon || '⚡'}</span>
                          <div>
                            <div className="text-white text-sm font-medium">
                              {preset?.name || interaction.effect.type}
                            </div>
                            <div className="text-slate-400 text-xs">
                              Trigger: {interaction.trigger}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveInteraction(interaction.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          aria-label="Remove interaction"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interaction Details */}
          <div className={`flex-1 p-6 ${isMobile ? 'h-1/2 overflow-y-auto' : ''}`}>
            {selectedInteraction ? (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Interaction Settings</h3>
                
                {/* Trigger Settings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Trigger
                  </label>
                  <select
                    value={selectedInteraction.trigger}
                    onChange={(e) => handleInteractionUpdate(selectedInteraction.id, { 
                      trigger: e.target.value as any 
                    })}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="click">Click</option>
                    <option value="hover">Hover</option>
                    <option value="timeline">Timeline</option>
                  </select>
                </div>

                {/* Effect Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Effect Type
                  </label>
                  <select
                    value={selectedInteraction.effect.type}
                    onChange={(e) => handleInteractionUpdate(selectedInteraction.id, { 
                      effect: { 
                        ...selectedInteraction.effect, 
                        type: e.target.value as InteractionType 
                      } 
                    })}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(interactionPresets).map(([type, preset]) => (
                      <option key={type} value={type}>
                        {preset.icon} {preset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration (ms)
                  </label>
                  <input
                    type="number"
                    value={selectedInteraction.effect.duration || 500}
                    onChange={(e) => handleInteractionUpdate(selectedInteraction.id, { 
                      effect: { 
                        ...selectedInteraction.effect, 
                        duration: parseInt(e.target.value) || 500 
                      } 
                    })}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Delay */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={selectedInteraction.effect.delay || 0}
                    onChange={(e) => handleInteractionUpdate(selectedInteraction.id, { 
                      effect: { 
                        ...selectedInteraction.effect, 
                        delay: parseInt(e.target.value) || 0 
                      } 
                    })}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-3xl mb-2">👈</div>
                <p className="text-sm">Select an interaction to configure its settings</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Interaction Modal */}
        {showAddInteraction && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Add Interaction</h3>
                <button
                  onClick={() => setShowAddInteraction(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(interactionPresets).map(([type, preset]) => (
                  <button
                    key={type}
                    onClick={() => handleAddInteraction(type as InteractionType)}
                    className="p-4 text-left border border-slate-600 rounded-lg hover:border-purple-400 hover:bg-purple-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      <div className="font-medium text-white">{preset.name}</div>
                    </div>
                    <div className="text-sm text-slate-400">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElementInteractionsModal;