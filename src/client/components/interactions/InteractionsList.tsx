import React, { useCallback, useState } from 'react';
import { InteractionType , interactionPresets } from '../../../shared/InteractionPresets';
import { SlideElement } from '../../../shared/slideTypes';
import { PlusIcon } from '../icons/PlusIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { XMarkIcon } from '../icons/XMarkIcon';
import InteractionEditor from './InteractionEditor';

interface InteractionsListProps {
  element: SlideElement;
  selectedInteractionId: string | null;
  onInteractionSelect: (id: string) => void;
  onInteractionAdd: (type: InteractionType) => void;
  onInteractionRemove: (id: string) => void;
  onInteractionUpdate?: (id: string, updates: any) => void;
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
  onInteractionUpdate,
  isCompact = false,
  className = ''
}) => {
  const [expandedSettingsId, setExpandedSettingsId] = useState<string | null>(null);

  const handleRemoveInteraction = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onInteractionRemove(id);
  }, [onInteractionRemove]);

  const handleSettingsInteraction = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedSettingsId(expandedSettingsId === id ? null : id);
  }, [expandedSettingsId]);

  // Quick interaction presets for inline addition
  const quickInteractionTypes: InteractionType[] = [
    InteractionType.TOOLTIP,
    InteractionType.SPOTLIGHT,
    InteractionType.PAN_ZOOM,
    InteractionType.TEXT,
    InteractionType.VIDEO,
    InteractionType.AUDIO,
    InteractionType.QUIZ
  ];

  return (
    <div data-testid="interactions-list" className={`space-y-3 ${className}`}>
      {/* Current Interactions List */}
      {element.interactions && element.interactions.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              Current Interactions ({element.interactions?.length || 0})
            </span>
          </div>
          
          {element.interactions?.map((interaction) => {
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
                onClick={(e) => {
                  e.stopPropagation();
                  onInteractionSelect(interaction.id);
                }}
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
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={(e) => handleSettingsInteraction(interaction.id, e)}
                      className={`p-1 transition-colors ${
                        expandedSettingsId === interaction.id 
                          ? 'text-blue-400' 
                          : 'text-slate-400 hover:text-blue-400'
                      }`}
                      aria-label="Edit interaction settings"
                      title="Edit settings"
                    >
                      <SettingsIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleRemoveInteraction(interaction.id, e)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      aria-label="Remove interaction"
                      title="Remove interaction"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Expandable settings section */}
                {expandedSettingsId === interaction.id && (
                  <div className="mt-3 pt-3 border-t border-slate-600/50">
                    <InteractionEditor
                      interaction={interaction}
                      onInteractionUpdate={(interactionId, updates) => {
                        onInteractionUpdate?.(interactionId, updates);
                      }}
                      isCompact={true}
                    />
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
                onClick={(e) => {
                  e.stopPropagation();
                  onInteractionAdd(type);
                }}
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