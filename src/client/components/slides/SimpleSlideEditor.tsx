import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InteractiveSlide, SlideElement, BackgroundMedia } from '../../../shared/slideTypes';
import { generateId } from '../../utils/generateId';
import { EffectExecutor } from '../../utils/EffectExecutor';
import SlideCanvas from './SlideCanvas';
import BackgroundSelector from './BackgroundSelector';
import AspectRatioSelector from './AspectRatioSelector';
import HotspotManager from './HotspotManager';
import SimpleTimeline from './SimpleTimeline';
import SimpleHotspotEditor from './SimpleHotspotEditor';

interface RelativePosition {
  x: number; // 0-1 (percentage of canvas width)
  y: number; // 0-1 (percentage of canvas height)
  width: number; // 0-1 (percentage of canvas width)
  height: number; // 0-1 (percentage of canvas height)
}

interface Hotspot {
  id: string;
  relativePosition: RelativePosition;
  element: SlideElement;
}

interface SimpleSlideEditorProps {
  slide: InteractiveSlide;
  onSlideChange: (slide: InteractiveSlide) => void;
  className?: string;
}

/**
 * SimpleSlideEditor - Clean, working slide editor
 * 
 * Features:
 * - Visual slide canvas with background and draggable hotspots
 * - Background selector (image/video/YouTube)
 * - Aspect ratio and development mode selection
 * - Hotspot management and editing
 * - Timeline for sequence tracking
 * - Real effect previews using EffectExecutor
 */
