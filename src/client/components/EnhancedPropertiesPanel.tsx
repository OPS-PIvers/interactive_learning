import React, { useState, useCallback, useEffect } from 'react';
import { SlideElement, DeviceType, ElementStyle, ElementContent, InteractiveSlide, BackgroundMedia, ElementInteraction } from '../../shared/slideTypes';
import { InteractionType } from '../../shared/types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BackgroundMediaPanel from './BackgroundMediaPanel';
import InteractionsList from './interactions/InteractionsList';
import InteractionEditor from './interactions/InteractionEditor';
import { hotspotSizePresets, HotspotSize } from '../../shared/hotspotStylePresets';
import { LiquidColorSelector } from './ui/LiquidColorSelector';

interface EnhancedPropertiesPanelProps {
  selectedElement: SlideElement | null;
  currentSlide: InteractiveSlide | null;
  deviceType: DeviceType;
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
  onSlideUpdate: (slideUpdates: Partial<InteractiveSlide>) => void;
  isMobile?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children
}) => (
  <div className="border-b border-slate-700 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-700/50 transition-colors"
      aria-expanded={isOpen}
    >
      <span className="font-medium text-white" data-testid={title === 'Interactions' ? 'interactions-header' : undefined}>{title}</span>
      <ChevronDownIcon 
        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} 
      />
    </button>
    {isOpen && (
      <div className="p-3 pt-0 space-y-3">
        {children}
      </div>
    )}
  </div>
);

/**
 * EnhancedPropertiesPanel - Professional properties panel matching landing page layout
 * 
 * Features 3-section layout: header, content with collapsible sections, and footer actions.
 * Provides real-time element editing with immediate canvas updates.
 */
