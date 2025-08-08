import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { hotspotSizePresets, HotspotSize, HotspotSizePreset, getHotspotPixelDimensions } from '../../shared/hotspotStylePresets';
import { InteractionType } from '../../shared/InteractionPresets';
import { SlideElement, DeviceType, ElementInteraction, ElementStyle, ElementContent, SlideEffectType, EffectParameters, InteractiveSlide } from '../../shared/slideTypes';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { AudioInteractionEditor } from './interactions/AudioInteractionEditor';
import InteractionEditor from './interactions/InteractionEditor';
import InteractionsList from './interactions/InteractionsList';
import { QuizInteractionEditor } from './interactions/QuizInteractionEditor';
import { TextInteractionEditor } from './interactions/TextInteractionEditor';
import { LiquidColorSelector } from './ui/LiquidColorSelector';

// Unified interfaces without device-specific distinctions
interface UnifiedPropertiesPanelProps {
  selectedElement: SlideElement;
  currentSlide?: InteractiveSlide;
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
      {collapsible ?
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-700/50 transition-colors"
        style={{ touchAction: 'manipulation' }}
        aria-expanded={isOpen}>

          <div className="flex items-center gap-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            <span className="font-medium text-white text-base" data-testid={title === 'Interactions' ? 'interactions-header' : undefined}>
              {title}
            </span>
          </div>
          <ChevronDownIcon
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-in-out ${
          isOpen ? 'rotate-180' : ''}`
          } />

        </button> :

      <div className="p-3 flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="font-medium text-white text-base" data-testid={title === 'Interactions' ? 'interactions-header' : undefined}>
            {title}
          </span>
        </div>
      }
      
      {/* Animated content container */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen || !collapsible ? `${contentHeight}px` : '0px',
          opacity: isOpen || !collapsible ? 1 : 0
        }}>

        <div
          ref={contentRef}
          className="px-3 pb-3 space-y-3">

          {children}
        </div>
      </div>
    </div>);

};

const UnifiedPropertiesPanel: React.FC<UnifiedPropertiesPanelProps> = ({
  selectedElement,
  currentSlide,
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
  const [isEditingParameters, setIsEditingParameters] = useState(false);

  // Get device type for responsive calculations
  const { deviceType } = useDeviceDetection();

  // Reset parameter editing when interaction selection changes
  useEffect(() => {
    setIsEditingParameters(false);
  }, [selectedInteractionId]);

  const elementStyle = useMemo(() => selectedElement.style || {}, [selectedElement.style]);
  const elementContent = useMemo(() => selectedElement.content || {}, [selectedElement.content]);
  const elementPosition = selectedElement.position?.[deviceType] || selectedElement.position?.desktop || {};

  const handleStyleChange = useCallback((updates: Partial<ElementStyle>) => {
    onElementUpdate(selectedElement.id, {
      style: { ...elementStyle, ...updates }
    });
  }, [selectedElement.id, elementStyle, onElementUpdate]);

  const handleContentChange = useCallback((updates: Partial<ElementContent>) => {
    onElementUpdate(selectedElement.id, {
      content: { ...elementContent, ...updates }
    });
  }, [selectedElement.id, elementContent, onElementUpdate]);

  // Type mapping from InteractionType to SlideEffectType with proper parameters
  const createInteractionEffect = useCallback((interactionType: InteractionType): {type: SlideEffectType;parameters: Partial<EffectParameters>;} => {
    const effectId = `effect-${Date.now()}`;

    switch (interactionType) {
      case InteractionType.MODAL:
        return {
          type: 'modal',
          parameters: {
            title: 'Modal Title',
            message: 'Modal content'
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
            targetPosition: { x: 50, y: 50, width: 200, height: 200 },
            zoomLevel: 2.0,
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
        parameters: effectData.parameters as any
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
    const updatedInteractions = selectedElement.interactions?.filter((interaction) => interaction.id !== id) || [];
    onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
    // Clear selection if the removed interaction was selected
    if (selectedInteractionId === id) {
      setSelectedInteractionId(null);
    }
  }, [selectedElement.id, selectedElement.interactions, onElementUpdate, selectedInteractionId]);

  // Handler for updating interaction parameters via InteractionEditor
  const handleInteractionParameterUpdate = useCallback((interactionId: string, updates: Partial<ElementInteraction>) => {
    const updatedInteractions = [...(selectedElement.interactions || [])];
    const interactionIndex = updatedInteractions.findIndex((i) => i.id === interactionId);
    if (interactionIndex >= 0) {
      const currentInteraction = updatedInteractions[interactionIndex];
      if (currentInteraction) {
        updatedInteractions[interactionIndex] = {
          id: currentInteraction.id,
          trigger: updates.trigger ?? currentInteraction.trigger,
          effect: updates.effect ?? currentInteraction.effect,
          conditions: updates.conditions ?? currentInteraction.conditions ?? []
        };
        onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
      }
    }
  }, [selectedElement.id, selectedElement.interactions, onElementUpdate]);

  const handleSizePresetSelect = useCallback((preset: HotspotSizePreset) => {
    const dimensions = getHotspotPixelDimensions(preset.value, false);
    onElementUpdate(selectedElement.id, {
      style: {
        ...selectedElement.style,
        size: preset.value
      }
    });
  }, [onElementUpdate, selectedElement]);

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
      }}>

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
          {onClose &&
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close properties">

              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Hotspot Styles Section */}
          {selectedElement.type === 'hotspot' &&
          <CollapsibleSection
            title="Hotspot Style"
            isOpen={stylesOpen}
            onToggle={() => setStylesOpen(!stylesOpen)}>

              <div className="space-y-3">
                {/* Size Presets */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Size Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {hotspotSizePresets.map((preset) =>
                  <button
                    key={preset.name}
                    onClick={(e) => {

                      e.stopPropagation();
                      handleSizePresetSelect(preset);
                    }}
                    className={`
                          p-3 lg:p-2 text-sm lg:text-xs rounded border transition-all
                          ${(() => {
                      const dimensions = getHotspotPixelDimensions(preset.value, deviceType === 'mobile');
                      return elementPosition?.width === dimensions.width && elementPosition?.height === dimensions.height;
                    })() ?
                    'border-blue-500 bg-blue-500/20 text-blue-300' :
                    'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'}
                        `
                    }>

                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs opacity-75">
                          {(() => {
                        const dimensions = getHotspotPixelDimensions(preset.value, deviceType === 'mobile');
                        return `${dimensions.width}×${dimensions.height}`;
                      })()}
                        </div>
                      </button>
                  )}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color
                  </label>
                  <LiquidColorSelector
                  selectedColor={elementStyle.backgroundColor || '#3b82f6'}
                  onColorChange={(color) => handleStyleChange({ backgroundColor: color })}
                  size="medium" />

                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Opacity: {Math.round((elementStyle.opacity || 1) * 100)}%
                  </label>
                  <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={elementStyle.opacity || 1}
                  onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500" />

                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm lg:text-xs font-medium text-slate-300 mb-2 lg:mb-1">
                    Border Radius: {elementStyle.borderRadius || 8}px
                  </label>
                  <input
                  type="range"
                  min="0"
                  max="50"
                  value={elementStyle.borderRadius || 8}
                  onChange={(e) => handleStyleChange({ borderRadius: parseInt(e.target.value) })}
                  className="w-full accent-blue-500" />

                </div>
              </div>
            </CollapsibleSection>
          }

          {/* Element Content Section - Only for non-hotspot elements */}
          {selectedElement.type !== 'hotspot' &&
          <CollapsibleSection
            title="Content"
            isOpen={contentOpen}
            onToggle={() => setContentOpen(!contentOpen)}>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                  type="text"
                  value={elementContent.title || ''}
                  onChange={(e) => handleContentChange({ title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  placeholder="Element title" />

                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                  value={elementContent.description || ''}
                  onChange={(e) => handleContentChange({ description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm resize-none"
                  placeholder="Element description"
                  rows={3} />

                </div>
              </div>
            </CollapsibleSection>
          }

          {/* Interactions Section */}
          <CollapsibleSection
            title="Interactions"
            isOpen={interactionsOpen}
            onToggle={() => setInteractionsOpen(!interactionsOpen)}>

            {editingInteraction ?
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-white">Edit Interaction</h3>
                  <button
                  onClick={() => setEditingInteraction(null)}
                  className="text-slate-400 hover:text-white">

                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {editingInteraction.effect.type === 'show_text' &&
              <TextInteractionEditor
                interaction={editingInteraction}
                onUpdate={(updated) => {
                  const index = selectedElement.interactions?.findIndex((i) => i.id === editingInteraction.id) ?? -1;
                  if (index >= 0) handleInteractionUpdate(index, { ...editingInteraction, ...updated });
                }}
                onDone={() => setEditingInteraction(null)} />

              }
                {editingInteraction.effect.type === 'play_audio' &&
              <AudioInteractionEditor
                interaction={editingInteraction}
                onUpdate={(updated) => {
                  const index = selectedElement.interactions?.findIndex((i) => i.id === editingInteraction.id) ?? -1;
                  if (index >= 0) handleInteractionUpdate(index, { ...editingInteraction, ...updated });
                }}
                onDone={() => setEditingInteraction(null)} />

              }
                {editingInteraction.effect.type === 'quiz' &&
              <QuizInteractionEditor
                interaction={editingInteraction}
                onUpdate={(updated) => {
                  const index = selectedElement.interactions?.findIndex((i) => i.id === editingInteraction.id) ?? -1;
                  if (index >= 0) handleInteractionUpdate(index, { ...editingInteraction, ...updated });
                }}
                onDone={() => setEditingInteraction(null)} />

              }
                {/* General InteractionEditor for other interaction types */}
                {!['show_text', 'play_audio', 'quiz'].includes(editingInteraction.effect.type) &&
              <InteractionEditor
                interaction={editingInteraction}
                onInteractionUpdate={handleInteractionParameterUpdate}
                isCompact={true} />

              }
              </div> :

            <div className="space-y-3">
                <InteractionsList
                element={selectedElement}
                selectedInteractionId={selectedInteractionId}
                onInteractionSelect={setSelectedInteractionId}
                onInteractionAdd={handleInteractionAdd}
                onInteractionRemove={handleInteractionRemove}
                isCompact={true} />

                
                {/* Show parameter editing interface when an interaction is selected and user wants to edit parameters */}
                {selectedInteractionId && isEditingParameters && (() => {
                const selectedInteraction = selectedElement.interactions?.find((i) => i.id === selectedInteractionId);
                if (!selectedInteraction) return null;

                return (
                  <div className="border-t border-slate-600 pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-medium text-white">Edit Parameters</h3>
                        <button
                        onClick={() => setIsEditingParameters(false)}
                        className="text-slate-400 hover:text-white">

                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <InteractionEditor
                      interaction={selectedInteraction}
                      onInteractionUpdate={handleInteractionParameterUpdate}
                      isCompact={true} />

                    </div>);

              })()}
                
                {/* Show edit button when an interaction is selected but not yet editing parameters */}
                {selectedInteractionId && !isEditingParameters &&
              <div className="border-t border-slate-600 pt-3">
                    <button
                  onClick={() => setIsEditingParameters(true)}
                  className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2">

                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Parameters
                    </button>
                  </div>
              }
              </div>
            }
          </CollapsibleSection>


          {/* Delete Button */}
          {onDelete &&
          <div className="p-3 border-t border-slate-700">
              <button
              onClick={onDelete}
              className="
                  w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                  transition-colors font-medium text-sm
                ">




                Delete Element
              </button>
            </div>
          }
        </div>
      </div>
    </div>);

};

export default UnifiedPropertiesPanel;