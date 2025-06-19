import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InteractiveModuleState, HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import FileUpload from './FileUpload';
import HotspotViewer from './HotspotViewer';
import HorizontalTimeline from './HorizontalTimeline';
import HotspotEditModal from './HotspotEditModal';
import StreamlinedHotspotEditor from './StreamlinedHotspotEditor';
import HotspotEditorModal from './HotspotEditorModal';
import EditorToolbar, { COLOR_SCHEMES } from './EditorToolbar';
import ViewerToolbar from './ViewerToolbar';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import LoadingSpinnerIcon from './icons/LoadingSpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import ReactDOM from 'react-dom';
import { appScriptProxy } from '../../lib/firebaseProxy';

const MemoizedHotspotViewer = React.memo(HotspotViewer);

// Z-index layer management
const Z_INDEX = {
  IMAGE_BASE: 10,
  IMAGE_TRANSFORMED: 15,
  HOTSPOTS: 20,
  INFO_PANEL: 30,
  TIMELINE: 40,
  TOOLBAR: 50,
  MODAL: 60,
  DEBUG: 100
} as const;

// Error boundary for positioning failures
const safeGetPosition = <T extends any>(
  fn: () => T | null,
  fallback: T
): T => {
  try {
    const result = fn();
    return result === null || result === undefined ? fallback : result;
  } catch (error) {
    console.error('Position calculation error:', error);
    return fallback;
  }
};

// Throttle expensive calculations
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    const timeSinceLastExec = currentTime - lastExecTime;

    if (timeSinceLastExec > delay) {
      lastExecTime = currentTime;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        lastExecTime = Date.now();
        func(...args);
        timeoutId = null;
      }, delay - timeSinceLastExec);
    }
  }) as T;
};

interface InteractiveModuleProps {
  initialData: InteractiveModuleState;
  isEditing: boolean;
  onSave: (data: InteractiveModuleState) => void;
  onClose?: () => void;
  projectName: string;
  projectId: string;
}

type PendingHotspotInfo = {
  x: number;
  y: number;
  imageX: number;
  imageY: number;
};

type ImageTransformState = {
  scale: number;
  translateX: number;
  translateY: number;
  targetHotspotId?: string;
};

// Hook for auto-save functionality
function useAutoSave(
  isEditing: boolean, 
  hotspots: HotspotData[], 
  timelineEvents: TimelineEventData[], 
  handleSave: () => void
) {
  const [lastSaveData, setLastSaveData] = useState<string>('');
  const autoSaveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEditing) return;

    const currentData = JSON.stringify({ hotspots, timelineEvents });
    
    if (currentData !== lastSaveData && lastSaveData !== '') {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        console.log('Auto-saving...');
        handleSave();
      }, 3000);
    }
    
    setLastSaveData(currentData);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [isEditing, hotspots, timelineEvents, handleSave, lastSaveData]);
}

