import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SlideElement, DeviceType, ElementInteraction, ElementStyle, ElementContent, SlideEffectType, EffectParameters, InteractiveSlide } from '../../shared/slideTypes';
import { InteractionType } from '../../shared/enums';
import InteractionsList from './interactions/InteractionsList';
import InteractionEditor from './interactions/InteractionEditor';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { hotspotSizePresets, HotspotSize, HotspotSizePreset, getHotspotPixelDimensions } from '../../shared/hotspotStylePresets';
import { LiquidColorSelector } from './ui/LiquidColorSelector';
import { TextInteractionEditor } from './interactions/TextInteractionEditor';
import { AudioInteractionEditor } from './interactions/AudioInteractionEditor';
import { QuizInteractionEditor } from './interactions/QuizInteractionEditor';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

// Unified interfaces without device-specific distinctions
interface UnifiedPropertiesPanelProps {
  selectedElement: SlideElement;
  currentSlide?: InteractiveSlide;
  deviceType: DeviceType;
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
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
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Measure content height when it changes
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [children, isOpen]);

  return (
    <div className="border-b border-slate-600 last:border-b-0">
      {collapsible ? (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-700/50 transition-colors"
          style={{ touchAction: 'manipulation' }}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            <span className="font-medium text-white text-base" data-testid={title === 'Interactions' ? 'interactions-header' : undefined}>
              {title}
            </span>
          </div>
          <ChevronDownIcon 
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-in-out ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>
      ) : (
        <div className="p-3 flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="font-medium text-white text-base" data-testid={title === 'Interactions' ? 'interactions-header' : undefined}>
            {title}
          </span>
        </div>
      )}
      
      {/* Animated content container */}
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: (isOpen || !collapsible) ? `${contentHeight}px` : '0px',
          opacity: (isOpen || !collapsible) ? 1 : 0
        }}
      >
        <div 
          ref={contentRef}
          className="px-3 pb-3 space-y-3"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

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

  const handleStyleChange = useCallback((updates: Partial<ElementStyle>) => {
    onElementUpdate(selectedElement.id, {
      style: { ...selectedElement.style, ...updates }
    });
  }, [selectedElement.id, selectedElement.style, onElementUpdate]);

  const handleContentChange = useCallback((updates: Partial<ElementContent>) => {
    onElementUpdate(selectedElement.id, {
      content: { ...selectedElement.content, ...updates }
    });
  }, [selectedElement.id, selectedElement.content, onElementUpdate]);

  // Type mapping from InteractionType to SlideEffectType with proper parameters
  const createInteractionEffect = useCallback((interactionType: InteractionType): { type: SlideEffectType; parameters: any } => {
    const effectId = `effect-${Date.now()}`;
    
    switch (interactionType) {
      case InteractionType.MODAL:
        return {
          type: 'show_text',
          parameters: {
            text: 'Modal content',
            position: { x: 100, y: 100, width: 300, height: 200 },
            style: {
              fontSize: 16,
              color: '#ffffff',
              backgroundColor: '#1f2937'
            },
            displayMode: 'modal',
            autoClose: false
          }
        };
      case InteractionType.TRANSITION:
        return {
          type: 'transition',
          parameters: {
            targetSlideId: 'next',
            direction: 'next',
            transitionType: 'slide'
          }
        };
      case InteractionType.SOUND:
        return {
          type: 'play_audio',
          parameters: {
            mediaUrl: '',
            mediaType: 'audio',
            autoplay: true,
            controls: false,
            volume: 0.8
          }
        };
      case InteractionType.TOOLTIP:
        return {
          type: 'show_text',
          parameters: {
            text: 'Tooltip text',
            position: { x: 0, y: 0, width: 200, height: 50 },
            style: {
              fontSize: 14,
              color: '#ffffff',
              backgroundColor: '#374151'
            },
            displayMode: 'tooltip',
            autoClose: true,
            autoCloseDuration: 3000
          }
        };
      case InteractionType.SPOTLIGHT:
        return {
          type: 'spotlight', 
          parameters: {
            position: { x: 100, y: 100, width: 200, height: 200 },
            shape: 'circle',
            intensity: 80,
            fadeEdges: true,
            message: 'Focus area'
          }
        };
      case InteractionType.PAN_ZOOM:
        return {
          type: 'pan_zoom',
          parameters: {
            targetX: 50,
            targetY: 50,
            zoomLevel: 2.0,
            smooth: true,
            duration: 1000
          }
        };
      default:
        // Fallback for any unmapped types
        return {
          type: 'show_text',
          parameters: {
            text: `${interactionType} interaction`,
            position: { x: 100, y: 100, width: 200, height: 100 },
            style: {
              fontSize: 16,
              color: '#ffffff',
              backgroundColor: '#1f2937'
            },
            displayMode: 'modal',
            autoClose: false
          }
        };
    }
  }, []);

  const handleInteractionAdd = useCallback((type: InteractionType) => {
    const effectData = createInteractionEffect(type);
    const newInteraction: ElementInteraction = {
      id: `interaction-${Date.now()}`,
      trigger: 'click',
      effect: {
        id: `effect-${Date.now()}`,
        type: effectData.type,
        duration: 300,
        parameters: effectData.parameters
      }
    };
    const updatedInteractions = [...(selectedElement.interactions || []), newInteraction];
    onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
  }, [selectedElement.id, selectedElement.interactions, onElementUpdate, createInteractionEffect]);

  const handleInteractionUpdate = useCallback((index: number, interaction: ElementInteraction) => {
    const updatedInteractions = [...(selectedElement.interactions || [])];
    updatedInteractions[index] = interaction;
    onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
    setEditingInteraction(null);
  }, [selectedElement.id, selectedElement.interactions, onElementUpdate]);

  const handleInteractionRemove = useCallback((id: string) => {
    const updatedInteractions = selectedElement.interactions?.filter(interaction => interaction.id !== id) || [];
    onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
    // Clear selection if the removed interaction was selected
    if (selectedInteractionId === id) {
      setSelectedInteractionId(null);
    }
  }, [selectedElement.id, selectedElement.interactions, onElementUpdate, selectedInteractionId]);

  const handleSizePresetSelect = useCallback((preset: HotspotSizePreset) => {
    const dimensions = getHotspotPixelDimensions(preset.value, deviceType === 'mobile');
    onElementUpdate(selectedElement.id, {
        position: {
            ...selectedElement.position,
            [deviceType]: {
                ...selectedElement.position[deviceType],
                width: dimensions.width,
                height: dimensions.height,
            }
        },
        style: {
            ...selectedElement.style,
            size: preset.value,
        }
    });
  }, [onElementUpdate, selectedElement, deviceType]);

  return (
    <div 
      className={`
        /* Modal overlay for all screen sizes */
        fixed inset-0 bg-black/50 backdrop-blur-sm ${Z_INDEX_TAILWIND.PROPERTIES_PANEL} flex items-center justify-center p-4
        ${className}
      `}
      style={style}
      onClick={(e) => {
        // Only close modal when clicking the actual backdrop (not any child elements)
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="
        /* Modal dialog for all screen sizes */
        bg-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden
        max-h-[90vh] flex flex-col
      ">
        {/* Header with close button */}
        <div className="
          flex items-center justify-between p-4 
          border-b border-slate-700 shrink-0
        ">
          <div>
            <h2 className="text-lg font-semibold text-white">Properties</h2>
            <div className="text-sm text-slate-400 capitalize">
              {selectedElement.type} Element
            </div>
          </div>
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close properties"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
              <div className="space-y-3">
                {/* Size Presets */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Size Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {hotspotSizePresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={(e) => {
                          console.log('📏 Size preset button clicked:', preset.name);
                          e.stopPropagation();
                          handleSizePresetSelect(preset);
                        }}
                        className={`
                          p-2 text-xs rounded border transition-all
                          ${selectedElement.style.size === preset.value
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                          }
                        `}
                      >
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs opacity-75">{getHotspotPixelDimensions(preset.value, deviceType === 'mobile').width}×{getHotspotPixelDimensions(preset.value, deviceType === 'mobile').height}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color
                  </label>
                  <LiquidColorSelector
                    selectedColor={selectedElement.style.backgroundColor || '#3b82f6'}
                    onColorChange={(color) => handleStyleChange({ backgroundColor: color })}
                    size="medium"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Opacity: {Math.round((selectedElement.style.opacity || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedElement.style.opacity || 1}
                    onChange={(e) => {
                      console.log('🔆 Opacity slider changed to:', e.target.value);
                      handleStyleChange({ opacity: parseFloat(e.target.value) });
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Border Radius: {selectedElement.style.borderRadius || 8}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedElement.style.borderRadius || 8}
                    onChange={(e) => {
                      console.log('🔄 Border radius slider changed to:', e.target.value);
                      handleStyleChange({ borderRadius: parseInt(e.target.value) });
                    }}
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
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedElement.content.title || ''}
                    onChange={(e) => handleContentChange({ title: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    placeholder="Element title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedElement.content.description || ''}
                    onChange={(e) => handleContentChange({ description: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm resize-none"
                    placeholder="Element description"
                    rows={3}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-white">Edit Interaction</h3>
                  <button
                    onClick={() => setEditingInteraction(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {editingInteraction.effect.type === 'show_text' && (
                  <TextInteractionEditor
                    interaction={editingInteraction}
                    onUpdate={(updated) => {
                      const index = selectedElement.interactions?.findIndex(i => i.id === editingInteraction.id) ?? -1;
                      if (index >= 0) handleInteractionUpdate(index, { ...editingInteraction, ...updated });
                    }}
                    onDone={() => setEditingInteraction(null)}
                  />
                )}
                {editingInteraction.effect.type === 'play_audio' && (
                  <AudioInteractionEditor
                    interaction={editingInteraction}
                    onUpdate={(updated) => {
                      const index = selectedElement.interactions?.findIndex(i => i.id === editingInteraction.id) ?? -1;
                      if (index >= 0) handleInteractionUpdate(index, { ...editingInteraction, ...updated });
                    }}
                    onDone={() => setEditingInteraction(null)}
                  />
                )}
                {editingInteraction.effect.type === 'quiz' && (
                  <QuizInteractionEditor
                    interaction={editingInteraction}
                    onUpdate={(updated) => {
                      const index = selectedElement.interactions?.findIndex(i => i.id === editingInteraction.id) ?? -1;
                      if (index >= 0) handleInteractionUpdate(index, { ...editingInteraction, ...updated });
                    }}
                    onDone={() => setEditingInteraction(null)}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <InteractionsList
                  element={selectedElement}
                  selectedInteractionId={selectedInteractionId}
                  onInteractionSelect={setSelectedInteractionId}
                  onInteractionAdd={handleInteractionAdd}
                  onInteractionRemove={handleInteractionRemove}
                  isCompact={true}
                />
              </div>
            )}
          </CollapsibleSection>


          {/* Delete Button */}
          {onDelete && (
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={onDelete}
                className="
                  w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                  transition-colors font-medium text-sm
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