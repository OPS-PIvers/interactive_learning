import React, { useState, useCallback } from 'react';
import { SlideElement, DeviceType, ElementInteraction, ElementStyle, ElementContent, SlideEffectType, EffectParameters } from '../../../shared/slideTypes';
import { InteractionType } from '../../../shared/types';
import InteractionsList from '../interactions/InteractionsList';
import InteractionEditor from '../interactions/InteractionEditor';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import { hotspotSizePresets, HotspotSize } from '../../../shared/hotspotStylePresets';
import { LiquidColorSelector } from '../ui/LiquidColorSelector';
import { Z_INDEX_TAILWIND, Z_INDEX_PATTERNS } from '../../utils/zIndexLevels';
import { useContentAreaHeight } from '../../hooks/useMobileToolbar';
import { MobilePropertiesPanelProps, CollapsibleSectionProps, getDefaultSections } from '../shared/BasePropertiesPanel';


const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children
}) => (
  <div className="border-b border-slate-600 last:border-b-0">
    <button
      onClick={onToggle}
      onTouchStart={(e) => {
        // Prevent event from bubbling to parent modal handlers
        // but don't prevent the default click behavior
        e.stopPropagation();
      }}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
      style={{ touchAction: 'manipulation' }}
      aria-expanded={isOpen}
    >
      <span className="font-medium text-white text-lg">{title}</span>
      <ChevronDownIcon 
        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} 
      />
    </button>
    {isOpen && (
      <div className="px-4 pb-4 space-y-4">
        {children}
      </div>
    )}
  </div>
);

// Helper function to map InteractionType to SlideEffectType and create default parameters
const mapInteractionToSlideEffect = (interactionType: InteractionType): { type: SlideEffectType; parameters: EffectParameters } => {
  switch (interactionType) {
    case InteractionType.SPOTLIGHT:
      return {
        type: 'spotlight',
        parameters: {
          position: { x: 0, y: 0, width: 100, height: 100 },
          shape: 'circle',
          intensity: 80,
          fadeEdges: true
        } as EffectParameters
      };
    case InteractionType.PAN_ZOOM:
      return {
        type: 'pan_zoom',
        parameters: {
          targetPosition: { x: 0, y: 0, width: 100, height: 100 },
          zoomLevel: 2.0,
          duration: 1000
        } as EffectParameters
      };
    case InteractionType.PLAY_VIDEO:
      return {
        type: 'play_video',
        parameters: {
          videoSource: 'url',
          displayMode: 'modal',
          showControls: true,
          autoplay: false
        } as EffectParameters
      };
    case InteractionType.PLAY_AUDIO:
      return {
        type: 'play_audio',
        parameters: {
          audioUrl: '',
          displayMode: 'modal',
          showControls: true,
          autoplay: false
        } as EffectParameters
      };
    case InteractionType.SHOW_TEXT:
      return {
        type: 'show_text',
        parameters: {
          text: '',
          position: { x: 0, y: 0, width: 200, height: 100 },
          style: {
            fontSize: 16,
            color: '#000000',
            textAlign: 'center'
          }
        } as EffectParameters
      };
    case InteractionType.QUIZ:
      return {
        type: 'quiz',
        parameters: {
          question: '',
          questionType: 'multiple-choice',
          correctAnswer: 0,
          allowMultipleAttempts: true,
          resumeAfterCompletion: true
        } as EffectParameters
      };
    case InteractionType.TRANSITION:
      return {
        type: 'transition',
        parameters: {
          targetSlideId: '',
          direction: 'next',
          transitionType: 'slide'
        } as EffectParameters
      };
    default:
      // Default to show_text for unknown types
      return {
        type: 'show_text',
        parameters: {
          text: 'New interaction',
          position: { x: 0, y: 0, width: 200, height: 100 },
          style: {
            fontSize: 16,
            color: '#000000',
            textAlign: 'center'
          }
        } as EffectParameters
      };
  }
};