export const SimpleSlideEditor: React.FC<SimpleSlideEditorProps> = ({
  slide,
  onSlideChange,
  className = ''
}) => {
  const effectExecutorRef = useRef<EffectExecutor | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Editor state
  const [aspectRatio, setAspectRatio] = useState(slide.layout?.aspectRatio || '16:9');
  const [developmentMode, setDevelopmentMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>();
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [timelineStep, setTimelineStep] = useState(0);

  // Initialize EffectExecutor
  useEffect(() => {
    if (canvasContainerRef.current && !effectExecutorRef.current) {
      effectExecutorRef.current = new EffectExecutor(canvasContainerRef.current);
    }
  }, []);

  // Convert slide elements to hotspots
  const hotspots: Hotspot[] = slide.elements.map(element => ({
    id: element.id,
    relativePosition: {
      x: (element.position?.[developmentMode]?.x || 0) / 800, // Assuming 800px base width
      y: (element.position?.[developmentMode]?.y || 0) / 600, // Assuming 600px base height
      width: (element.position?.[developmentMode]?.width || 40) / 800,
      height: (element.position?.[developmentMode]?.height || 40) / 600,
    },
    element
  }));

  // Update slide when background changes
  const handleBackgroundChange = useCallback((background: BackgroundMedia) => {
    const updatedSlide = {
      ...slide,
      backgroundMedia: background
    };
    onSlideChange(updatedSlide);
  }, [slide, onSlideChange]);

  // Update slide when aspect ratio changes
  const handleAspectRatioChange = useCallback((newRatio: string) => {
    setAspectRatio(newRatio);
    const updatedSlide = {
      ...slide,
      layout: {
        ...slide.layout,
        aspectRatio: newRatio
      }
    };
    onSlideChange(updatedSlide);
  }, [slide, onSlideChange]);

  // Add new hotspot
  const handleHotspotAdd = useCallback((relativePosition: RelativePosition) => {
    const newElement: SlideElement = {
      id: generateId(),
      type: 'hotspot',
      position: {
        desktop: {
          x: relativePosition.x * 800,
          y: relativePosition.y * 600,
          width: relativePosition.width * 800,
          height: relativePosition.height * 600,
        },
        tablet: {
          x: relativePosition.x * 600,
          y: relativePosition.y * 450,
          width: relativePosition.width * 600,
          height: relativePosition.height * 450,
        },
        mobile: {
          x: relativePosition.x * 375,
          y: relativePosition.y * 667,
          width: relativePosition.width * 375,
          height: relativePosition.height * 667,
        }
      },
      content: {
        title: `Hotspot ${slide.elements.length + 1}`,
        description: 'New hotspot'
      },
      interactions: [],
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#1e40af',
        borderWidth: 2,
        opacity: 1
      },
      isVisible: true
    };

    const updatedSlide = {
      ...slide,
      elements: [...slide.elements, newElement]
    };
    onSlideChange(updatedSlide);
    setSelectedHotspotId(newElement.id);
  }, [slide, onSlideChange]);

  // Update hotspot position when dragged
  const handleHotspotDrag = useCallback((hotspotId: string, newRelativePosition: RelativePosition) => {
    const updatedElements = slide.elements.map(element => {
      if (element.id === hotspotId) {
        return {
          ...element,
          position: {
            desktop: {
              x: newRelativePosition.x * 800,
              y: newRelativePosition.y * 600,
              width: newRelativePosition.width * 800,
              height: newRelativePosition.height * 600,
            },
            tablet: {
              x: newRelativePosition.x * 600,
              y: newRelativePosition.y * 450,
              width: newRelativePosition.width * 600,
              height: newRelativePosition.height * 450,
            },
            mobile: {
              x: newRelativePosition.x * 375,
              y: newRelativePosition.y * 667,
              width: newRelativePosition.width * 375,
              height: newRelativePosition.height * 667,
            }
          }
        };
      }
      return element;
    });

    onSlideChange({
      ...slide,
      elements: updatedElements
    });
  }, [slide, onSlideChange]);

  // Handle hotspot click (open editor)
  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    setEditingHotspot(hotspot);
  }, []);

  // Handle hotspot selection from manager
  const handleHotspotSelect = useCallback((hotspotId: string) => {
    setSelectedHotspotId(hotspotId);
  }, []);

  // Handle hotspot deletion
  const handleHotspotDelete = useCallback((hotspotId: string) => {
    const updatedElements = slide.elements.filter(element => element.id !== hotspotId);
    onSlideChange({
      ...slide,
      elements: updatedElements
    });
    if (selectedHotspotId === hotspotId) {
      setSelectedHotspotId(undefined);
    }
  }, [slide, onSlideChange, selectedHotspotId]);

  // Handle hotspot duplication
  const handleHotspotDuplicate = useCallback((hotspotId: string) => {
    const originalElement = slide.elements.find(el => el.id === hotspotId);
    if (originalElement) {
      const duplicatedElement: SlideElement = {
        ...originalElement,
        id: generateId(),
        position: {
          desktop: {
            x: (originalElement.position?.desktop?.x || 0) + 20,
            y: (originalElement.position?.desktop?.y || 0) + 20,
            width: originalElement.position?.desktop?.width || 40,
            height: originalElement.position?.desktop?.height || 40,
          },
          tablet: {
            x: (originalElement.position?.tablet?.x || 0) + 15,
            y: (originalElement.position?.tablet?.y || 0) + 15,
            width: originalElement.position?.tablet?.width || 30,
            height: originalElement.position?.tablet?.height || 30,
          },
          mobile: {
            x: (originalElement.position?.mobile?.x || 0) + 10,
            y: (originalElement.position?.mobile?.y || 0) + 10,
            width: originalElement.position?.mobile?.width || 25,
            height: originalElement.position?.mobile?.height || 25,
          }
        },
        content: {
          ...originalElement.content,
          title: `${originalElement.content?.title || 'Hotspot'} Copy`
        }
      };

      onSlideChange({
        ...slide,
        elements: [...slide.elements, duplicatedElement]
      });
    }
  }, [slide, onSlideChange]);

  // Save hotspot from editor
  const handleHotspotSave = useCallback((updatedHotspot: SlideElement) => {
    const updatedElements = slide.elements.map(element =>
      element.id === updatedHotspot.id ? updatedHotspot : element
    );

    onSlideChange({
      ...slide,
      elements: updatedElements
    });

    setEditingHotspot(null);
  }, [slide, onSlideChange]);

  // Create timeline events from interactions
  const timelineEvents = hotspots.flatMap((hotspot, hotspotIndex) =>
    hotspot.element.interactions?.map((interaction, interactionIndex) => ({
      id: `${hotspot.id}-${interaction.id}`,
      hotspotId: hotspot.id,
      hotspotTitle: hotspot.element.content?.title || `Hotspot ${hotspotIndex + 1}`,
      interaction,
      sequence: hotspotIndex * 10 + interactionIndex
    })) || []
  );

  return (
    <div className={`simple-slide-editor ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Left Sidebar - Controls */}
        <div className="space-y-6 overflow-y-auto">
          <BackgroundSelector
            background={slide.backgroundMedia}
            onBackgroundChange={handleBackgroundChange}
          />
          
          <AspectRatioSelector
            aspectRatio={aspectRatio}
            developmentMode={developmentMode}
            onAspectRatioChange={handleAspectRatioChange}
            onDevelopmentModeChange={setDevelopmentMode}
          />

          <HotspotManager
            hotspots={hotspots}
            selectedHotspotId={selectedHotspotId}
            onHotspotAdd={handleHotspotAdd}
            onHotspotSelect={handleHotspotSelect}
            onHotspotDelete={handleHotspotDelete}
            onHotspotDuplicate={handleHotspotDuplicate}
          />
        </div>

        {/* Center - Canvas */}
        <div className="lg:col-span-2 flex flex-col">
          <div ref={canvasContainerRef} className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4">
            <SlideCanvas
              background={slide.backgroundMedia}
              hotspots={hotspots}
              aspectRatio={aspectRatio}
              developmentMode={developmentMode}
              onHotspotClick={handleHotspotClick}
              onHotspotDrag={handleHotspotDrag}
              onCanvasClick={handleHotspotAdd}
            />
          </div>
        </div>

        {/* Right Sidebar - Timeline */}
        <div className="space-y-6 overflow-y-auto">
          <SimpleTimeline
            events={timelineEvents}
            currentStep={timelineStep}
            onStepChange={setTimelineStep}
            onEventAdd={(hotspotId) => {
              // Focus on the hotspot to add interactions
              setSelectedHotspotId(hotspotId);
              const hotspot = hotspots.find(h => h.id === hotspotId);
              if (hotspot) {
                setEditingHotspot(hotspot);
              }
            }}
            onEventRemove={(eventId) => {
              // Remove interaction from timeline
              const [hotspotId, interactionId] = eventId.split('-');
              const updatedElements = slide.elements.map(element => {
                if (element.id === hotspotId) {
                  return {
                    ...element,
                    interactions: element.interactions?.filter(i => i.id !== interactionId) || []
                  };
                }
                return element;
              });
              onSlideChange({
                ...slide,
                elements: updatedElements
              });
            }}
            onEventReorder={(eventId, newSequence) => {
              // TODO: Implement event reordering
              console.log('Reorder event', eventId, 'to sequence', newSequence);
            }}
          />
        </div>
      </div>

      {/* Hotspot Editor Modal */}
      {editingHotspot && (
        <SimpleHotspotEditor
          hotspot={editingHotspot.element}
          onSave={handleHotspotSave}
          onClose={() => setEditingHotspot(null)}
          effectExecutor={effectExecutorRef.current || undefined}
        />
      )}
    </div>
  );
};

export default SimpleSlideEditor;