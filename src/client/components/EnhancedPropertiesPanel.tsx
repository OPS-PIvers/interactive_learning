import React, { useState, useCallback } from 'react';
import { SlideElement, DeviceType, ElementStyle, ElementContent, InteractiveSlide, BackgroundMedia } from '../../shared/slideTypes';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BackgroundMediaPanel from './BackgroundMediaPanel';

interface EnhancedPropertiesPanelProps {
  selectedElement: SlideElement | null;
  currentSlide: InteractiveSlide | null;
  deviceType: DeviceType;
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
  onSlideUpdate: (slideUpdates: Partial<InteractiveSlide>) => void;
  onViewInteractions: (elementId: string) => void;
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
  onViewInteractions,
  isMobile = false
}) => {
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    style: true,
    content: true,
    position: false,
    interactions: false,
    background: true
  });

  // Background media panel state
  const [isBackgroundPanelOpen, setIsBackgroundPanelOpen] = useState(false);

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Update handlers
  const handleStyleChange = useCallback((styleUpdates: Partial<ElementStyle>) => {
    if (!selectedElement) return;
    
    onElementUpdate(selectedElement.id, {
      style: {
        ...selectedElement.style,
        ...styleUpdates
      }
    });
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
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="font-semibold text-white">Properties</h2>
        <div className="text-xs text-slate-400 mt-1 capitalize">
          {selectedElement.type} Element
        </div>
      </div>
      
      {/* Content - Collapsible Sections */}
      <div className="flex-grow overflow-y-auto">
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

            {/* Border Radius */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Border Radius
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={selectedElement.style.borderRadius || 8}
                  onChange={(e) => handleStyleChange({ borderRadius: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs text-slate-400 w-8">
                  {selectedElement.style.borderRadius || 8}px
                </span>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Opacity
              </label>
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
                <span className="text-xs text-slate-400 w-8">
                  {Math.round((selectedElement.style.opacity || 0.9) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Element Content Section */}
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

        {/* Position Section */}
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

        {/* Interactions Section */}
        <CollapsibleSection
          title="Interactions"
          isOpen={openSections.interactions}
          onToggle={() => toggleSection('interactions')}
        >
          <div className="space-y-2">
            {selectedElement.interactions.length > 0 ? (
              selectedElement.interactions.map((interaction, index) => (
                <div key={index} className="bg-slate-700 rounded p-2">
                  <div className="text-xs text-slate-300 font-medium">
                    {interaction.trigger}
                  </div>
                  <div className="text-xs text-slate-400">
                    {interaction.effect.type} effect
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-2">
                No interactions added
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={() => onViewInteractions(selectedElement.id)}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          View Interactions
        </button>
      </div>
    </aside>
  );
};

export default EnhancedPropertiesPanel;