export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({
  selectedElement,
  deviceType,
  onElementUpdate,
  onDelete,
  onClose,
}) => {
  // Collapsible sections state - keep properties open for hotspots, style for others
  const [openSections, setOpenSections] = useState(() => 
    getDefaultSections(selectedElement?.type)
  );
  
  // Interaction editing state
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);
  
  // Dynamic height calculation accounting for mobile toolbar
  const { maxHeight } = useContentAreaHeight(false);

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Update handlers
  // Color mapping from hex to Tailwind classes for hotspot compatibility
  const hexToTailwindMap: Record<string, string> = {
    '#3b82f6': 'bg-blue-500',
    '#ef4444': 'bg-red-500', 
    '#10b981': 'bg-emerald-500',
    '#8b5cf6': 'bg-violet-500',
    '#f97316': 'bg-orange-500',
    '#374151': 'bg-gray-700'
  };

  const handleStyleChange = useCallback((styleUpdates: Partial<ElementStyle>) => {
    if (!selectedElement) return;
    
    // Prepare updates for slide element
    const elementUpdates: Partial<SlideElement> = {
      style: {
        ...selectedElement.style,
        ...styleUpdates
      }
    };

    // For hotspot elements, update both content.style and customProperties
    if (selectedElement.type === 'hotspot') {
      const customProps: Record<string, any> = {
        ...selectedElement.content.customProperties
      };
      
      // Update color if backgroundColor is being changed
      if (styleUpdates.backgroundColor) {
        const tailwindColor = hexToTailwindMap[styleUpdates.backgroundColor] || 'bg-blue-500';
        customProps.color = tailwindColor;
        customProps.backgroundColor = tailwindColor;
      }
      
      // Update opacity if it's being changed
      if (styleUpdates.opacity !== undefined) {
        customProps.opacity = styleUpdates.opacity;
      }
      
      elementUpdates.content = {
        ...selectedElement.content,
        customProperties: customProps,
        style: {
          ...selectedElement.content.style,
          ...styleUpdates
        }
      };
    }
    
    onElementUpdate(selectedElement.id, elementUpdates);
  }, [selectedElement, onElementUpdate]);

  // Size change handler for hotspots
  const handleSizeChange = useCallback((size: HotspotSize) => {
    if (!selectedElement || selectedElement.type !== 'hotspot') return;
    
    const elementUpdates: Partial<SlideElement> = {
      content: {
        ...selectedElement.content,
        customProperties: {
          ...selectedElement.content.customProperties,
          size: size
        }
      }
    };
    
    onElementUpdate(selectedElement.id, elementUpdates);
  }, [selectedElement, onElementUpdate]);

  const handleContentChange = useCallback((contentUpdates: Partial<ElementContent>) => {
    if (!selectedElement) return;
    
    onElementUpdate(selectedElement.id, {
      content: {
        ...selectedElement.content,
        ...contentUpdates
      }
    });
  }, [selectedElement, onElementUpdate]);

  const handlePositionChange = useCallback((dimension: string, value: number) => {
    if (!selectedElement) return;
    
    const currentPosition = selectedElement.position?.[deviceType] || { x: 0, y: 0, width: 100, height: 100 };
    onElementUpdate(selectedElement.id, {
      position: {
        ...selectedElement.position,
        [deviceType]: {
          ...currentPosition,
          [dimension]: value
        }
      }
    });
  }, [selectedElement, deviceType, onElementUpdate]);

  // Interaction handlers
  const handleAddInteraction = useCallback((interactionType: InteractionType) => {
    if (!selectedElement) return;
    
    const effectMapping = mapInteractionToSlideEffect(interactionType);
    
    const newInteraction: ElementInteraction = {
      id: `interaction_${Date.now()}`,
      trigger: 'click',
      effect: {
        id: `effect_${Date.now()}`,
        type: effectMapping.type,
        parameters: effectMapping.parameters,
        duration: 500
      }
    };

    const updatedInteractions = [...selectedElement.interactions, newInteraction];
    onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
    setSelectedInteractionId(newInteraction.id);
  }, [selectedElement, onElementUpdate]);

  const handleRemoveInteraction = useCallback((interactionId: string) => {
    if (!selectedElement) return;
    
    const updatedInteractions = selectedElement.interactions.filter(i => i.id !== interactionId);
    onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
    if (selectedInteractionId === interactionId) {
      setSelectedInteractionId(null);
    }
  }, [selectedElement, onElementUpdate, selectedInteractionId]);

  const handleInteractionUpdate = useCallback((interactionId: string, updates: Partial<ElementInteraction>) => {
    if (!selectedElement) return;
    
    const updatedInteractions = selectedElement.interactions.map(interaction =>
      interaction.id === interactionId 
        ? { ...interaction, ...updates }
        : interaction
    );
    onElementUpdate(selectedElement.id, { interactions: updatedInteractions });
  }, [selectedElement, onElementUpdate]);

  if (!selectedElement) {
    return null;
  }

  const currentPosition = selectedElement.position?.[deviceType] || { x: 0, y: 0, width: 100, height: 100 };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 ${Z_INDEX_TAILWIND.MOBILE_PROPERTIES_PANEL} flex items-end justify-center`}
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 16px)', 
        touchAction: 'none',
        /* Use dynamic viewport height for iOS Safari */
        height: '100dvh',
        minHeight: '-webkit-fill-available'
      }}
      onTouchStart={(e) => {
        // More reliable backdrop detection for mobile
        const target = e.target as HTMLElement;
        const isBackdrop = target === e.currentTarget || target.classList.contains('bg-black');
        if (isBackdrop) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onTouchMove={(e) => {
        // Prevent scrolling on backdrop but allow scrolling within panel
        const target = e.target as HTMLElement;
        const isBackdrop = target === e.currentTarget || target.classList.contains('bg-black');
        if (isBackdrop) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onClick={(e) => {
        // Close modal when clicking outside the panel
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Mobile slide-up panel */}
      <div 
        className="bg-slate-800 w-full rounded-t-xl shadow-2xl overflow-hidden"
        style={{
          /* Dynamic max height accounting for mobile toolbar */
          maxHeight: maxHeight,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Properties</h2>
            <div className="text-sm text-slate-400 mt-1 capitalize">
              {selectedElement.type} Element
            </div>
          </div>
          <button
            onClick={onClose}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-lg"
            aria-label="Close properties"
          >
            ✕
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div 
          className="overflow-y-auto" 
          style={{ 
            /* Dynamic height calculation for iOS Safari with dvh support */
            maxHeight: 'min(calc(85dvh - 150px), calc(100vh - env(safe-area-inset-top, 44px) - env(safe-area-inset-bottom, 34px) - 182px))',
            touchAction: 'pan-y', // Allow vertical scrolling within panel
            /* Improved scrolling on iOS */
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Properties Section - Hotspot Elements Only */}
          {selectedElement.type === 'hotspot' && (
            <CollapsibleSection
              title="Properties - Hotspot Element"
              isOpen={openSections.properties}
              onToggle={() => toggleSection('properties')}
            >
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedElement.content?.title || ''}
                    onChange={(e) => handleContentChange({ title: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Hotspot title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedElement.content?.description || ''}
                    onChange={(e) => handleContentChange({ description: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
                    placeholder="Hotspot description"
                    rows={3}
                  />
                </div>

                {/* Background Color - Enhanced with Liquid Color Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Background Color
                  </label>
                  <LiquidColorSelector
                    selectedColor={selectedElement.style?.backgroundColor || '#3b82f6'}
                    onColorChange={(color) => handleStyleChange({ backgroundColor: color })}
                    isMobile={true}
                    size="medium"
                    showLiquidAnimation={true}
                  />
                  {/* Hex input for precise control */}
                  <input
                    type="text"
                    value={selectedElement.style?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                    className="mt-3 w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="#3b82f6"
                  />
                  
                  {/* Quick color swatches */}
                  <div className="grid grid-cols-6 gap-2 mt-3">
                    {[
                      { color: '#3b82f6', name: 'Blue' },
                      { color: '#ef4444', name: 'Red' },
                      { color: '#10b981', name: 'Green' },
                      { color: '#8b5cf6', name: 'Purple' },
                      { color: '#f97316', name: 'Orange' },
                      { color: '#374151', name: 'Dark' }
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        onClick={() => handleStyleChange({ backgroundColor: swatch.color })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedElement.style?.backgroundColor === swatch.color 
                            ? 'border-white scale-110' 
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: swatch.color, touchAction: 'manipulation' }}
                        title={swatch.name}
                      />
                    ))}
                  </div>
                  
                  {/* Size Selector */}
                  <div className="mt-6">
                    <div className="text-sm text-slate-400 mb-4">
                      Hotspot Size
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {hotspotSizePresets.map((sizePreset) => {
                        const currentSize = selectedElement.content?.customProperties?.size || 'medium';
                        const isSelected = currentSize === sizePreset.value;
                        
                        return (
                          <button
                            key={sizePreset.value}
                            onClick={() => handleSizeChange(sizePreset.value)}
                            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 border-2 min-h-[60px] ${
                              isSelected 
                                ? 'border-purple-500 bg-purple-500/20 scale-105' 
                                : 'border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-500 active:scale-95'
                            }`}
                            style={{ touchAction: 'manipulation' }}
                            title={sizePreset.description}
                          >
                            <div 
                              className={`rounded-full bg-blue-500 mb-2 ${
                                sizePreset.value === 'x-small' ? 'w-3 h-3' :
                                sizePreset.value === 'small' ? 'w-4 h-4' :
                                sizePreset.value === 'medium' ? 'w-5 h-5' :
                                'w-6 h-6'
                              }`}
                            />
                            <span className={`text-xs font-medium ${
                              isSelected ? 'text-purple-300' : 'text-slate-300'
                            }`}>
                              {sizePreset.value === 'x-small' ? 'XS' :
                               sizePreset.value === 'small' ? 'S' :
                               sizePreset.value === 'medium' ? 'M' : 'L'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Opacity Control */}
                  <div className="mt-6">
                    <div className="text-sm text-slate-400 mb-3">
                      Opacity
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedElement.style?.opacity || 0.9}
                        onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
                        className="flex-1 h-2"
                        style={{ touchAction: 'manipulation' }}
                      />
                      <span className="text-sm text-slate-400 w-12 text-right font-medium">
                        {Math.round((selectedElement.style?.opacity || 0.9) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Style Section - Non-hotspot Elements Only */}
          {selectedElement.type !== 'hotspot' && (
            <CollapsibleSection
              title="Style"
              isOpen={openSections.style}
              onToggle={() => toggleSection('style')}
            >
              <div className="space-y-4">
                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Background Color
                  </label>
                  <LiquidColorSelector
                    selectedColor={selectedElement.style?.backgroundColor || '#3b82f6'}
                    onColorChange={(color) => handleStyleChange({ backgroundColor: color })}
                    isMobile={true}
                    size="medium"
                    showLiquidAnimation={true}
                  />
                  <input
                    type="text"
                    value={selectedElement.style?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                    className="mt-3 w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="#3b82f6"
                  />
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Border Radius
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={selectedElement.style?.borderRadius || 8}
                      onChange={(e) => handleStyleChange({ borderRadius: parseInt(e.target.value) })}
                      className="flex-1 h-2"
                      style={{ touchAction: 'manipulation' }}
                    />
                    <span className="text-sm text-slate-400 w-12 text-right">
                      {selectedElement.style?.borderRadius || 8}px
                    </span>
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Opacity
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedElement.style?.opacity || 0.9}
                      onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
                      className="flex-1 h-2"
                      style={{ touchAction: 'manipulation' }}
                    />
                    <span className="text-sm text-slate-400 w-12 text-right">
                      {Math.round((selectedElement.style?.opacity || 0.9) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Content Section - Non-hotspot Elements Only */}
          {selectedElement.type !== 'hotspot' && (
            <CollapsibleSection
              title="Content"
              isOpen={openSections.content}
              onToggle={() => toggleSection('content')}
            >
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedElement.content?.title || ''}
                    onChange={(e) => handleContentChange({ title: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Element title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedElement.content?.description || ''}
                    onChange={(e) => handleContentChange({ description: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
                    placeholder="Element description"
                    rows={3}
                  />
                </div>

                {/* Media URL (for media elements) */}
                {selectedElement.type === 'media' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Media URL
                    </label>
                    <input
                      type="url"
                      value={selectedElement.content?.mediaUrl || ''}
                      onChange={(e) => handleContentChange({ mediaUrl: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      placeholder="https://example.com/media.jpg"
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Position Section */}
          <CollapsibleSection
            title={selectedElement.type === 'hotspot' ? `Position & Size (${deviceType})` : `Position (${deviceType})`}
            isOpen={openSections.position}
            onToggle={() => toggleSection('position')}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">X</label>
                <input
                  type="number"
                  value={currentPosition.x}
                  onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Y</label>
                <input
                  type="number"
                  value={currentPosition.y}
                  onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Width</label>
                <input
                  type="number"
                  value={currentPosition.width}
                  onChange={(e) => handlePositionChange('width', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Height</label>
                <input
                  type="number"
                  value={currentPosition.height}
                  onChange={(e) => handlePositionChange('height', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Interactions Section */}
          <CollapsibleSection
            title="Interactions"
            isOpen={openSections.interactions}
            onToggle={() => toggleSection('interactions')}
          >
            <div className="space-y-4">
              {/* Interactions List */}
              <InteractionsList
                element={selectedElement}
                selectedInteractionId={selectedInteractionId}
                onInteractionSelect={setSelectedInteractionId}
                onInteractionAdd={handleAddInteraction}
                onInteractionRemove={handleRemoveInteraction}
                isCompact={true}
              />
              
              {/* Inline Interaction Editor */}
              {selectedInteractionId && (
                <div className="border-t border-slate-600 pt-4">
                  <InteractionEditor
                    interaction={selectedElement.interactions.find(i => i.id === selectedInteractionId) || null}
                    onInteractionUpdate={handleInteractionUpdate}
                    isCompact={true}
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>
        
        {/* Footer Actions */}
        <div 
          className="p-4 border-t border-slate-700 space-y-3"
          style={{
            /* Ensure footer stays above iOS home indicator */
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)'
          }}
        >
          {/* Save confirmation message */}
          <div className="text-center">
            <p className="text-sm text-green-400 font-medium">
              ✓ Changes saved automatically
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold text-lg"
              onClick={onDelete}
              onTouchStart={(e) => e.stopPropagation()}
            >
              Delete Element
            </button>
            <button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold text-lg"
              onClick={onClose}
              onTouchStart={(e) => e.stopPropagation()}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePropertiesPanel;