const EnhancedPropertiesPanel: React.FC<EnhancedPropertiesPanelProps> = ({
  selectedElement,
  currentSlide,
  deviceType,
  onElementUpdate,
  onSlideUpdate,
  isMobile = false
}) => {
  const [styleOpen, setStyleOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [positionOpen, setPositionOpen] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(selectedElement?.type === 'hotspot');
  const [backgroundOpen, setBackgroundOpen] = useState(false);

  useEffect(() => {
    setInteractionsOpen(selectedElement?.type === 'hotspot');
  }, [selectedElement]);

  // Background media panel state
  const [isBackgroundPanelOpen, setIsBackgroundPanelOpen] = useState(false);
  
  // Interaction editing state
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);


  // Color mapping from hex to Tailwind classes for hotspot compatibility
  const hexToTailwindMap: Record<string, string> = {
    '#3b82f6': 'bg-blue-500',
    '#ef4444': 'bg-red-500', 
    '#10b981': 'bg-emerald-500',
    '#8b5cf6': 'bg-violet-500',
    '#f97316': 'bg-orange-500',
    '#374151': 'bg-gray-700'
  };

  // Update handlers
  const handleStyleChange = useCallback((styleUpdates: Partial<ElementStyle>) => {
    if (!selectedElement) return;
    
    // Prepare updates for slide element
    const elementUpdates: Partial<SlideElement> = {
      style: {
        ...selectedElement.style,
        ...styleUpdates
      }
    };

    // For hotspot elements, update both content.style (for SlideEditor) and customProperties (for HotspotViewer)
    if (selectedElement.type === 'hotspot') {
      const customProps: Record<string, any> = {
        ...selectedElement.content.customProperties
      };
      
      // Update color if backgroundColor is being changed
      if (styleUpdates.backgroundColor) {
        const tailwindColor = hexToTailwindMap[styleUpdates.backgroundColor] || 'bg-blue-500';
        customProps.color = tailwindColor;
        customProps.backgroundColor = tailwindColor; // alias for mobile compatibility
      }
      
      // Update opacity if it's being changed
      if (styleUpdates.opacity !== undefined) {
        customProps.opacity = styleUpdates.opacity;
      }
      
      elementUpdates.content = {
        ...selectedElement.content,
        customProperties: customProps,
        // Update content.style for SlideEditor compatibility
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
    
    const currentPosition = selectedElement.position[deviceType];
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

  // Background media handlers
  const handleBackgroundMediaChange = useCallback((backgroundMedia: BackgroundMedia | null) => {
    if (!currentSlide) return;
    
    onSlideUpdate({
      backgroundMedia: backgroundMedia
    });
  }, [currentSlide, onSlideUpdate]);

  const handleOpenBackgroundPanel = useCallback(() => {
    setIsBackgroundPanelOpen(true);
  }, []);

  // Interaction handlers
  const handleAddInteraction = useCallback((interactionType: InteractionType) => {
    if (!selectedElement) return;
    
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

  // Render slide properties (when no element is selected)
  if (!selectedElement) {
    return (
      <aside className={`w-80 bg-slate-800/50 flex flex-col border-l border-slate-700 flex-shrink-0 ${isMobile ? 'hidden' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Properties</h2>
          <div className="text-xs text-slate-400 mt-1">
            Slide Background
          </div>
        </div>
        
        {/* Slide Background Section */}
        <div className="flex-grow overflow-y-auto">
          <CollapsibleSection
            title="Background Media"
            isOpen={backgroundOpen}
            onToggle={() => setBackgroundOpen(!backgroundOpen)}
          >
            <div className="space-y-3">
              {/* Current Background Display */}
              {currentSlide?.backgroundMedia ? (
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300 capitalize">
                      {currentSlide.backgroundMedia.type} Background
                    </span>
                    <button
                      onClick={() => handleBackgroundMediaChange(null)}
                      className="text-red-400 hover:text-red-300 text-xs"
                      title="Remove background"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {currentSlide.backgroundMedia.type === 'youtube' && currentSlide.backgroundMedia.youtubeId && (
                    <div className="aspect-video bg-black rounded mb-2">
                      <iframe
                        src={`https://www.youtube.com/embed/${currentSlide.backgroundMedia.youtubeId}?rel=0&modestbranding=1`}
                        className="w-full h-full rounded"
                        title="Background Video Preview"
                      />
                    </div>
                  )}
                  
                  {currentSlide.backgroundMedia.type === 'image' && currentSlide.backgroundMedia.url && (
                    <div className="aspect-video bg-slate-600 rounded mb-2 overflow-hidden">
                      <img
                        src={currentSlide.backgroundMedia.url}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {currentSlide.backgroundMedia.url && (
                    <div className="text-xs text-slate-400 break-all">
                      {currentSlide.backgroundMedia.url.length > 40 
                        ? `${currentSlide.backgroundMedia.url.substring(0, 40)}...`
                        : currentSlide.backgroundMedia.url
                      }
                    </div>
                  )}
                </div>
              ) : currentSlide?.backgroundImage ? (
                // Legacy background image support
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300">
                      Legacy Image Background
                    </span>
                  </div>
                  <div className="aspect-video bg-slate-600 rounded mb-2 overflow-hidden">
                    <img
                      src={currentSlide.backgroundImage}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-slate-400 break-all">
                    {currentSlide.backgroundImage.length > 40 
                      ? `${currentSlide.backgroundImage.substring(0, 40)}...`
                      : currentSlide.backgroundImage
                    }
                  </div>
                </div>
              ) : (
                // No background state
                <div className="text-center py-6 text-slate-400">
                  <div className="text-2xl mb-2">🖼️</div>
                  <p className="text-sm">No background media set</p>
                </div>
              )}
              
              {/* Add/Edit Background Button */}
              <button
                onClick={handleOpenBackgroundPanel}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
              >
                {currentSlide?.backgroundMedia || currentSlide?.backgroundImage 
                  ? 'Edit Background' 
                  : 'Add Background Media'
                }
              </button>
            </div>
          </CollapsibleSection>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="text-center text-slate-400 text-xs">
            👆 Select an element to edit its properties
          </div>
        </div>

        {/* Background Media Panel */}
        <BackgroundMediaPanel
          isOpen={isBackgroundPanelOpen}
          currentBackgroundMedia={currentSlide?.backgroundMedia || null}
          onBackgroundMediaChange={handleBackgroundMediaChange}
          onClose={() => setIsBackgroundPanelOpen(false)}
        />
      </aside>
    );
  }

  const currentPosition = selectedElement.position[deviceType];

  return (
    <aside className={`w-80 bg-slate-800/50 flex flex-col border-l border-slate-700 flex-shrink-0 ${isMobile ? 'hidden' : ''}`}>
      {/* Content - Collapsible Sections */}
      <div className="flex-grow overflow-y-auto">
        {/* Properties - Hotspot Element Section - Now first */}
        {selectedElement.type === 'hotspot' && (
          <CollapsibleSection
            title="Properties - Hotspot Element"
            isOpen={contentOpen} // Reuse content section state
            onToggle={() => setContentOpen(!contentOpen)}
          >
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={selectedElement.content.title || ''}
                  onChange={(e) => handleContentChange({ title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                  placeholder="Hotspot title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedElement.content.description || ''}
                  onChange={(e) => handleContentChange({ description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs resize-none"
                  placeholder="Hotspot description"
                  rows={3}
                />
              </div>

              {/* Position Controls */}
              <div>
                <div className="text-xs font-medium text-slate-300 mb-2">
                  Position & Size ({deviceType})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">X</label>
                    <input
                      type="number"
                      value={currentPosition.x}
                      onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Y</label>
                    <input
                      type="number"
                      value={currentPosition.y}
                      onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Width</label>
                    <input
                      type="number"
                      value={currentPosition.width}
                      onChange={(e) => handlePositionChange('width', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Height</label>
                    <input
                      type="number"
                      value={currentPosition.height}
                      onChange={(e) => handlePositionChange('height', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Background Color - Enhanced with Liquid Color Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Background Color
                </label>
                <LiquidColorSelector
                  selectedColor={selectedElement.style.backgroundColor || '#3b82f6'}
                  onColorChange={(color) => handleStyleChange({ backgroundColor: color })}
                  isMobile={isMobile}
                  size="medium"
                  showLiquidAnimation={true}
                />
                {/* Hex input for precise control */}
                <input
                  type="text"
                  value={selectedElement.style.backgroundColor || '#3b82f6'}
                  onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                  className="mt-2 w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
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
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedElement.style.backgroundColor === swatch.color 
                          ? 'border-white scale-110' 
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                    />
                  ))}
                </div>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={selectedElement.content.title || ''}
                onChange={(e) => handleContentChange({ title: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                placeholder="Element title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={selectedElement.content.description || ''}
                onChange={(e) => handleContentChange({ description: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs resize-none"
                placeholder="Element description"
                rows={3}
              />
            </div>

            {/* Media URL (for media elements) */}
            {selectedElement.type === 'media' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Media URL
                </label>
                <input
                  type="url"
                  value={selectedElement.content.mediaUrl || ''}
                  onChange={(e) => handleContentChange({ mediaUrl: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                  placeholder="https://example.com/media.jpg"
                />
              </div>
            )}
          </div>
        </CollapsibleSection>
        )}

        {/* Position Section - Only for non-hotspot elements */}
        {selectedElement.type !== 'hotspot' && (
        <CollapsibleSection
          title={`Position (${deviceType})`}
          isOpen={positionOpen}
          onToggle={() => setPositionOpen(!positionOpen)}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">X</label>
              <input
                type="number"
                value={currentPosition.x}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Y</label>
              <input
                type="number"
                value={currentPosition.y}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Width</label>
              <input
                type="number"
                value={currentPosition.width}
                onChange={(e) => handlePositionChange('width', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Height</label>
              <input
                type="number"
                value={currentPosition.height}
                onChange={(e) => handlePositionChange('height', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
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
          <div className="space-y-4">
            {/* Interactions List */}
            <InteractionsList
              element={selectedElement}
              selectedInteractionId={selectedInteractionId}
              onInteractionSelect={setSelectedInteractionId}
              onInteractionAdd={handleAddInteraction}
              onInteractionRemove={handleRemoveInteraction}
              isCompact={isMobile}
            />
            
            {/* Inline Interaction Editor */}
            {selectedInteractionId && (
              <div className="border-t border-slate-600 pt-4">
                <InteractionEditor
                  interaction={selectedElement.interactions.find(i => i.id === selectedInteractionId) || null}
                  onInteractionUpdate={handleInteractionUpdate}
                  isCompact={isMobile}
                />
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-center text-slate-400 text-xs">
          💡 Use the Interactions section above to add element behaviors
        </div>
      </div>
    </aside>
  );
};

export default EnhancedPropertiesPanel;