const InteractiveModule: React.FC<InteractiveModuleProps> = ({ 
  initialData, 
  isEditing, 
  onSave, 
  onClose, 
  projectName,
  projectId 
}) => {
  const [backgroundImage, setBackgroundImage] = useState<string>(initialData.backgroundImage || '');
  const [hotspots, setHotspots] = useState<HotspotData[]>(initialData.hotspots || []);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>(initialData.timelineEvents || []);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover' | 'fill'>(initialData.imageFitMode || 'contain');
  const [moduleState, setModuleState] = useState<'idle' | 'learning'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [exploredHotspotId, setExploredHotspotId] = useState<string | null>(null);
  const [exploredHotspotPanZoomActive, setExploredHotspotPanZoomActive] = useState<boolean>(false);
  const [activeHotspotInfoId, setActiveHotspotInfoId] = useState<string | null>(null);
  const [infoPanelAnchor, setInfoPanelAnchor] = useState<{x: number, y: number} | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [touchStartDistance, setTouchStartDistance] = useState<number | null>(null);
  const [pulsingHotspotId, setPulsingHotspotId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  
  // For the Hotspot Editor Modal
  const [isHotspotModalOpen, setIsHotspotModalOpen] = useState<boolean>(false);
  const [selectedHotspotForModal, setSelectedHotspotForModal] = useState<string | null>(null);

  const [pendingHotspot, setPendingHotspot] = useState<PendingHotspotInfo | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const scaledImageDivRef = useRef<HTMLDivElement>(null);
  
  // New refs for the img-based system (editing mode only)
  const zoomedImageContainerRef = useRef<HTMLDivElement>(null);
  const actualImageRef = useRef<HTMLImageElement>(null);

  const [imageTransform, setImageTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const [viewportZoom, setViewportZoom] = useState<number>(1);
  const [zoomOrigin, setZoomOrigin] = useState<{x: number, y: number}>({x: 50, y: 50});
  
  // New state for editing mode
  const [editingZoom, setEditingZoom] = useState<number>(1);
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number, height: number} | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  
  // Refs to break dependency loops
  const isApplyingTransformRef = useRef(false);
  const lastAppliedTransformRef = useRef<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  
  // Store original untransformed bounds to prevent feedback loops
  const originalImageBoundsRef = useRef<{width: number, height: number, left: number, top: number, absoluteLeft: number, absoluteTop: number} | null>(null);

  const batchedSetState = useCallback((updates: Array<() => void>) => {
    ReactDOM.unstable_batchedUpdates(() => {
      updates.forEach(update => update());
    });
  }, []);

  // Debug mode for development and coordinate precision fixes
  const [debugMode] = useState(() => import.meta.env.DEV && localStorage.getItem('debug_positioning') === 'true');
  const [debugPositioning, setDebugPositioning] = useState(false);

  // Track if transform is transitioning for smooth animations
  const [isTransforming, setIsTransforming] = useState(false);

  const debugLog = useCallback((category: string, message: string, data?: any) => {
    if (debugMode) {
      console.log(`[${category}] ${message}`, data || '');
    }
  }, [debugMode]);

  const uniqueSortedSteps = useMemo(() => {
    const stepsWithHotspots = timelineEvents
      .filter(event => hotspots.some(h => h.id === event.hotspotId))
      .map(event => event.step);
    
    const uniqueSteps = Array.from(new Set(stepsWithHotspots)).sort((a, b) => a - b);
    return uniqueSteps.length > 0 ? uniqueSteps : (isEditing ? [1] : []);
  }, [timelineEvents, hotspots, isEditing]);

  const currentStepIndex = useMemo(() => { 
    if (moduleState === 'learning') {
      const idx = uniqueSortedSteps.indexOf(currentStep);
      return idx !== -1 ? idx : 0; 
    }
    return -1; 
  }, [currentStep, uniqueSortedSteps, moduleState]);
  
  const totalTimelineInteractionPoints = useMemo(() => uniqueSortedSteps.length, [uniqueSortedSteps]);
  
  const editorMaxStep = useMemo(() => {
    return timelineEvents.length > 0 ? Math.max(...timelineEvents.map(e => e.step), 0) : 1;
  }, [timelineEvents]);

  // Get dimensions for the scaled image div (used in viewer mode)
  const getScaledImageDivDimensions = useCallback(() => {
    if (!imageContainerRef.current || !imageNaturalDimensions) {
      return { width: 400, height: 300 }; // fallback
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    
    // Account for timeline space in viewer mode
    const timelineHeight = !isEditing && uniqueSortedSteps.length > 0 ? 100 : 0;
    const availableHeight = containerRect.height - timelineHeight;
    const availableWidth = containerRect.width;

    // Calculate based on 80vw/80vh with max constraints, similar to CSS
    const maxWidth = Math.min(availableWidth * 0.8, 1200);
    const maxHeight = Math.min(availableHeight * 0.8, 800);

    const imageAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;
    const containerAspect = maxWidth / maxHeight;

    let width, height;
    if (imageAspect > containerAspect) {
      width = maxWidth;
      height = maxWidth / imageAspect;
    } else {
      height = maxHeight;
      width = maxHeight * imageAspect;
    }

    return { width, height };
  }, [imageNaturalDimensions, isEditing, uniqueSortedSteps.length]);

  // Universal helper to get the actual rendered image dimensions and position
  const getImageBounds = useCallback(() => {
    if (isEditing && actualImageRef.current && imageContainerRef.current) {
      // Editor mode: Use actual img element (most reliable)
      const imgRect = actualImageRef.current.getBoundingClientRect();
      const containerRect = imageContainerRef.current.getBoundingClientRect();

      return {
        width: imgRect.width,
        height: imgRect.height,
        left: imgRect.left - containerRect.left,
        top: imgRect.top - containerRect.top,
        absoluteLeft: imgRect.left,
        absoluteTop: imgRect.top
      };
    } else if (!isEditing && scaledImageDivRef.current && imageContainerRef.current && backgroundImage && imageNaturalDimensions) {
      // Viewer mode: Calculate based on natural dimensions to avoid transform feedback
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const divDimensions = getScaledImageDivDimensions();
      const containerAspect = divDimensions.width / divDimensions.height;
      const imageAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;

      let width, height, left = 0, top = 0;

      if (imageFitMode === 'cover') {
        if (containerAspect > imageAspect) {
          width = divDimensions.width;
          height = width / imageAspect;
          top = (divDimensions.height - height) / 2;
        } else {
          height = divDimensions.height;
          width = height * imageAspect;
          left = (divDimensions.width - width) / 2;
        }
      } else if (imageFitMode === 'contain') {
        if (containerAspect > imageAspect) {
          height = divDimensions.height;
          width = height * imageAspect;
          left = (divDimensions.width - width) / 2;
        } else {
          width = divDimensions.width;
          height = width / imageAspect;
          top = (divDimensions.height - height) / 2;
        }
      } else { // fill
        width = divDimensions.width;
        height = divDimensions.height;
      }

      const timelineHeight = uniqueSortedSteps.length > 0 ? 100 : 0;
      const availableHeight = containerRect.height - timelineHeight;
      const availableWidth = containerRect.width;
      
      const divLeft = (availableWidth - divDimensions.width) / 2;
      const divTop = (availableHeight - divDimensions.height) / 2;

      return {
        width,
        height,
        left: divLeft + left,
        top: divTop + top,
        absoluteLeft: containerRect.left + divLeft + left,
        absoluteTop: containerRect.top + divTop + top
      };
    }
    return null;
  }, [isEditing, backgroundImage, imageNaturalDimensions, imageFitMode, getScaledImageDivDimensions, uniqueSortedSteps.length]);

  const getSafeImageBounds = useCallback(() => {
    return safeGetPosition(() => getImageBounds(), null);
  }, [getImageBounds]);

  // Helper to clear cached bounds when needed
  const clearImageBoundsCache = useCallback(() => {
    originalImageBoundsRef.current = null;
  }, []);

  // Add coordinate helper functions
  const naturalToRenderedCoordinates = useCallback((naturalX: number, naturalY: number) => {
    const imageBounds = getImageBounds();
    if (!imageBounds) return null;
    
    return {
      x: imageBounds.left + (naturalX / 100) * imageBounds.width,
      y: imageBounds.top + (naturalY / 100) * imageBounds.height
    };
  }, [getImageBounds]);

  const renderedToNaturalCoordinates = useCallback((renderedX: number, renderedY: number) => {
    const imageBounds = getImageBounds();
    if (!imageBounds || !imageContainerRef.current) return null;
    
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const containerRelativeX = renderedX - containerRect.left;
    const containerRelativeY = renderedY - containerRect.top;
    
    const relativeX = containerRelativeX - imageBounds.left;
    const relativeY = containerRelativeY - imageBounds.top;
    
    return {
      x: (relativeX / imageBounds.width) * 100,
      y: (relativeY / imageBounds.height) * 100
    };
  }, [getImageBounds]);

  // Helper to get viewport center for centering operations
  const getViewportCenter = useCallback(() => {
    if (!imageContainerRef.current) return null;

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const timelineHeight = !isEditing && uniqueSortedSteps.length > 0 ? 100 : 0;

    return {
      centerX: containerRect.width / 2,
      centerY: (containerRect.height - timelineHeight) / 2
    };
  }, [isEditing, uniqueSortedSteps.length]);

  const getSafeViewportCenter = useCallback(() => {
    return safeGetPosition(
      () => getViewportCenter(),
      { centerX: 400, centerY: 300 }
    );
  }, [getViewportCenter]);

  // Reset function to handle data changes
  const resetModuleToInitialState = useCallback(() => {
    setModuleState('idle');
    setCurrentStep(uniqueSortedSteps[0] || 1);
    setExploredHotspotId(null);
    setExploredHotspotPanZoomActive(false);
    setActiveHotspotInfoId(null);
    setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
    setViewportZoom(1);
    setEditingZoom(1);
    clearImageBoundsCache();
    
    debugLog('Reset', 'Module reset to initial state');
  }, [uniqueSortedSteps, clearImageBoundsCache, debugLog]);

  // Effect to handle initial data loading with validation
  useEffect(() => {
    if (initialData) {
      // Validate and fix any coordinate issues from existing data
      const validatedHotspots = initialData.hotspots.map(hotspot => ({
        ...hotspot,
        x: Math.max(0, Math.min(100, hotspot.x)),
        y: Math.max(0, Math.min(100, hotspot.y))
      }));
      
      setHotspots(validatedHotspots);
      setTimelineEvents(initialData.timelineEvents);
      
      resetModuleToInitialState();
    }
  }, [initialData, resetModuleToInitialState]);

  const handleImageClick = useCallback((event: React.MouseEvent) => {
    if (!isEditing || !imageContainerRef.current) return;

    // Get current rendered image bounds
    const imageBounds = getImageBounds();
    if (!imageBounds) {
      setPendingHotspot(null);
      return;
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const containerRelativeX = event.clientX - containerRect.left;
    const containerRelativeY = event.clientY - containerRect.top;

    // Check if click is within image bounds
    if (containerRelativeX < imageBounds.left || 
        containerRelativeX > imageBounds.left + imageBounds.width ||
        containerRelativeY < imageBounds.top || 
        containerRelativeY > imageBounds.top + imageBounds.height) {
      setPendingHotspot(null);
      return;
    }

    // Convert to natural image coordinates (key fix!)
    const relativeX = containerRelativeX - imageBounds.left;
    const relativeY = containerRelativeY - imageBounds.top;

    const imageXPercent = Math.max(0, Math.min(100, (relativeX / imageBounds.width) * 100));
    const imageYPercent = Math.max(0, Math.min(100, (relativeY / imageBounds.height) * 100));

    setPendingHotspot({
      x: containerRelativeX,
      y: containerRelativeY,
      imageX: imageXPercent,
      imageY: imageYPercent
    });
  }, [isEditing, getImageBounds]);

  // Effect for InfoPanel anchor calculation
  useEffect(() => {
    if (activeHotspotInfoId) {
      const hotspot = hotspots.find(h => h.id === activeHotspotInfoId);
      if (hotspot && imageContainerRef.current) {
        if (isEditing && actualImageRef.current) {
          // Editor mode: Use actual img element
          const imgElement = actualImageRef.current;
          const imgRect = imgElement.getBoundingClientRect();
          const containerRect = imageContainerRef.current.getBoundingClientRect();
          
          const dotCenterX = imgRect.left + (hotspot.x / 100) * imgRect.width;
          const dotCenterY = imgRect.top + (hotspot.y / 100) * imgRect.height;
          
          const anchorX = dotCenterX - containerRect.left;
          const anchorY = dotCenterY - containerRect.top;
          
          setInfoPanelAnchor({ x: anchorX, y: anchorY });
        } else if (!isEditing) {
          // Viewer mode: Use natural coordinate conversion
          const renderCoords = naturalToRenderedCoordinates(hotspot.x, hotspot.y);
          if (renderCoords) {
            setInfoPanelAnchor({ x: renderCoords.x, y: renderCoords.y });
          } else {
            setInfoPanelAnchor(null);
          }
        }
      } else {
        setInfoPanelAnchor(null);
      }
    } else {
      setInfoPanelAnchor(null);
    }
  }, [activeHotspotInfoId, hotspots, isEditing, naturalToRenderedCoordinates]);

  // Debug overlay component
  const DebugOverlay = () => {
    if (!debugPositioning || !imageNaturalDimensions) return null;
    
    const imageBounds = getImageBounds();
    if (!imageBounds) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none z-40">
        <div 
          className="absolute border-2 border-red-500 bg-red-500/10"
          style={{
            left: imageBounds.left,
            top: imageBounds.top,
            width: imageBounds.width,
            height: imageBounds.height
          }}
        />
        
        {[0, 25, 50, 75, 100].map(percent => (
          <React.Fragment key={percent}>
            <div
              className="absolute border-l border-blue-300 opacity-50"
              style={{
                left: imageBounds.left + (percent / 100) * imageBounds.width,
                top: imageBounds.top,
                height: imageBounds.height
              }}
            />
            <div
              className="absolute border-t border-blue-300 opacity-50"
              style={{
                left: imageBounds.left,
                top: imageBounds.top + (percent / 100) * imageBounds.height,
                width: imageBounds.width
              }}
            />
          </React.Fragment>
        ))}
        
        {hotspots.map(hotspot => {
          const renderCoords = naturalToRenderedCoordinates(hotspot.x, hotspot.y);
          if (!renderCoords) return null;
          
          return (
            <div
              key={hotspot.id}
              className="absolute bg-black/75 text-white text-xs p-1 rounded pointer-events-none"
              style={{
                left: renderCoords.x + 10,
                top: renderCoords.y - 30
              }}
            >
              {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%
            </div>
          );
        })}
      </div>
    );
  };

  // Save functionality
  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    
    const currentData: InteractiveModuleState = {
      backgroundImage,
      hotspots,
      timelineEvents,
      imageFitMode,
      isEmpty: !backgroundImage
    };
    
    try {
      await onSave(currentData);
      console.log('Save completed successfully');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Save failed: ' + errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [backgroundImage, hotspots, timelineEvents, imageFitMode, onSave, isSaving]);

  // Auto-save hook for data protection
  useAutoSave(isEditing, hotspots, timelineEvents, handleSave);

  const handleStartLearning = () => {
    setModuleState('learning');
    setExploredHotspotId(null);
    setExploredHotspotPanZoomActive(false);
    setActiveHotspotInfoId(null); 
    setCurrentStep(uniqueSortedSteps[0] || 1); 
  };

  const handleStartExploring = useCallback(() => {
    setModuleState('idle');
    setExploredHotspotId(null);
    setExploredHotspotPanZoomActive(false);
  }, []);

  const handleTimelineDotClick = useCallback((step: number) => {
    if (moduleState === 'idle' && !isEditing) {
        setModuleState('learning');
        setExploredHotspotId(null);
        setExploredHotspotPanZoomActive(false);
    }
    setCurrentStep(step);
  }, [moduleState, isEditing]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (backgroundImage && hotspots.length > 0) {
      const confirmReplace = confirm(
        `Replacing the image may affect hotspot positioning. You have ${hotspots.length} hotspot(s) that may need to be repositioned.\n\nDo you want to continue?`
      );
      if (!confirmReplace) return;
    }
    
    debugLog('Image', 'Image upload started', { fileName: file.name, fileSize: file.size });
    setImageLoading(true);

    try {
      const imageUrl = await appScriptProxy.uploadImage(file, projectId);
      setBackgroundImage(imageUrl);
      setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
      setEditingZoom(1);
      setImageLoading(false);
    } catch (error) {
      setImageLoading(false);
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }
  }, [backgroundImage, hotspots.length, projectId, debugLog]);

  const handlePrevStep = useCallback(() => {
    if (moduleState === 'learning') {
      const currentIndex = uniqueSortedSteps.indexOf(currentStep);
      if (currentIndex > 0) {
        setCurrentStep(uniqueSortedSteps[currentIndex - 1]);
      }
    }
  }, [currentStep, uniqueSortedSteps, moduleState]);

  const handleNextStep = useCallback(() => {
    if (moduleState === 'learning') {
      const currentIndex = uniqueSortedSteps.indexOf(currentStep);
      if (currentIndex < uniqueSortedSteps.length - 1) {
        setCurrentStep(uniqueSortedSteps[currentIndex + 1]);
      }
    }
  }, [currentStep, uniqueSortedSteps, moduleState]);

  const handleHotspotPositionChange = useCallback((hotspotId: string, x: number, y: number) => {
    setHotspots(prevHotspots => 
      prevHotspots.map(h => h.id === hotspotId ? { ...h, x, y } : h)
    );
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-200">
      {/* Debug toggle button */}
      {isEditing && (
        <button
          onClick={() => setDebugPositioning(!debugPositioning)}
          className="absolute top-4 right-16 z-50 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-75 hover:opacity-100"
          title="Toggle coordinate debug overlay"
        >
          Debug: {debugPositioning ? 'ON' : 'OFF'}
        </button>
      )}

      {/* Main layout */}
      <div className={isEditing ? 'fixed inset-0 z-50 bg-slate-900' : 'flex flex-col h-full'}>
        {isEditing ? (
          /* Full-Screen Editing Layout */
          <div className="flex h-screen">
            {/* Main Image Canvas Area */}
            <div className="flex-1 relative bg-slate-900">
              <div className="absolute inset-0">
                <div 
                  ref={scrollableContainerRef}
                  className="w-full h-full overflow-auto bg-slate-900"
                  style={{
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#475569 #1e293b',
                  }}
                >
                  <div
                    ref={imageContainerRef}
                    className="relative flex items-center justify-center min-w-full min-h-full"
                    style={{ cursor: backgroundImage && !pendingHotspot ? 'crosshair' : 'default' }}
                    onClick={handleImageClick}
                    role={backgroundImage ? "button" : undefined}
                    aria-label={backgroundImage ? "Image canvas for adding hotspots" : "Interactive image"}
                  >
                    {backgroundImage ? (
                      <>
                        <img
                          ref={actualImageRef}
                          src={backgroundImage}
                          onLoad={(e) => setImageNaturalDimensions({
                            width: e.currentTarget.naturalWidth,
                            height: e.currentTarget.naturalHeight
                          })}
                          className="max-w-full max-h-full object-contain"
                          style={{ zoom: editingZoom }}
                          alt="Interactive content"
                        />

                        {/* Hotspots in editing mode */}
                        {hotspots.map(hotspot => (
                          <MemoizedHotspotViewer
                            key={hotspot.id}
                            hotspot={hotspot}
                            isPulsing={pulsingHotspotId === hotspot.id}
                            isEditing={true}
                            onFocusRequest={() => setActiveHotspotInfoId(hotspot.id)}
                            onPositionChange={handleHotspotPositionChange}
                            imageElement={actualImageRef.current}
                            isDimmedInEditMode={true}
                          />
                        ))}

                        {/* Pending hotspot indicator */}
                        {pendingHotspot && (
                          <div
                            className="absolute w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-30"
                            style={{
                              left: `${pendingHotspot.x}px`,
                              top: `${pendingHotspot.y}px`
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <div className="text-center text-slate-400">
                        <FileUpload
                          onFileUpload={handleImageUpload}
                          isLoading={imageLoading}
                          disabled={!backgroundImage}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Debug overlay */}
              <DebugOverlay />
            </div>

            {/* Right sidebar for editing tools */}
            <div className="w-80 bg-slate-800 border-l border-slate-600 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-slate-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">Module Editor</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 ${
                        isSaving 
                          ? 'bg-green-500 cursor-not-allowed' 
                          : showSuccessMessage 
                            ? 'bg-green-500' 
                            : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinnerIcon className="w-4 h-4" />
                          <span>Saving...</span>
                        </>
                      ) : showSuccessMessage ? (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <span>Save</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Editing content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* File upload section */}
                {!backgroundImage && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-slate-200 mb-3">Add Background Image</h3>
                    <FileUpload
                      onFileUpload={handleImageUpload}
                      isLoading={imageLoading}
                      disabled={false}
                    />
                  </div>
                )}

                {/* Hotspot management */}
                {backgroundImage && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-slate-200 mb-3">Hotspots ({hotspots.length})</h3>
                    {hotspots.length === 0 ? (
                      <p className="text-slate-400 text-sm">Click on the image to add hotspots</p>
                    ) : (
                      <div className="space-y-2">
                        {hotspots.map(hotspot => (
                          <div
                            key={hotspot.id}
                            className="p-3 bg-slate-700 rounded-lg border border-slate-600"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-200">{hotspot.title}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setSelectedHotspotForModal(hotspot.id)}
                                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setHotspots(prev => prev.filter(h => h.id !== hotspot.id))}
                                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Position: {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Viewer Layout */
          <div className="flex flex-col h-full">
            {/* Image container - full width */}
            <div className="flex-1 relative bg-slate-900" style={{ zIndex: Z_INDEX.IMAGE_BASE }}>
              <div className="absolute inset-0">
                <div 
                  ref={imageContainerRef}
                  className="w-full h-full flex items-center justify-center bg-slate-900"
                  style={{ cursor: 'default' }}
                  onClick={handleImageClick}
                  role={backgroundImage ? "button" : undefined}
                  aria-label={backgroundImage ? "Interactive image" : undefined}
                >
                  {backgroundImage ? (
                    <>
                      {/* Hidden image for natural dimensions */}
                      <img
                        src={backgroundImage}
                        onLoad={(e) => setImageNaturalDimensions({
                          width: e.currentTarget.naturalWidth,
                          height: e.currentTarget.naturalHeight
                        })}
                        style={{ display: 'none' }}
                        alt=""
                        aria-hidden="true"
                      />
                      
                      {/* Scaled image div for viewer */}
                      <div 
                        ref={scaledImageDivRef}
                        className="relative"
                        style={{
                          backgroundImage: `url(${backgroundImage})`,
                          backgroundSize: imageFitMode,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          width: '80vw',
                          height: '80vh',
                          maxWidth: '1200px',
                          maxHeight: '800px',
                          transform: `scale(${imageTransform.scale}) translate(${imageTransform.translateX}px, ${imageTransform.translateY}px)`,
                          transformOrigin: 'center center',
                          transition: isTransforming ? 'transform 0.3s ease-out' : 'none'
                        }}
                      >
                        {/* Hotspots in viewer mode */}
                        {hotspots.map(hotspot => (
                          <MemoizedHotspotViewer
                            key={hotspot.id}
                            hotspot={hotspot}
                            isPulsing={pulsingHotspotId === hotspot.id}
                            isEditing={false}
                            onFocusRequest={() => setActiveHotspotInfoId(hotspot.id)}
                            isContinuouslyPulsing={moduleState === 'idle' && !exploredHotspotId}
                          />
                        ))}
                      </div>
                      
                      {/* Initial view buttons overlay when in idle mode */}
                      {moduleState === 'idle' && !isEditing && backgroundImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ zIndex: Z_INDEX.MODAL }}>
                          <div className="text-center space-y-6 p-8 bg-black/60 rounded-2xl border border-white/20 shadow-2xl max-w-md">
                            <div>
                              <h2 className="text-2xl font-bold text-white mb-2">Interactive Module Ready</h2>
                              <p className="text-slate-300 text-sm">Choose how you'd like to explore this content</p>
                            </div>
                            <div className="flex flex-col space-y-3">
                              <button
                                onClick={handleStartExploring}
                                className="flex-1 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-sky-500 hover:to-cyan-500 transition-all duration-200"
                              >
                                Explore Module
                              </button>
                              <button
                                onClick={handleStartLearning}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
                              >
                                Start Guided Tour
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-slate-400">
                      <h2 className="text-xl mb-4">No image loaded</h2>
                      <p>Switch to editing mode to add content</p>
                    </div>
                  )}
                </div>

                {/* Debug overlay */}
                <DebugOverlay />
              </div>
            </div>

            {/* Timeline */}
            {uniqueSortedSteps.length > 0 && (
              <div className="h-25 bg-slate-800 border-t border-slate-600" style={{ zIndex: Z_INDEX.TIMELINE }}>
                <HorizontalTimeline
                  steps={uniqueSortedSteps}
                  currentStep={currentStep}
                  onStepClick={handleTimelineDotClick}
                  onPrevStep={handlePrevStep}
                  onNextStep={handleNextStep}
                  canGoPrev={currentStepIndex > 0}
                  canGoNext={currentStepIndex < uniqueSortedSteps.length - 1}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedHotspotForModal && (
        <HotspotEditorModal
          isOpen={true}
          onClose={() => setSelectedHotspotForModal(null)}
          hotspot={hotspots.find(h => h.id === selectedHotspotForModal)!}
          onSave={(updatedHotspot) => {
            setHotspots(prev => prev.map(h => h.id === updatedHotspot.id ? updatedHotspot : h));
            setSelectedHotspotForModal(null);
          }}
          onDelete={(hotspotId) => {
            setHotspots(prev => prev.filter(h => h.id !== hotspotId));
            setSelectedHotspotForModal(null);
          }}
          timelineEvents={timelineEvents}
          onTimelineEventsChange={setTimelineEvents}
          editorMaxStep={editorMaxStep}
        />
      )}

      {pendingHotspot && (
        <StreamlinedHotspotEditor
          onConfirm={(hotspotData) => {
            const newHotspot: HotspotData = {
              id: `hotspot-${Date.now()}`,
              x: pendingHotspot.imageX,
              y: pendingHotspot.imageY,
              title: hotspotData.title,
              description: hotspotData.description,
              color: hotspotData.color,
              size: hotspotData.size
            };
            setHotspots(prev => [...prev, newHotspot]);
            setPendingHotspot(null);
          }}
          onCancel={() => setPendingHotspot(null)}
          position={{ 
            x: pendingHotspot.x, 
            y: pendingHotspot.y 
          }}
        />
      )}
    </div>
  );
};

export default InteractiveModule;