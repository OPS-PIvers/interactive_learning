import React, { useState, useCallback, useEffect } from 'react';
import { SlideElement, DeviceType, ElementStyle, ElementContent, InteractiveSlide, BackgroundMedia, ElementInteraction } from '../../shared/slideTypes';
import { InteractionType } from '../../shared/types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BackgroundMediaPanel from './BackgroundMediaPanel';
import InteractionsList from './interactions/InteractionsList';
import InteractionEditor from './interactions/InteractionEditor';
import { hotspotSizePresets, HotspotSize } from '../../shared/hotspotStylePresets';

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
      <span className="font-medium text-white">{title}</span>
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
  // Collapsible sections state - default to closed for cleaner interface
  const [openSections, setOpenSections] = useState({
    style: false,
    presets: selectedElement?.type === 'hotspot', // Keep presets open for hotspots as primary functionality
    content: false,
    position: false,
    interactions: false,
    background: false
  });

  useEffect(() => {
    setOpenSections(prev => ({
      ...prev,
      presets: selectedElement?.type === 'hotspot',
      interactions: selectedElement?.type === 'hotspot'
    }));
  }, [selectedElement]);

  // Background media panel state
  const [isBackgroundPanelOpen, setIsBackgroundPanelOpen] = useState(false);
  
  // Interaction editing state
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

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
            isOpen={openSections.background}
            onToggle={() => toggleSection('background')}
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
        {/* Hotspot Presets Section - Only for hotspots */}
        {selectedElement.type === 'hotspot' && (
          <CollapsibleSection
            title="Style Presets"
            isOpen={openSections.presets}
            onToggle={() => toggleSection('presets')}
          >
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-3">
                Quick style presets for common hotspot designs
              </div>
              
              {/* Preset Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Blue Pulse Preset */}
                <button
                  onClick={() => handleStyleChange({
                    backgroundColor: '#3b82f6',
                    borderRadius: 50,
                    opacity: 0.9,
                    animation: 'pulse'
                  })}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    selectedElement.style.backgroundColor === '#3b82f6' 
                      ? 'border-blue-500 bg-blue-500/20' 
                      : 'border-transparent bg-slate-700 hover:bg-slate-600 hover:border-blue-500'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full mb-2 animate-pulse"
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                  <span className="text-xs text-slate-300">Blue Pulse</span>
                </button>

                {/* Red Alert Preset */}
                <button
                  onClick={() => handleStyleChange({
                    backgroundColor: '#ef4444',
                    borderRadius: 50,
                    opacity: 0.85,
                    animation: 'bounce'
                  })}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    selectedElement.style.backgroundColor === '#ef4444' 
                      ? 'border-red-500 bg-red-500/20' 
                      : 'border-transparent bg-slate-700 hover:bg-slate-600 hover:border-red-500'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full mb-2"
                    style={{ backgroundColor: '#ef4444' }}
                  />
                  <span className="text-xs text-slate-300">Red Alert</span>
                </button>

                {/* Green Success Preset */}
                <button
                  onClick={() => handleStyleChange({
                    backgroundColor: '#10b981',
                    borderRadius: 50,
                    opacity: 0.9,
                    animation: 'none'
                  })}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    selectedElement.style.backgroundColor === '#10b981' 
                      ? 'border-green-500 bg-green-500/20' 
                      : 'border-transparent bg-slate-700 hover:bg-slate-600 hover:border-green-500'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full mb-2"
                    style={{ backgroundColor: '#10b981' }}
                  />
                  <span className="text-xs text-slate-300">Green</span>
                </button>

                {/* Purple Gradient Preset */}
                <button
                  onClick={() => handleStyleChange({
                    backgroundColor: '#8b5cf6',
                    borderRadius: 50,
                    opacity: 0.95,
                    animation: 'glow'
                  })}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    selectedElement.style.backgroundColor === '#8b5cf6' 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-transparent bg-slate-700 hover:bg-slate-600 hover:border-purple-500'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full mb-2"
                    style={{ backgroundColor: '#8b5cf6' }}
                  />
                  <span className="text-xs text-slate-300">Purple</span>
                </button>

                {/* Orange Warning Preset */}
                <button
                  onClick={() => handleStyleChange({
                    backgroundColor: '#f97316',
                    borderRadius: 50,
                    opacity: 0.9,
                    animation: 'flash'
                  })}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    selectedElement.style.backgroundColor === '#f97316' 
                      ? 'border-orange-500 bg-orange-500/20' 
                      : 'border-transparent bg-slate-700 hover:bg-slate-600 hover:border-orange-500'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full mb-2"
                    style={{ backgroundColor: '#f97316' }}
                  />
                  <span className="text-xs text-slate-300">Orange</span>
                </button>

                {/* Dark Minimal Preset */}
                <button
                  onClick={() => handleStyleChange({
                    backgroundColor: '#374151',
                    borderRadius: 8,
                    opacity: 0.8,
                    animation: 'none'
                  })}
                  className={`flex flex-col items-center p-3 rounded-lg transition-colors border ${
                    selectedElement.style.backgroundColor === '#374151' 
                      ? 'border-gray-500 bg-gray-500/20' 
                      : 'border-transparent bg-slate-700 hover:bg-slate-600 hover:border-gray-500'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded mb-2"
                    style={{ backgroundColor: '#374151' }}
                  />
                  <span className="text-xs text-slate-300">Minimal</span>
                </button>
              </div>
              
              {/* Size Selector */}
              <div className="mt-4">
                <div className="text-xs text-slate-400 mb-3">
                  Hotspot Size
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {hotspotSizePresets.map((sizePreset) => {
                    const currentSize = selectedElement.content.customProperties?.size || 'medium';
                    const isSelected = currentSize === sizePreset.value;
                    
                    return (
                      <button
                        key={sizePreset.value}
                        onClick={() => handleSizeChange(sizePreset.value)}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors border ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-500/20' 
                            : 'border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-500'
                        }`}
                        title={sizePreset.description}
                      >
                        <div 
                          className={`rounded-full bg-blue-500 mb-1 ${
                            sizePreset.value === 'x-small' ? 'w-2 h-2' :
                            sizePreset.value === 'small' ? 'w-3 h-3' :
                            sizePreset.value === 'medium' ? 'w-4 h-4' :
                            'w-5 h-5'
                          }`}
                        />
                        <span className={`text-xs ${
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
              
              {/* Opacity Control - moved from Style section */}
              <div className="mt-4">
                <div className="text-xs text-slate-400 mb-2">
                  Opacity
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedElement.style.opacity || 0.9}
                    onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-400 w-12">
                    {Math.round((selectedElement.style.opacity || 0.9) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Properties - Hotspot Element Section */}
        {selectedElement.type === 'hotspot' && (
          <CollapsibleSection
            title="Properties - Hotspot Element"
            isOpen={openSections.content} // Reuse content section state
            onToggle={() => toggleSection('content')}
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
            </div>
          </CollapsibleSection>
        )}

        {/* Element Style Section */}
        <CollapsibleSection
          title="Style"
          isOpen={openSections.style}
          onToggle={() => toggleSection('style')}
        >
          <div className="space-y-3">
            {/* Background Color */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedElement.style.backgroundColor || '#3b82f6'}
                  onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement.style.backgroundColor || '#3b82f6'}
                  onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

          </div>
        </CollapsibleSection>

        {/* Element Content Section - Only for non-hotspot elements */}
        {selectedElement.type !== 'hotspot' && (
        <CollapsibleSection
          title="Content"
          isOpen={openSections.content}
          onToggle={() => toggleSection('content')}
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
          isOpen={openSections.position}
          onToggle={() => toggleSection('position')}
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