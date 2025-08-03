import React, { useState, useCallback } from 'react';
import { SlideElement, DeviceType, ElementInteraction, ElementStyle, ElementContent, SlideEffectType, EffectParameters, InteractiveSlide, BackgroundMedia } from '../../shared/slideTypes';
import { InteractionType } from '../../shared/types';
import InteractionsList from './interactions/InteractionsList';
import InteractionEditor from './interactions/InteractionEditor';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { hotspotSizePresets, HotspotSize } from '../../shared/hotspotStylePresets';
import { LiquidColorSelector } from './ui/LiquidColorSelector';
import { TextInteractionEditor } from './interactions/TextInteractionEditor';
import { AudioInteractionEditor } from './interactions/AudioInteractionEditor';
import { QuizInteractionEditor } from './interactions/QuizInteractionEditor';
import BackgroundMediaPanel from './BackgroundMediaPanel';

// Unified interfaces without device-specific distinctions
interface UnifiedPropertiesPanelProps {
  selectedElement: SlideElement;
  currentSlide?: InteractiveSlide;
  deviceType: DeviceType;
  onElementUpdate: (updates: Partial<SlideElement>) => void;
  onSlideUpdate?: (updates: Partial<InteractiveSlide>) => void;
  onDelete?: () => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  collapsible?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
  icon,
  collapsible = true
}) => (
  <div className="border-b border-slate-600 lg:border-slate-700 last:border-b-0">
    {collapsible ? (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 lg:p-3 text-left hover:bg-slate-700/50 transition-colors"
        style={{ touchAction: 'manipulation' }}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="font-medium text-white text-lg lg:text-base" data-testid={title === 'Interactions' ? 'interactions-header' : undefined}>
            {title}
          </span>
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 lg:w-4 lg:h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
    ) : (
      <div className="p-4 lg:p-3 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="font-medium text-white text-lg lg:text-base" data-testid={title === 'Interactions' ? 'interactions-header' : undefined}>
          {title}
        </span>
      </div>
    )}
    {(isOpen || !collapsible) && (
      <div className="px-4 pb-4 lg:p-3 lg:pt-0 space-y-4 lg:space-y-3">
        {children}
      </div>
    )}
  </div>
);

