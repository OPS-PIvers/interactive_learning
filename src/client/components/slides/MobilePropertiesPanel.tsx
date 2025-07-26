import React, { useState, useCallback } from 'react';
import { SlideElement, DeviceType, ElementInteraction, InteractiveSlide, ElementStyle, ElementContent } from '../../../shared/slideTypes';
import { InteractionType } from '../../../shared/types';
import InteractionsList from '../interactions/InteractionsList';
import InteractionEditor from '../interactions/InteractionEditor';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface MobilePropertiesPanelProps {
  selectedElement: SlideElement | null;
  currentSlide: InteractiveSlide | null;
  deviceType: DeviceType;
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
  onSlideUpdate: (slideUpdates: Partial<InteractiveSlide>) => void;
  onDelete: () => void;
  onClose: () => void;
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
  <div className="border-b border-slate-600 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/50 transition-colors"
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

export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({
  selectedElement,
  currentSlide,
  deviceType,
  onElementUpdate,
  onSlideUpdate,
  onDelete,
  onClose,
}) => {
  // Collapsible sections state - default to closed for cleaner interface
  const [openSections, setOpenSections] = useState({
    style: false,
    content: false,
    position: false,
    interactions: false
  });
  
  // Interaction editing state
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);

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

  if (!selectedElement) {
    return null;
  }

  const currentPosition = selectedElement.position[deviceType];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
    >
      {/* Mobile slide-up panel */}
      <div className="bg-slate-800 w-full max-h-[85vh] rounded-t-xl shadow-2xl overflow-hidden">
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
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-lg"
            aria-label="Close properties"
          >
            ✕
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px - 70px)' }}>
          {/* Element Style Section */}
          <CollapsibleSection
            title="Style"
            isOpen={openSections.style}
            onToggle={() => toggleSection('style')}
          >
            <div className="space-y-4">
              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={selectedElement.style.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                    className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.style.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="#3b82f6"
                  />
                </div>
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
                    value={selectedElement.style.borderRadius || 8}
                    onChange={(e) => handleStyleChange({ borderRadius: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-400 w-12 text-right">
                    {selectedElement.style.borderRadius || 8}px
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
                    value={selectedElement.style.opacity || 0.9}
                    onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-400 w-12 text-right">
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
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={selectedElement.content.title || ''}
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
                  value={selectedElement.content.description || ''}
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
                    value={selectedElement.content.mediaUrl || ''}
                    onChange={(e) => handleContentChange({ mediaUrl: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
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
        <div className="p-4 border-t border-slate-700 flex gap-3">
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold text-lg"
            onClick={onDelete}
          >
            Delete Element
          </button>
          <button
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold text-lg"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePropertiesPanel;
