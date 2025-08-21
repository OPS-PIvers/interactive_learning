import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InteractiveSlide, SlideElement, BackgroundMedia, Project } from '../../../shared/types';
import { EffectExecutor } from '../../utils/EffectExecutor';
import { generateId } from '../../utils/generateId';
import AspectRatioSelector from './AspectRatioSelector';
import BackgroundSelector from './BackgroundSelector';
import HotspotManager from './HotspotManager';
import SimpleHotspotEditor from './SimpleHotspotEditor';
import SimpleTimeline from './SimpleTimeline';
import SlideCanvas from './SlideCanvas';
import SlideEditorToolbar from '../SlideEditorToolbar';

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
  projectName: string;
  onSave: () => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  isPublished: boolean;
  onImageUpload: (file: File) => void;
  project?: Project;
  onLivePreview: () => void;
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
  className = '',
  projectName,
  onSave,
  onClose,
  isSaving,
  isPublished,
  onImageUpload,
  project,
  onLivePreview,
}) => {
  const effectExecutorRef = useRef<EffectExecutor | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Editor state
  const [aspectRatio, setAspectRatio] = useState(slide.layout?.aspectRatio || '16:9');
  const [developmentMode, setDevelopmentMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>();
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [timelineStep, setTimelineStep] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  
  // Panel visibility for mobile-first progressive disclosure
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showHotspotsPanel, setShowHotspotsPanel] = useState(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState(false);

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
    <div 
      className={`simple-slide-editor editor-layout-stable ${className}`} 
      data-testid="unified-slide-editor"
      style={{
        // Force stable layout dimensions
        height: '100vh',
        minHeight: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        inset: '0',
        // Layout containment for stability
        contain: 'layout style',
        isolation: 'isolate'
      }}>
      <SlideEditorToolbar
        projectName={projectName}
        onSave={onSave}
        onClose={onClose}
        isSaving={isSaving}
        isPublished={isPublished}
        onImageUpload={onImageUpload}
        project={project}
        onTogglePreview={() => setIsPreview(!isPreview)}
        onLivePreview={onLivePreview}
        isPreview={isPreview}
      />
      
      {/* Mobile-first layout with enhanced stability */}
      <div 
        className="flex flex-col h-full w-full mobile-editor-container"
        style={{
          // Critical: Prevent any layout collapse
          minHeight: '100vh',
          minWidth: '100vw',
          contain: 'layout style',
          position: 'relative',
          paddingTop: '60px'
        }}>

        {/* Main Editor Layout - Enhanced Flexbox with stability */}
        <div 
          className="flex flex-1 overflow-hidden editor-main-layout"
          style={{
            // Critical layout stability
            minHeight: 'calc(100vh - 60px)',
            width: '100%',
            contain: 'layout style',
            position: 'relative'
          }}>
          
          {/* Desktop Sidebar - Always visible on large screens */}
          <div 
            className="hidden md:flex md:flex-col md:w-80 md:border-r border-slate-200 bg-slate-50 editor-sidebar"
            style={{
              flexShrink: 0,
              contain: 'layout style',
              minWidth: '320px',
              maxWidth: '320px'
            }}>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold mb-4">Slide Settings</h3>
                <div className="space-y-4">
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
                </div>
              </div>
              
              <HotspotManager
                hotspots={hotspots}
                selectedHotspotId={selectedHotspotId}
                onHotspotAdd={handleHotspotAdd}
                onHotspotSelect={handleHotspotSelect}
                onHotspotDelete={handleHotspotDelete}
                onHotspotDuplicate={handleHotspotDuplicate}
              />
              
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <SimpleTimeline
                  events={timelineEvents}
                  currentStep={timelineStep}
                  onStepChange={setTimelineStep}
                  onEventAdd={(hotspotId) => {
                    setSelectedHotspotId(hotspotId);
                    const hotspot = hotspots.find(h => h.id === hotspotId);
                    if (hotspot) {
                      setEditingHotspot(hotspot);
                    }
                  }}
                  onEventRemove={(eventId) => {
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
                    console.log('Reorder event', eventId, 'to sequence', newSequence);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Main Canvas Area - Enhanced stability */}
          <div 
            className="flex-1 flex flex-col relative editor-canvas-area"
            style={{
              // Critical: Ensure canvas area never collapses
              minWidth: '320px',
              minHeight: 'calc(100vh - 120px)',
              width: 'auto',
              contain: 'layout style',
              isolation: 'isolate',
              position: 'relative'
            }}>
            <div 
              ref={canvasContainerRef} 
              className="flex-1 flex items-center justify-center bg-gray-50 p-4 touch-manipulation canvas-wrapper-stable" 
              style={{ 
                touchAction: 'pan-x pan-y',
                // Critical stability properties
                minHeight: 'calc(100vh - 120px)',
                width: '100%',
                contain: 'layout style paint',
                isolation: 'isolate',
                position: 'relative'
              }}>
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
        </div>

        {/* Mobile Bottom Panels - Progressive disclosure */}
        {(showSettingsPanel && !isPreview) && (
          <div className="md:hidden bg-white border-t border-slate-200 p-4 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Slide Settings</h3>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="text-slate-500 hover:text-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
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
            </div>
          </div>
        )}

        {(showHotspotsPanel && !isPreview) && (
          <div className="md:hidden bg-white border-t border-slate-200 p-4 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Hotspots</h3>
              <button
                onClick={() => setShowHotspotsPanel(false)}
                className="text-slate-500 hover:text-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <HotspotManager
              hotspots={hotspots}
              selectedHotspotId={selectedHotspotId}
              onHotspotAdd={handleHotspotAdd}
              onHotspotSelect={handleHotspotSelect}
              onHotspotDelete={handleHotspotDelete}
              onHotspotDuplicate={handleHotspotDuplicate}
            />
          </div>
        )}

        {(showTimelinePanel && !isPreview) && (
          <div className="md:hidden bg-white border-t border-slate-200 p-4 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Timeline</h3>
              <button
                onClick={() => setShowTimelinePanel(false)}
                className="text-slate-500 hover:text-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <SimpleTimeline
              events={timelineEvents}
              currentStep={timelineStep}
              onStepChange={setTimelineStep}
              onEventAdd={(hotspotId) => {
                setSelectedHotspotId(hotspotId);
                const hotspot = hotspots.find(h => h.id === hotspotId);
                if (hotspot) {
                  setEditingHotspot(hotspot);
                }
              }}
              onEventRemove={(eventId) => {
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
                console.log('Reorder event', eventId, 'to sequence', newSequence);
              }}
            />
          </div>
        )}
      </div>

      {/* Hotspot Editor Modal */}
      {(editingHotspot && !isPreview) && (
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