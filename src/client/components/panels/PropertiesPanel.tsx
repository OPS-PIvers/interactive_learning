import React from 'react';
import { InteractiveSlide, SlideElement } from '../../../shared/slideTypes';
import ElementPropertiesSection from './ElementPropertiesSection';
import StyleSection from './StyleSection';
import PositionSection from './PositionSection';
import InteractionsSection from './InteractionsSection';
import SlidePropertiesSection from './SlidePropertiesSection';

interface PropertiesPanelProps {
  selectedElement: SlideElement | null;
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
  currentSlide: InteractiveSlide;
  onSlideUpdate: (updates: Partial<InteractiveSlide>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate,
  currentSlide,
  onSlideUpdate
}) => {
  return (
    <div className="properties-panel">
      <div className="properties-panel__header">
        <h3 className="text-lg font-semibold text-gray-200">
          {selectedElement ? 'Element Properties' : 'Slide Properties'}
        </h3>
      </div>
      
      <div className="properties-panel__content">
        {selectedElement ? (
          <>
            {/* Element Properties Section */}
            <ElementPropertiesSection 
              element={selectedElement}
              onUpdate={(updates) => onElementUpdate(selectedElement.id, updates)}
            />
            
            {/* Style Section */}
            <StyleSection 
              element={selectedElement}
              onUpdate={(updates) => onElementUpdate(selectedElement.id, updates)}
            />
            
            {/* Position Section */}
            <PositionSection 
              element={selectedElement}
              onUpdate={(updates) => onElementUpdate(selectedElement.id, updates)}
            />
            
            {/* Interactions Section */}
            <InteractionsSection 
              element={selectedElement}
              onUpdate={(updates) => onElementUpdate(selectedElement.id, updates)}
            />
          </>
        ) : (
          <SlidePropertiesSection 
            slide={currentSlide}
            onUpdate={onSlideUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;