const UnifiedPropertiesPanel: React.FC<UnifiedPropertiesPanelProps> = ({
  selectedElement,
  currentSlide,
  deviceType,
  onElementUpdate,
  onSlideUpdate,
  onDelete,
  onClose,
  className = '',
  style = {}
}) => {
  // Section state management
  const [stylesOpen, setStylesOpen] = useState(true);
  const [contentOpen, setContentOpen] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<ElementInteraction | null>(null);
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);
  const [backgroundOpen, setBackgroundOpen] = useState(false);

  const handleStyleChange = useCallback((updates: Partial<ElementStyle>) => {
    onElementUpdate({
      style: { ...selectedElement.style, ...updates }
    });
  }, [selectedElement.style, onElementUpdate]);

  const handleContentChange = useCallback((updates: Partial<ElementContent>) => {
    onElementUpdate({
      content: { ...selectedElement.content, ...updates }
    });
  }, [selectedElement.content, onElementUpdate]);

  const handleInteractionAdd = useCallback((type: InteractionType) => {
    const newInteraction: ElementInteraction = {
      id: `interaction-${Date.now()}`,
      trigger: 'click',
      effect: {
        type: type as SlideEffectType,
        duration: 300,
        parameters: {}
      }
    };
    const updatedInteractions = [...(selectedElement.interactions || []), newInteraction];
    onElementUpdate({ interactions: updatedInteractions });
  }, [selectedElement.interactions, onElementUpdate]);

  const handleInteractionUpdate = useCallback((index: number, interaction: ElementInteraction) => {
    const updatedInteractions = [...(selectedElement.interactions || [])];
    updatedInteractions[index] = interaction;
    onElementUpdate({ interactions: updatedInteractions });
    setEditingInteraction(null);
  }, [selectedElement.interactions, onElementUpdate]);

  const handleInteractionRemove = useCallback((id: string) => {
    const updatedInteractions = selectedElement.interactions?.filter(interaction => interaction.id !== id) || [];
    onElementUpdate({ interactions: updatedInteractions });
    // Clear selection if the removed interaction was selected
    if (selectedInteractionId === id) {
      setSelectedInteractionId(null);
    }
  }, [selectedElement.interactions, onElementUpdate, selectedInteractionId]);

  const handleSizePresetSelect = useCallback((preset: HotspotSize) => {
    handleStyleChange({
      width: preset.width,
      height: preset.height
    });
  }, [handleStyleChange]);

  return (
    <div 
      className={`
        /* Mobile: Full-screen modal overlay */
        fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-end
        /* Desktop: Right sidebar */
        lg:relative lg:inset-auto lg:bg-transparent lg:backdrop-blur-none lg:z-auto
        lg:flex lg:items-stretch lg:w-80 lg:h-full
        ${className}
      `}
      style={style}
      onClick={(e) => {
        // Close modal when clicking backdrop on mobile
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="
        /* Mobile: Slide-up panel */
        bg-slate-800 w-full rounded-t-xl shadow-2xl overflow-hidden
        max-h-[80vh] flex flex-col
        /* Desktop: Full height sidebar */
        lg:rounded-none lg:max-h-none lg:h-full lg:shadow-none
        lg:border-l lg:border-slate-700
      ">
        {/* Header - Mobile shows close button, Desktop shows minimal header */}
        <div className="
          flex items-center justify-between p-4 lg:p-3 
          border-b border-slate-700 shrink-0
        ">
          <div>
            <h2 className="text-xl lg:text-lg font-semibold text-white">Properties</h2>
            <div className="text-sm text-slate-400 mt-1 lg:mt-0 capitalize">
              {selectedElement.type} Element
            </div>
          </div>
          {/* Close button only visible on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-lg lg:hidden"
              aria-label="Close properties"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Hotspot Styles Section */}
          {selectedElement.type === 'hotspot' && (
            <CollapsibleSection
              title="Hotspot Style"
              isOpen={stylesOpen}
              onToggle={() => setStylesOpen(!stylesOpen)}
            >
              <div className="space-y-4 lg:space-y-3">
                {/* Size Presets */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Size Presets
                  </label>
                  <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                    {hotspotSizePresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleSizePresetSelect(preset)}
                        className={`
                          p-3 lg:p-2 text-sm lg:text-xs rounded border transition-all
                          ${selectedElement.style.width === preset.width && selectedElement.style.height === preset.height
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                          }
                        `}
                      >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs opacity-75">{preset.width}×{preset.height}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Color
                  </label>
                  <LiquidColorSelector
                    selectedColor={selectedElement.style.backgroundColor || '#3b82f6'}
                    onColorChange={(color) => handleStyleChange({ backgroundColor: color })}
                    size="large"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Opacity: {Math.round((selectedElement.style.opacity || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedElement.style.opacity || 1}
                    onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Border Radius: {selectedElement.style.borderRadius || 8}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedElement.style.borderRadius || 8}
                    onChange={(e) => handleStyleChange({ borderRadius: parseInt(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Element Content Section - Only for non-hotspot elements */}
          {selectedElement.type !== 'hotspot' && (
            <CollapsibleSection
              title="Content"
              isOpen={contentOpen}
              onToggle={() => setContentOpen(!contentOpen)}
            >
              <div className="space-y-4 lg:space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedElement.content.title || ''}
                    onChange={(e) => handleContentChange({ title: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 lg:px-2 lg:py-1 text-white text-base lg:text-xs"
                    placeholder="Element title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Description
                  </label>
                  <textarea
                    value={selectedElement.content.description || ''}
                    onChange={(e) => handleContentChange({ description: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 lg:px-2 lg:py-1 text-white text-base lg:text-xs resize-none"
                    placeholder="Element description"
                    rows={4}
                  />
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Interactions Section */}
          <CollapsibleSection
            title="Interactions"
            isOpen={interactionsOpen}
            onToggle={() => setInteractionsOpen(!interactionsOpen)}
          >
            {editingInteraction ? (
              <div className="space-y-4 lg:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg lg:text-base font-medium text-white">Edit Interaction</h3>
                  <button
                    onClick={() => setEditingInteraction(null)}
                    className="text-slate-400 hover:text-white text-lg lg:text-base"
                  >
                    ✕
                  </button>
                </div>
                {editingInteraction.type === InteractionType.SHOW_TEXT && (
                  <TextInteractionEditor
                    interaction={editingInteraction}
                    onUpdate={(updated) => {
                      const index = selectedElement.interactions?.findIndex(i => i.id === editingInteraction.id) ?? -1;
                      if (index >= 0) handleInteractionUpdate(index, updated);
                    }}
                    onCancel={() => setEditingInteraction(null)}
                  />
                )}
                {editingInteraction.type === InteractionType.PLAY_AUDIO && (
                  <AudioInteractionEditor
                    interaction={editingInteraction}
                    onUpdate={(updated) => {
                      const index = selectedElement.interactions?.findIndex(i => i.id === editingInteraction.id) ?? -1;
                      if (index >= 0) handleInteractionUpdate(index, updated);
                    }}
                    onCancel={() => setEditingInteraction(null)}
                  />
                )}
                {editingInteraction.type === InteractionType.QUIZ && (
                  <QuizInteractionEditor
                    interaction={editingInteraction}
                    onUpdate={(updated) => {
                      const index = selectedElement.interactions?.findIndex(i => i.id === editingInteraction.id) ?? -1;
                      if (index >= 0) handleInteractionUpdate(index, updated);
                    }}
                    onCancel={() => setEditingInteraction(null)}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-3">
                <InteractionsList
                  element={selectedElement}
                  selectedInteractionId={selectedInteractionId}
                  onInteractionSelect={setSelectedInteractionId}
                  onInteractionAdd={handleInteractionAdd}
                  onInteractionRemove={handleInteractionRemove}
                  isCompact={deviceType === 'mobile'}
                />
              </div>
            )}
          </CollapsibleSection>

          {/* Background Section - Only shown when editing slides */}
          {currentSlide && onSlideUpdate && (
            <CollapsibleSection
              title="Background"
              isOpen={backgroundOpen}
              onToggle={() => setBackgroundOpen(!backgroundOpen)}
            >
              <BackgroundMediaPanel
                backgroundMedia={currentSlide.backgroundMedia}
                onBackgroundChange={(media) => onSlideUpdate({ backgroundMedia: media })}
              />
            </CollapsibleSection>
          )}

          {/* Delete Button - Mobile gets larger touch target */}
          {onDelete && (
            <div className="p-4 lg:p-3 border-t border-slate-700">
              <button
                onClick={onDelete}
                className="
                  w-full p-3 lg:p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                  transition-colors font-medium text-base lg:text-sm
                "
              >
                Delete Element
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedPropertiesPanel;