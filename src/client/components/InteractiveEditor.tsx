import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTouchGestures } from '../hooks/useTouchGestures';
import LazyLoadingFallback from './shared/LazyLoadingFallback';
import { HotspotData, TimelineEventData, InteractionType, ImageTransformState } from '../../shared/types';
import EditorToolbar from './EditorToolbar';
import MobileEditorTabs, { MobileEditorActiveTab } from './MobileEditorTabs';
import MobileEditorLayout from './MobileEditorLayout';
import MobileErrorBoundary from './shared/MobileErrorBoundary';
import ImageEditCanvas from './ImageEditCanvas';
import Modal from './Modal';
import LoadingSpinnerIcon from './icons/LoadingSpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import { Z_INDEX, INTERACTION_DEFAULTS } from '../constants/interactionConstants';
import { normalizeHotspotPosition } from '../../lib/safeMathUtils';
import { generateId } from '../utils/generateId';
import { debugLog } from '../utils/debugUtils';

// Lazy load timeline and modal components
const HorizontalTimeline = lazy(() => import('./HorizontalTimeline'));
const HotspotEditorModal = lazy(() => import('./HotspotEditorModal'));

interface InteractiveEditorProps {
  projectName: string;
  backgroundImage: string | null;
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  backgroundType: 'image' | 'video';
  backgroundVideoType?: 'upload' | 'youtube';
  onClose: () => void;
  onSave: () => Promise<void>;
  onHotspotsChange: (hotspots: HotspotData[]) => void;
  onTimelineEventsChange: (events: TimelineEventData[]) => void;
  onBackgroundImageChange: (image: string | null) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'upload' | 'youtube') => void;
  onImageUpload: (file: File) => Promise<void>;
}

const InteractiveEditor: React.FC<InteractiveEditorProps> = ({
  projectName,
  backgroundImage,
  hotspots,
  timelineEvents,
  backgroundType,
  backgroundVideoType,
  onClose,
  onSave,
  onHotspotsChange,
  onTimelineEventsChange,
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange,
  onImageUpload
}) => {
  const isMobile = useIsMobile();
  
  // Editor-specific state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [editingZoom, setEditingZoom] = useState<number>(1);
  const [editingHotspot, setEditingHotspot] = useState<HotspotData | null>(null);
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Image dimensions and positioning
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number, height: number} | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  
  // Modal state
  const [isHotspotModalOpen, setIsHotspotModalOpen] = useState(false);
  const [selectedHotspotForModal, setSelectedHotspotForModal] = useState<string | null>(null);
  
  // Mobile editor state
  const [activeMobileEditorTab, setActiveMobileEditorTab] = useState<MobileEditorActiveTab>('properties');
  const [mobilePreviewEvents, setMobilePreviewEvents] = useState<TimelineEventData[]>([]);
  const [isMobilePreviewMode, setIsMobilePreviewMode] = useState(false);
  
  // Additional state for mobile editor layout props
  const [isAutoProgression, setIsAutoProgression] = useState(false);
  const [autoProgressionDuration, setAutoProgressionDuration] = useState(3000);
  const [currentColorScheme, setCurrentColorScheme] = useState('default');
  
  // Refs
  const actualImageRef = useRef<HTMLImageElement>(null);
  const zoomedImageContainerRef = useRef<HTMLDivElement>(null);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const mobileEditorPanelRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Touch gesture handling for editing
  const [editorIsTransforming, setEditorIsTransforming] = useState(false);
  const [editorImageTransform, setEditorImageTransform] = useState<ImageTransformState>({
    scale: editingZoom,
    translateX: 0,
    translateY: 0
  });

  // Track drag state for better touch coordination
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    isGestureActive,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useTouchGestures(
    imageContainerRef,
    editorImageTransform,
    setEditorImageTransform,
    setEditorIsTransforming,
    {
      isEditing: true,
      isDragActive,
      disabled: !isMobile
    }
  );

  const editingTouchHandlers = useMemo(() => ({
    onTouchStart: isMobile ? handleTouchStart : undefined,
    onTouchMove: isMobile ? handleTouchMove : undefined,
    onTouchEnd: isMobile ? handleTouchEnd : undefined,
  }), [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Timeline management
  const uniqueSortedSteps = useMemo(() => {
    return [...new Set(timelineEvents.map(e => e.step))].sort((a, b) => a - b);
  }, [timelineEvents]);

  const currentStepIndex = useMemo(() => {
    return uniqueSortedSteps.indexOf(currentStep);
  }, [uniqueSortedSteps, currentStep]);

  // Hotspot positioning calculations
  const hotspotsWithPositions = useMemo(() => {
    if (!backgroundImage) return hotspots.map(h => ({ ...h, pixelPosition: null }));
    
    // For mobile, we should use percentage positioning to let CSS handle the scaling
    // Only provide pixel positioning for desktop or when we have accurate container dimensions
    if (isMobile) {
      return hotspots.map(hotspot => ({
        ...hotspot,
        pixelPosition: null // Let HotspotViewer use percentage positioning for mobile
      }));
    }
    
    // Desktop pixel positioning (only when we have accurate dimensions)
    if (!imageNaturalDimensions) {
      return hotspots.map(h => ({ ...h, pixelPosition: null }));
    }
    
    return hotspots.map(hotspot => {
      const pixelX = (hotspot.x / 100) * imageNaturalDimensions.width;
      const pixelY = (hotspot.y / 100) * imageNaturalDimensions.height;
      
      return {
        ...hotspot,
        pixelPosition: {
          x: pixelX,
          y: pixelY
        }
      };
    });
  }, [hotspots, backgroundImage, imageNaturalDimensions, isMobile]);

  // Event handlers
  const handleAddHotspot = useCallback(() => {
    setIsPlacingHotspot(true);
  }, []);

  const handlePlaceNewHotspot = useCallback((x: number, y: number) => {
    const normalizedPosition = normalizeHotspotPosition({ x, y });
    const newHotspot: HotspotData = {
      id: generateId(),
      x: normalizedPosition.x,
      y: normalizedPosition.y,
      title: 'New Hotspot',
      description: ''
    };
    
    onHotspotsChange([...hotspots, newHotspot]);
    setEditingHotspot(newHotspot);
    setIsPlacingHotspot(false);
    
    if (isMobile) {
      setActiveMobileEditorTab('properties');
    } else {
      setSelectedHotspotForModal(newHotspot.id);
      setIsHotspotModalOpen(true);
    }
  }, [hotspots, onHotspotsChange, isMobile]);

  const handleRemoveHotspot = useCallback((hotspotId: string) => {
    onHotspotsChange(hotspots.filter(h => h.id !== hotspotId));
    onTimelineEventsChange(timelineEvents.filter(e => e.targetId !== hotspotId));
  }, [hotspots, timelineEvents, onHotspotsChange, onTimelineEventsChange]);

  const handleHotspotPositionChange = useCallback((hotspotId: string, newX: number, newY: number) => {
    const normalizedPosition = normalizeHotspotPosition({ x: newX, y: newY });
    onHotspotsChange(hotspots.map(h =>
      h.id === hotspotId
        ? { ...h, x: normalizedPosition.x, y: normalizedPosition.y }
        : h
    ));

    const updatedEvents = timelineEvents.map(event => {
      if (event.targetId === hotspotId) {
        const newEvent = { ...event };
        if (newEvent.type === InteractionType.SPOTLIGHT) {
          newEvent.spotlightX = normalizedPosition.x;
          newEvent.spotlightY = normalizedPosition.y;
        }
        if (newEvent.type === InteractionType.PAN_ZOOM_TO_HOTSPOT) {
          newEvent.targetX = normalizedPosition.x;
          newEvent.targetY = normalizedPosition.y;
        }
        return newEvent;
      }
      return event;
    });
    onTimelineEventsChange(updatedEvents);
  }, [hotspots, onHotspotsChange, timelineEvents, onTimelineEventsChange]);

  const handleFocusHotspot = useCallback((hotspotId: string) => {
    setSelectedHotspotForModal(hotspotId);
    const hotspot = hotspots.find(h => h.id === hotspotId);
    if (hotspot) {
      setEditingHotspot(hotspot);
    }
    
    if (isMobile) {
      // For mobile, we'll let the MobileEditorLayout handle the modal
      // The hotspot selection will trigger the modal through selectedHotspot prop
    } else {
      setIsHotspotModalOpen(true);
    }
  }, [isMobile, hotspots]);

  const handleOpenHotspotEditor = useCallback((hotspotId: string) => {
    handleFocusHotspot(hotspotId);
  }, [handleFocusHotspot]);

  // Timeline event handlers
  const handleAddTimelineEvent = useCallback((event: TimelineEventData) => {
    onTimelineEventsChange([...timelineEvents.filter(e => e.id !== event.id), event].sort((a, b) => a.step - b.step));
    setCurrentStep(event.step);
  }, [timelineEvents, onTimelineEventsChange]);

  const handleUpdateTimelineEvent = useCallback((event: TimelineEventData) => {
    onTimelineEventsChange(timelineEvents.map(e => e.id === event.id ? event : e));
  }, [timelineEvents, onTimelineEventsChange]);

  const handleDeleteTimelineEvent = useCallback((eventId: string) => {
    onTimelineEventsChange(timelineEvents.filter(e => e.id !== eventId));
  }, [timelineEvents, onTimelineEventsChange]);

  // Mobile preview handlers
  const handleMobilePreviewEvent = useCallback((events: TimelineEventData[]) => {
    setMobilePreviewEvents(events);
    setIsMobilePreviewMode(true);
  }, []);

  const handleStopMobilePreview = useCallback(() => {
    setMobilePreviewEvents([]);
    setIsMobilePreviewMode(false);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setEditingZoom(prev => Math.min(5, prev + 0.05));
  }, []);

  const handleZoomOut = useCallback(() => {
    setEditingZoom(prev => Math.max(0.25, prev - 0.05));
  }, []);

  const handleZoomReset = useCallback(() => {
    setEditingZoom(1);
  }, []);

  // Center handler for mobile
  const handleCenter = useCallback(() => {
    // Reset zoom and center the image
    setEditingZoom(1);
  }, []);

  // Auto progression handlers
  const handleToggleAutoProgression = useCallback((enabled: boolean) => {
    setIsAutoProgression(enabled);
  }, []);

  const handleAutoProgressionDurationChange = useCallback((duration: number) => {
    setAutoProgressionDuration(duration);
  }, []);

  // Color scheme handler
  const handleColorSchemeChange = useCallback((scheme: string) => {
    setCurrentColorScheme(scheme);
  }, []);

  // Viewer mode handlers
  const handleViewerModeChange = useCallback((mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => {
    // This would typically update some global viewer mode state
    console.log(`Viewer mode ${mode} ${enabled ? 'enabled' : 'disabled'}`);
  }, []);

  // Image load handler
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const newDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
    setImageNaturalDimensions(newDimensions);
  }, []);

  // Save handler
  const handleSaveClick = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Image or hotspot click handler
  const handleImageOrHotspotClick = useCallback((e: React.MouseEvent, hotspotId?: string) => {
    if (isPlacingHotspot && !hotspotId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      handlePlaceNewHotspot(x, y);
    } else if (hotspotId) {
      const clickedHotspot = hotspots.find(h => h.id === hotspotId);
      if (clickedHotspot && editingHotspot?.id !== clickedHotspot.id) {
        setEditingHotspot(clickedHotspot);
      }
    } else if (!isPlacingHotspot && editingHotspot !== null) {
      setEditingHotspot(null);
    }
  }, [isPlacingHotspot, hotspots, editingHotspot, handlePlaceNewHotspot]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      <div
        id="editor-content"
        tabIndex={-1}
        className="text-slate-200 fixed inset-0 z-50 bg-slate-900"
        role="main"
        aria-label="Interactive module editor"
        aria-live="polite"
      >
        {isMobile ? (
          <MobileErrorBoundary key="mobile-editor">
            <MobileEditorLayout
              project={{
                id: 'temp-id',
                title: projectName,
                description: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: '',
                isPublic: false,
                thumbnailUrl: null,
                data: {
                  backgroundImage: backgroundImage || '',
                  hotspots,
                  timelineEvents,
                  backgroundType,
                  backgroundVideoType
                }
              }}
              backgroundImage={backgroundImage}
              hotspots={hotspots}
              timelineEvents={timelineEvents}
              currentStep={currentStep}
              isEditing={true}
              onBack={onClose}
              onSave={handleSaveClick}
              isSaving={isSaving}
              showSuccessMessage={showSuccessMessage}
              onAddHotspot={isPlacingHotspot ? undefined : handleAddHotspot}
              selectedHotspot={editingHotspot}
              onUpdateHotspot={(updates) => {
                if (editingHotspot) {
                  const updatedHotspot = { ...editingHotspot, ...updates };
                  onHotspotsChange(hotspots.map(h => h.id === editingHotspot.id ? updatedHotspot : h));
                  setEditingHotspot(updatedHotspot);

                  // Also update associated timeline events
                  if (updates.x !== undefined || updates.y !== undefined) {
                    const newX = updates.x !== undefined ? updates.x : editingHotspot.x;
                    const newY = updates.y !== undefined ? updates.y : editingHotspot.y;

                    const updatedEvents = timelineEvents.map(event => {
                      if (event.targetId === editingHotspot.id) {
                        const newEvent = { ...event };
                        if (newEvent.type === InteractionType.SPOTLIGHT) {
                          newEvent.spotlightX = newX;
                          newEvent.spotlightY = newY;
                        }
                        if (newEvent.type === InteractionType.PAN_ZOOM_TO_HOTSPOT) {
                          newEvent.targetX = newX;
                          newEvent.targetY = newY;
                        }
                        return newEvent;
                      }
                      return event;
                    });
                    onTimelineEventsChange(updatedEvents);
                  }
                }
              }}
              onDeleteHotspot={(hotspotId) => {
                handleRemoveHotspot(hotspotId);
                setEditingHotspot(null);
              }}
              activePanelOverride={activeMobileEditorTab === 'properties' ? 'properties' : activeMobileEditorTab === 'timeline' ? 'timeline' : activeMobileEditorTab === 'background' ? 'background' : 'image'}
              onActivePanelChange={(panel) => {
                if (panel === 'properties') {
                  setActiveMobileEditorTab('properties');
                } else if (panel === 'timeline') {
                  setActiveMobileEditorTab('timeline');
                } else if (panel === 'background') {
                  setActiveMobileEditorTab('background');
                } else if (panel === 'image') {
                  setActiveMobileEditorTab('properties');
                  // Clear selected hotspot when going back to image
                  setEditingHotspot(null);
                  setSelectedHotspotForModal(null);
                }
              }}
              onAddTimelineEvent={handleAddTimelineEvent}
              onUpdateTimelineEvent={handleUpdateTimelineEvent}
              onDeleteTimelineEvent={handleDeleteTimelineEvent}
              previewingEvents={mobilePreviewEvents}
              onPreviewEvent={(event) => handleMobilePreviewEvent([event])}
              onStopPreview={handleStopMobilePreview}
              backgroundType={backgroundType}
              backgroundVideoType={backgroundVideoType === 'upload' ? 'youtube' : backgroundVideoType}
              onReplaceImage={onImageUpload}
              onBackgroundImageChange={onBackgroundImageChange}
              onBackgroundTypeChange={onBackgroundTypeChange}
              onBackgroundVideoTypeChange={(type) => onBackgroundVideoTypeChange(type === 'mp4' ? 'upload' : type)}
              isPlacingHotspot={isPlacingHotspot}
              onToggleAutoProgression={handleToggleAutoProgression}
              isAutoProgression={isAutoProgression}
              autoProgressionDuration={autoProgressionDuration}
              onAutoProgressionDurationChange={handleAutoProgressionDurationChange}
              currentZoom={editingZoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onCenter={handleCenter}
              currentColorScheme={currentColorScheme}
              onColorSchemeChange={handleColorSchemeChange}
              viewerModes={{ explore: true, selfPaced: true, timed: true }}
              onViewerModeChange={handleViewerModeChange}
            >
              {/* Image Canvas */}
              <div
                ref={imageContainerRef}
                className="flex-1 relative bg-slate-700 min-h-0 overflow-hidden mobile-event-container mobile-transform-container"
                {...editingTouchHandlers}
              >
                <ImageEditCanvas
                  backgroundImage={backgroundImage}
                  editingZoom={editingZoom}
                  actualImageRef={actualImageRef}
                  zoomedImageContainerRef={zoomedImageContainerRef}
                  scrollableContainerRef={scrollableContainerRef}
                  imageContainerRef={imageContainerRef}
                  hotspotsWithPositions={hotspotsWithPositions}
                  pulsingHotspotId={null}
                  activeHotspotDisplayIds={new Set()}
                  isPlacingHotspot={isPlacingHotspot}
                  onPlaceNewHotspot={handlePlaceNewHotspot}
                  highlightedHotspotId={highlightedHotspotId}
                  getHighlightGradientStyle={() => ({})}
                  onImageLoad={handleImageLoad}
                  onImageOrHotspotClick={handleImageOrHotspotClick}
                  onFocusHotspot={handleFocusHotspot}
                  onEditHotspotRequest={handleOpenHotspotEditor}
                  onHotspotPositionChange={handleHotspotPositionChange}
                  onDragStateChange={setIsDragActive}
                  getImageBounds={() => null}
                  imageNaturalDimensions={imageNaturalDimensions}
                  imageFitMode="contain"
                  previewingEvents={mobilePreviewEvents}
                  isPreviewMode={isMobilePreviewMode}
                  isEditing={true}
                  isMobile={isMobile}
                />
              </div>
            </MobileEditorLayout>
          </MobileErrorBoundary>
        ) : (
          <>
            {/* Desktop Editor Toolbar */}
            <div className="bg-slate-800 border-b border-slate-700">
              <EditorToolbar
                projectName={projectName}
                onBack={onClose}
                onSave={handleSaveClick}
                isSaving={isSaving}
                showSuccessMessage={showSuccessMessage}
                onAddHotspot={handleAddHotspot}
                isPlacingHotspot={isPlacingHotspot}
                onCancelPlacement={() => setIsPlacingHotspot(false)}
                currentZoom={editingZoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
              />
            </div>

            {/* Main editing content */}
            <div className="h-full">
              <div className="relative bg-slate-900 h-full" style={{ zIndex: Z_INDEX.IMAGE_BASE }}>
                <ImageEditCanvas
                  backgroundImage={backgroundImage}
                  editingZoom={editingZoom}
                  actualImageRef={actualImageRef}
                  zoomedImageContainerRef={zoomedImageContainerRef}
                  scrollableContainerRef={scrollableContainerRef}
                  imageContainerRef={imageContainerRef}
                  hotspotsWithPositions={hotspotsWithPositions}
                  pulsingHotspotId={null}
                  activeHotspotDisplayIds={new Set()}
                  isPlacingHotspot={isPlacingHotspot}
                  onPlaceNewHotspot={handlePlaceNewHotspot}
                  highlightedHotspotId={highlightedHotspotId}
                  getHighlightGradientStyle={() => ({})}
                  onImageLoad={handleImageLoad}
                  onImageOrHotspotClick={handleImageOrHotspotClick}
                  onFocusHotspot={handleFocusHotspot}
                  onEditHotspotRequest={handleOpenHotspotEditor}
                  onHotspotPositionChange={handleHotspotPositionChange}
                  onDragStateChange={setIsDragActive}
                  getImageBounds={() => null}
                  imageNaturalDimensions={imageNaturalDimensions}
                  imageFitMode="contain"
                  previewingEvents={[]}
                  isPreviewMode={false}
                  isEditing={true}
                  isMobile={isMobile}
                />

                {/* Desktop Timeline */}
                <div className="bg-slate-800 border-t border-slate-700 absolute bottom-0 left-0 right-0" style={{ zIndex: Z_INDEX.TIMELINE }}>
                  <Suspense fallback={<LazyLoadingFallback type="component" message="Loading timeline..." />}>
                    <HorizontalTimeline
                      uniqueSortedSteps={uniqueSortedSteps}
                      currentStep={currentStep}
                      onStepSelect={setCurrentStep}
                      isEditing={true}
                      timelineEvents={timelineEvents}
                      setTimelineEvents={onTimelineEventsChange}
                      hotspots={hotspots}
                      moduleState="idle"
                      onPrevStep={() => {}}
                      onNextStep={() => {}}
                      currentStepIndex={currentStepIndex}
                      totalSteps={uniqueSortedSteps.length}
                      isMobile={isMobile}
                      onAddStep={(step) => {
                        // Add a default event at the new step
                        const newEvent: TimelineEventData = {
                          id: generateId(),
                          step,
                          type: InteractionType.SHOW_TEXT,
                          name: `Step ${step} Event`,
                          message: '',
                          targetId: ''
                        };
                        handleAddTimelineEvent(newEvent);
                      }}
                      onDeleteStep={(step) => {
                        // Remove all events at this step
                        const eventsToDelete = timelineEvents.filter(e => e.step === step);
                        eventsToDelete.forEach(event => handleDeleteTimelineEvent(event.id));
                      }}
                      onUpdateStep={(oldStep, newStep) => {
                        // Update all events from oldStep to newStep
                        const updatedEvents = timelineEvents.map(event => 
                          event.step === oldStep ? { ...event, step: newStep } : event
                        );
                        onTimelineEventsChange(updatedEvents);
                      }}
                      onMoveStep={(dragIndex, hoverIndex) => {
                        // Swap the steps of events at these indices
                        const sortedSteps = [...uniqueSortedSteps].sort((a, b) => a - b);
                        const dragStep = sortedSteps[dragIndex];
                        const hoverStep = sortedSteps[hoverIndex];
                        
                        const updatedEvents = timelineEvents.map(event => {
                          if (event.step === dragStep) return { ...event, step: hoverStep };
                          if (event.step === hoverStep) return { ...event, step: dragStep };
                          return event;
                        });
                        onTimelineEventsChange(updatedEvents);
                      }}
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Desktop Hotspot Editor Modal */}
            {isHotspotModalOpen && selectedHotspotForModal && (
              <Suspense fallback={<LazyLoadingFallback type="modal" message="Loading editor..." />}>
                <HotspotEditorModal
                  isOpen={isHotspotModalOpen}
                  selectedHotspot={hotspots.find(h => h.id === selectedHotspotForModal) || null}
                  relatedEvents={timelineEvents.filter(event => event.targetId === selectedHotspotForModal)}
                  currentStep={currentStep}
                  backgroundImage={backgroundImage || ''}
                  onUpdateHotspot={(hotspot) => {
                    onHotspotsChange(hotspots.map(h => 
                      h.id === hotspot.id ? hotspot : h
                    ));
                  }}
                  onDeleteHotspot={(hotspotId) => {
                    handleRemoveHotspot(hotspotId);
                    setIsHotspotModalOpen(false);
                    setSelectedHotspotForModal(null);
                  }}
                  onAddEvent={handleAddTimelineEvent}
                  onUpdateEvent={handleUpdateTimelineEvent}
                  onDeleteEvent={handleDeleteTimelineEvent}
                  onClose={() => {
                    setIsHotspotModalOpen(false);
                    setSelectedHotspotForModal(null);
                  }}
                  allHotspots={hotspots}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveEditor;