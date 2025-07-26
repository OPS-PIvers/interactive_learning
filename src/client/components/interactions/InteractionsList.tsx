import React, { useCallback } from 'react';
import { SlideElement, ElementInteraction } from '../../../shared/slideTypes';
import { InteractionType } from '../../../shared/types';
import { interactionPresets } from '../../../shared/InteractionPresets';
import { PlusIcon } from '../icons/PlusIcon';
import { XMarkIcon } from '../icons/XMarkIcon';

interface InteractionsListProps {
  element: SlideElement;
  selectedInteractionId: string | null;
  onInteractionSelect: (id: string) => void;
  onInteractionAdd: (type: InteractionType) => void;
  onInteractionRemove: (id: string) => void;
  isCompact?: boolean;
  className?: string;
}

/**
 * InteractionsList - Embedded component for managing element interactions
 * 
 * Replaces the modal-based interaction list with an inline collapsible list
 * that integrates directly into the properties panel for context preservation
 */
const InteractionsList: React.FC<InteractionsListProps> = ({
  element,
  selectedInteractionId,
  onInteractionSelect,
  onInteractionAdd,
  onInteractionRemove,
  isCompact = false,
  className = ''
}) => {
  const handleRemoveInteraction = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onInteractionRemove(id);
  }, [onInteractionRemove]);

  // Quick interaction presets for inline addition
  const quickInteractionTypes: InteractionType[] = ['modal', 'transition', 'sound', 'tooltip'];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Interactions List */}
      {element.interactions.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              Current Interactions ({element.interactions.length})
            </span>
          </div>
          
          {element.interactions.map((interaction) => {
            const preset = interactionPresets[interaction.effect.type as InteractionType];
            const isSelected = selectedInteractionId === interaction.id;
            
            return (
              <div
                key={interaction.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-purple-400 bg-purple-500/10 shadow-sm'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/30 hover:bg-slate-700/50'
                }`}
                onClick={() => onInteractionSelect(interaction.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{preset?.icon || '⚡'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm font-medium truncate">
                        {preset?.name || interaction.effect.type}
                      </div>
                      <div className="text-slate-400 text-xs">
                        Trigger: {interaction.trigger}
                        {interaction.effect.duration && interaction.effect.duration > 0 && (
                          <span className="ml-2">• {interaction.effect.duration}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveInteraction(interaction.id, e)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                    aria-label="Remove interaction"
                    title="Remove interaction"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Show additional info when selected */}
                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-slate-600/50">
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Effect: <span className="text-purple-300">{interaction.effect.type}</span></div>
                      {interaction.effect.delay && interaction.effect.delay > 0 && (
                        <div>Delay: <span className="text-purple-300">{interaction.effect.delay}ms</span></div>
                      )}
                      {interaction.effect.parameters && Object.keys(interaction.effect.parameters).length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          <div className="font-medium text-slate-300 mb-1">Parameters:</div>
                          {Object.entries(interaction.effect.parameters).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="truncate">
                              {key}: <span className="text-slate-200">{String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}</span>
                            </div>
                          ))}
                          {Object.keys(interaction.effect.parameters).length > 3 && (
                            <div className="text-slate-500">...and {Object.keys(interaction.effect.parameters).length - 3} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <div className="text-2xl mb-2">⚡</div>
          <p className="text-sm">No interactions configured</p>
          <p className="text-xs mt-1 text-slate-500">Add interactions to make this element interactive</p>
        </div>
      )}

      {/* Quick Add Interactions */}
      <div className="border-t border-slate-600 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-300">Quick Add</span>
        </div>
        
        <div className={`grid gap-2 ${isCompact ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {quickInteractionTypes.map((type) => {
            const preset = interactionPresets[type];
            if (!preset) return null;
            
            return (
              <button
                key={type}
                onClick={() => onInteractionAdd(type)}
                className="flex items-center gap-2 p-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/50 rounded-lg transition-all duration-200 text-left group"
                title={preset.description}
              >
                <span className="text-lg flex-shrink-0">{preset.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-xs font-medium truncate group-hover:text-purple-100">
                    {preset.name}
                  </div>
                  <div className="text-slate-400 text-xs truncate">
                    {preset.description}
                  </div>
                </div>
                <PlusIcon className="w-3 h-3 text-slate-400 group-hover:text-purple-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>
        
      </div>
    </div>
  );
};

export default InteractionsList;