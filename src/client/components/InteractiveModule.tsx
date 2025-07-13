import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { InteractiveModuleState, HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import FileUpload from './FileUpload';
import HorizontalTimeline from './HorizontalTimeline';
import HotspotEditorModal from './HotspotEditorModal'; // This will be the single source of truth
import MobileEditorModal from './MobileEditorModal';
import EditorToolbar, { COLOR_SCHEMES } from './EditorToolbar';
import ViewerToolbar from './ViewerToolbar';
import { PlusIcon } from './icons/PlusIcon'; // Already imported
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import MobileEditorTabs, { MobileEditorActiveTab } from './MobileEditorTabs';
import MobileHotspotEditor from './MobileHotspotEditor';
import MobileEditorLayout from './MobileEditorLayout';
import ImageEditCanvas from './ImageEditCanvas';
import LoadingSpinnerIcon from './icons/LoadingSpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import { Z_INDEX, INTERACTION_DEFAULTS, ZOOM_LIMITS } from '../constants/interactionConstants';
import ReactDOM from 'react-dom';
import { appScriptProxy } from '../../lib/firebaseProxy';
import MediaModal from './MediaModal';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import ImageViewer from './ImageViewer';
import YouTubePlayer from './YouTubePlayer';

// Helper function to extract YouTube Video ID from various URL formats
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  // Regular expression to cover various YouTube URL formats
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
};

import HotspotViewer from './HotspotViewer';

// Using default memo export from HotspotViewer

// Error boundary for positioning failures
const safeGetPosition = <T extends any>(
  fn: () => T | null,
  fallback: T
): T => {
  try {
    const result = fn();
    // Ensure that if fn() returns null, the fallback is used.
    // Also handles cases where fn() might return other falsy values if not strictly T | null
    return result === null || result === undefined ? fallback : result;
  } catch (error) {
    console.error('Position calculation error:', error);
    return fallback;
  }
};

// Safe DOM access utilities
const getSafeContainerRect = (
  elementRef: React.RefObject<HTMLElement>,
  fallback: DOMRect = {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0
  } as DOMRect
): DOMRect => {
  return safeGetPosition(
    () => {
      const element = elementRef.current;
      if (!element) return null;
      return element.getBoundingClientRect();
    },
    fallback
  );
};

const getSafeElementBounds = (
  elementRef: React.RefObject<HTMLElement>,
  fallback: { width: number; height: number; left: number; top: number } = {
    width: 0,
    height: 0,
    left: 0,
    top: 0
  }
) => {
  return safeGetPosition(
    () => {
      const element = elementRef.current;
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      };
    },
    fallback
  );
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
      // Clear any existing timeout that would execute the last call
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return func(...args);
    } else {
      // If a timeout is already set, clear it to reset the timer with the new call
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Set a new timeout to execute after the remaining delay
      timeoutId = window.setTimeout(() => {
        lastExecTime = Date.now();
        func(...args);
        timeoutId = null; // Clear the timeoutId after execution
      }, delay - timeSinceLastExec);
    }
  }) as T;
};

interface InteractiveModuleProps {
  initialData: InteractiveModuleState;
  isEditing: boolean;
  onSave: (data: InteractiveModuleState) => void;
  onClose?: (callback?: () => void) => void; // Modified onClose
  projectName: string;
  projectId?: string;
  // Shared viewer props
  isSharedView?: boolean;
  theme?: 'light' | 'dark';
  autoStart?: boolean;
  onReloadRequest?: () => void; // Prop for custom reload handling
}

interface ImageTransformState {
  scale: number;
  translateX: number;
  translateY: number;
  targetHotspotId?: string; 
}


const InteractiveModule: React.FC<InteractiveModuleProps> = ({ 
  initialData, 
  isEditing, 
  onSave, 
  onClose, 
  projectName, 
  projectId,
  isSharedView = false,
  theme = 'dark',
  autoStart = false,
  onReloadRequest
}) => {

  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(initialData.backgroundImage);
  const [hotspots, setHotspots] = useState<HotspotData[]>(initialData.hotspots || []);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>(initialData.timelineEvents || []);
  
  const [moduleState, setModuleState] = useState<'idle' | 'learning'>(isEditing ? 'learning' : 'idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [imageLoading, setImageLoading] = useState(false);
  const [positionCalculating, setPositionCalculating] = useState(false);
  const [isModeSwitching, setIsModeSwitching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  
  // New state for enhanced features
  const [isTimedMode, setIsTimedMode] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<string>('Default');
  const [autoProgressionDuration, setAutoProgressionDuration] = useState<number>(3000);
  const [editingHotspot, setEditingHotspot] = useState<HotspotData | null>(null);
  
  // Missing state declaration for imageContainerRect
  const [imageContainerRect, setImageContainerRect] = useState<DOMRect | null>(null);
  
  // Save state management
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  // Error tracking for temporal dead zone detection
  const [errorLog, setErrorLog] = useState<Array<{ timestamp: number; error: string; context: string }>>([]);
  const errorLogRef = useRef<Array<{ timestamp: number; error: string; context: string }>>([]);

  // All timeout refs - consolidated at top to avoid temporal dead zone issues
  const successMessageTimeoutRef = useRef<number | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const applyTransformTimeoutRef = useRef<number | null>(null);
  const debouncedApplyTransformTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const initTimeoutRef = useRef<number | null>(null);
  const stateChangeTimeoutRef = useRef<number | null>(null);
  const saveAnimationTimeoutRef = useRef<number | null>(null);

  // Transform and bounds refs - also at top to avoid temporal dead zone issues  
  const isApplyingTransformRef = useRef(false);
  const lastAppliedTransformRef = useRef<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const originalImageBoundsRef = useRef<{width: number, height: number, left: number, top: number, absoluteLeft: number, absoluteTop: number} | null>(null);

  const [isPlacingHotspot, setIsPlacingHotspot] = useState<boolean>(false); // For click-to-place new hotspots

  const isMobile = useIsMobile();
  const [activeMobileEditorTab, setActiveMobileEditorTab] = useState<MobileEditorActiveTab>('properties');
  const mobileEditorPanelRef = useRef<HTMLDivElement>(null); // Ref for Agent 4
  
  // Image display state
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain' | 'fill'>(initialData.imageFitMode || 'cover');
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>(initialData.backgroundType || 'image');
  const [backgroundVideoType, setBackgroundVideoType] = useState<'youtube' | 'mp4'>(initialData.backgroundVideoType || 'mp4');
  
  const [activeHotspotDisplayIds, setActiveHotspotDisplayIds] = useState<Set<string>>(new Set()); // Hotspots to *render* (dots)
  const [pulsingHotspotId, setPulsingHotspotId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  
  // Track when any hotspot is being dragged - using isDragModeActive instead
  const [isDragModeActive, setIsDragModeActive] = useState(false);
  const [isHotspotDragging, setIsHotspotDragging] = useState(false);
  
  
  // For the Hotspot Editor Modal
  const [isHotspotModalOpen, setIsHotspotModalOpen] = useState<boolean>(false);
  const [selectedHotspotForModal, setSelectedHotspotForModal] = useState<string | null>(null);

  // Media modal states
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    type: 'video' | 'audio' | 'image' | 'youtube' | null;
    title: string;
    data: any;
  }>({
    isOpen: false,
    type: null,
    title: '',
    data: null
  });

  const imageContainerRef = useRef<HTMLDivElement>(null); // General container for image area
  const scrollableContainerRef = useRef<HTMLDivElement>(null); // Ref for the outer scrollable container (editor)
  const scaledImageDivRef = useRef<HTMLDivElement>(null); // Ref for the div with background image (viewer)
  
  // Refs for Agent 4 (Touch Handling) - As per AGENTS.md
  const viewerImageContainerRef = useRef<HTMLDivElement>(null); // Specifically for mobile viewer image area
  const viewerTimelineRef = useRef<HTMLDivElement>(null); // Specifically for mobile viewer timeline area

  // New refs for the img-based system (editing mode only)
  const zoomedImageContainerRef = useRef<HTMLDivElement>(null);
  const actualImageRef = useRef<HTMLImageElement>(null);

  const [imageTransform, setImageTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const [isTransforming, setIsTransforming] = useState(false);
  
  // TEMPORARY: Log imageTransform changes
  useEffect(() => {
    console.log('🔍 PREVIEW DEBUG: imageTransform state changed', imageTransform);
  }, [imageTransform]);
  
  // New state for editing mode
  const [editingZoom, setEditingZoom] = useState<number>(1); // Only for editing mode
  // Already exists for editor mode, ensure it's used in viewer mode too
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number, height: number} | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  
  // Preview overlay state for visual editing
  const [previewOverlayEvent, setPreviewOverlayEvent] = useState<TimelineEventData | null>(null);
  
  // TEMPORARY: Log state changes
  useEffect(() => {
    console.log('🔍 PREVIEW DEBUG: highlightedHotspotId state changed', highlightedHotspotId);
  }, [highlightedHotspotId]);
  
  useEffect(() => {
    console.log('🔍 PREVIEW DEBUG: previewOverlayEvent state changed', previewOverlayEvent ? { id: previewOverlayEvent.id, type: previewOverlayEvent.type } : null);
  }, [previewOverlayEvent]);

  // Comprehensive error boundary function
  const logError = useCallback((error: Error | string, context: string) => {
    const errorEntry = {
      timestamp: Date.now(),
      error: typeof error === 'string' ? error : error.message,
      context
    };

    // Log to console for debugging
    console.error(`[InteractiveModule] ${context}:`, error);

    // Add to error log (keep only last 10 errors)
    errorLogRef.current = [...errorLogRef.current.slice(-9), errorEntry];
    setErrorLog(errorLogRef.current);
  }, []);

  // Enhanced safe execution wrapper with error tracking
  const safeExecuteWithLogging = useCallback(<T,>(
    operation: () => T,
    fallback: T,
    context: string
  ): T => {
    try {
      const result = operation();
      if (result === null || result === undefined) {
        logError(`Operation returned null/undefined`, context);
        return fallback;
      }
      return result;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), context);
      return fallback;
    }
  }, [logError]);

  // Function initialization validator
  const validateFunctionInitialization = useCallback((functionName: string, fn: any) => {
    if (typeof fn !== 'function') {
      logError(`Function ${functionName} is not initialized or not a function`, 'Function Validation');
      return false;
    }
    return true;
  }, [logError]);

  // Comprehensive cleanup function for all async operations
  const clearAllTimeouts = useCallback(() => {
    const timeoutRefs = [
      successMessageTimeoutRef,
      pulseTimeoutRef,
      applyTransformTimeoutRef,
      debouncedApplyTransformTimeoutRef,
      closeTimeoutRef,
      animationTimeoutRef,
      initTimeoutRef,
      stateChangeTimeoutRef,
      saveAnimationTimeoutRef
    ];

    timeoutRefs.forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, []);

  const uniqueSortedSteps = useMemo(() => {
    if (timelineEvents.length === 0) return isEditing ? [1] : [];
    const steps = [...new Set(timelineEvents.map(e => e.step))].sort((a, b) => a - b);
    return steps.length > 0 ? steps : (isEditing ? [1] : []);
  }, [timelineEvents, isEditing]);
  
  const getImageClassName = useCallback(() => {
    const baseClasses = "block select-none";

    if (isMobile) {
      return `${baseClasses} max-w-full max-h-full object-contain`;
    } else {
      // Desktop classes depend on fit mode
      if (imageFitMode === 'contain') {
        return `${baseClasses} max-w-full max-h-full object-contain`;
      } else if (imageFitMode === 'cover') {
        return `${baseClasses} min-w-full min-h-full object-cover`;
      } else { // fill
        return `${baseClasses} w-full h-full object-fill`;
      }
    }
  }, [isMobile, imageFitMode]);

  const getImageStyle = useCallback(() => {
    if (isMobile) {
      // Mobile always uses contain-like behavior
      return {};
    } else {
      // Desktop might need specific dimensions based on mode
      if (imageFitMode === 'contain') {
        return {};
      } else if (imageFitMode === 'cover') {
        return {};
      } else { // fill
        return { width: '100%', height: '100%' };
      }
    }
  }, [isMobile, imageFitMode]);

  const getImageBounds = useCallback(() => {
    if (!imageContainerRef.current || !backgroundImage || !actualImageRef.current) {
      return null;
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const imgRect = actualImageRef.current.getBoundingClientRect();
    
    // The img element gives us the exact bounds of the rendered image
    // This works for both editor and viewer modes now
    return {
      width: imgRect.width,
      height: imgRect.height,
      left: imgRect.left - containerRect.left,
      top: imgRect.top - containerRect.top,
      absoluteLeft: imgRect.left,
      absoluteTop: imgRect.top
    };
  }, [backgroundImage]);

  const getSafeImageBounds = useCallback(() => {
    return safeGetPosition(() => getImageBounds(), null); // Fallback is null as per original getImageBounds
  }, [getImageBounds]);

  // Calculate optimal image scale when editor panel state changes
  const calculateOptimalImageScale = useCallback((
    currentScale: number,
    currentTranslateX: number,
    currentTranslateY: number,
    panelIsOpening: boolean
  ) => {
    if (isMobile) {
      // Mobile doesn't need scale adjustments for panel changes
      return { scale: currentScale, translateX: currentTranslateX, translateY: currentTranslateY };
    }

    const imageBounds = getSafeImageBounds();
    
    if (!imageBounds || !imageContainerRef.current) {
      return { scale: currentScale, translateX: currentTranslateX, translateY: currentTranslateY };
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const scaledImageWidth = imageBounds.width * currentScale;
    const scaledImageHeight = imageBounds.height * currentScale;
    
    // Check if current scaled image fits in the new container dimensions
    const fitsWidth = scaledImageWidth <= containerRect.width;
    const fitsHeight = scaledImageHeight <= containerRect.height;
    
    if (panelIsOpening && (!fitsWidth || !fitsHeight)) {
      // Panel is opening and image doesn't fit - scale down to fit
      const widthRatio = containerRect.width / imageBounds.width;
      const heightRatio = containerRect.height / imageBounds.height;
      const optimalScale = Math.min(widthRatio, heightRatio, currentScale); // Don't scale up
      
      // Reset translation to center when scaling down significantly
      const scaleReduction = optimalScale / currentScale;
      if (scaleReduction < 0.8) {
        return {
          scale: optimalScale,
          translateX: 0,
          translateY: 0
        };
      } else {
        // Proportionally adjust translation
        return {
          scale: optimalScale,
          translateX: currentTranslateX * scaleReduction,
          translateY: currentTranslateY * scaleReduction
        };
      }
    } else if (!panelIsOpening && currentScale < 1) {
      // Panel is closing and we're zoomed out - potentially restore scale
      const widthRatio = containerRect.width / imageBounds.width;
      const heightRatio = containerRect.height / imageBounds.height;
      const maxFitScale = Math.min(widthRatio, heightRatio);
      
      // Restore to fit scale or 1.0, whichever is smaller
      const restoredScale = Math.min(1, maxFitScale);
      if (restoredScale > currentScale) {
        return {
          scale: restoredScale,
          translateX: 0,
          translateY: 0
        };
      }
    }
    
    // No scaling needed - return current values
    return { scale: currentScale, translateX: currentTranslateX, translateY: currentTranslateY };
  }, [isMobile, getSafeImageBounds]);
  
  // Handle preview overlay updates
  const handlePreviewOverlayUpdate = useCallback((updatedEvent: TimelineEventData) => {
    console.log('🔍 PREVIEW DEBUG: handlePreviewOverlayUpdate called', { 
      eventId: updatedEvent.id, 
      type: updatedEvent.type 
    });
    
    // Check if the event actually changed to prevent infinite loops
    const currentEvent = timelineEvents.find(e => e.id === updatedEvent.id);
    const currentPreview = previewOverlayEvent;
    
    // Only update if there are actual changes
    let hasTimelineChanges = false;
    let hasPreviewChanges = false;
    
    if (currentEvent) {
      // Check for meaningful changes in the timeline event
      const eventChanged = JSON.stringify(currentEvent) !== JSON.stringify(updatedEvent);
      if (eventChanged) {
        hasTimelineChanges = true;
      }
    }
    
    if (currentPreview && currentPreview.id === updatedEvent.id) {
      // Check for meaningful changes in the preview event
      const previewChanged = JSON.stringify(currentPreview) !== JSON.stringify(updatedEvent);
      if (previewChanged) {
        hasPreviewChanges = true;
      }
    } else if (!currentPreview) {
      // No current preview, this is a new one
      hasPreviewChanges = true;
    }
    
    // Only update state if there are actual changes
    if (hasTimelineChanges) {
      setTimelineEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    }
    
    if (hasPreviewChanges) {
      setPreviewOverlayEvent(updatedEvent);
    }
  }, [timelineEvents, previewOverlayEvent]);

  // Touch gesture handling
  const touchGestureHandlers = useTouchGestures(
    isEditing ? imageContainerRef : viewerImageContainerRef,
    imageTransform,
    setImageTransform,
    setIsTransforming,
    {
      minScale: 0.5,
      maxScale: 5.0,
      doubleTapZoomFactor: 2.0,
      isDragging: isDragModeActive,
      isEditing: isEditing,
      isDragActive: isDragModeActive, // Add missing isDragActive parameter
    }
  );

  const batchedSetState = useCallback((updates: Array<() => void>) => {
    ReactDOM.unstable_batchedUpdates(() => {
      updates.forEach(update => update());
    });
  }, []);

  // Debug mode for development
  const [debugMode] = useState(() => import.meta.env.DEV && localStorage.getItem('debug_positioning') === 'true');

  const debugLog = useCallback((category: string, message: string, data?: any) => {
    if (!debugMode) return;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${category}] ${message}`;

    console.log(logEntry, data !== undefined ? data : '');

    try {
      const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
      logs.push({ timestamp, category, message, data: data !== undefined ? data : null });
      if (logs.length > 100) logs.shift(); // Keep last 100 entries
      sessionStorage.setItem('debug_logs', JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to write to sessionStorage for debug logs:", error);
    }
  }, [debugMode]);



  const throttledRecalculatePositions = useMemo(
    () => throttle(() => {
      if (imageContainerRef.current) {
        setImageContainerRect(imageContainerRef.current.getBoundingClientRect());
        // Potentially other position-dependent logic could be called here if needed.
      }
    }, 100), // 100ms delay
    [setImageContainerRect] // Include setImageContainerRect to prevent closure issues
  );

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

  // Helper to clear cached bounds when needed
  const clearImageBoundsCache = useCallback(() => {
    originalImageBoundsRef.current = null;
    debugLog('Cache', 'Cleared image bounds cache');
  }, [debugLog]);


  // Helper to show media modals
  const showMediaModal = useCallback((
    type: 'video' | 'audio' | 'image' | 'youtube',
    title: string,
    data: any
  ) => {
    setMediaModal({
      isOpen: true,
      type,
      title,
      data
    });
  }, []);

  const closeMediaModal = useCallback(() => {
    setMediaModal({
      isOpen: false,
      type: null,
      title: '',
      data: null
    });
  }, []);

  // Helper to get viewport center for centering operations
  const getViewportCenter = useCallback(() => {
    if (!imageContainerRef.current) return null;

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    // In viewer mode, account for timeline at bottom
    const timelineHeight = !isEditing && uniqueSortedSteps.length > 0 ? 100 : 0;

    return {
      centerX: containerRect.width / 2,
      centerY: (containerRect.height - timelineHeight) / 2
    };
  }, [isEditing, uniqueSortedSteps.length]);

  const getSafeViewportCenter = useCallback(() => {
    return safeGetPosition(
      () => getViewportCenter(),
      { centerX: 400, centerY: 300 } // Fallback to a default center object
    );
  }, [getViewportCenter]);

  // Helper to convert hotspot percentage to absolute pixel coordinates using unified positioning
  const getHotspotPixelPosition = useCallback((hotspot: HotspotData, transform?: ImageTransformState) => {
    const imageBounds = getSafeImageBounds(); // Common for both, but interpretation differs.
                                          // For viewer, imageBounds.width/height IS contentWidth/Height.
                                          // For editor, it's also contentWidth/Height of the <img>.
    if (!imageNaturalDimensions || !imageBounds || imageBounds.width === 0 || imageBounds.height === 0) return null;

    // Add debug logging
    const debugMode = localStorage.getItem('debug_positioning') === 'true';
    if (!isEditing && debugMode) {
      console.log('Hotspot positioning debug:', {
        hotspotId: hotspot.id,
        hotspotPercentages: { x: hotspot.x, y: hotspot.y },
        imageBounds
      });
    }

    if (!isEditing) {
      // VIEWER MODE:
      // The `imageBounds` from `getSafeImageBounds` already gives us the visual size and position
      // of the image content within the main container. We can use this directly.

      // Calculate hotspot's pixel position relative to the image's content area (imageBounds)
      const hotspotX_on_image = (hotspot.x / 100) * imageBounds.width;
      const hotspotY_on_image = (hotspot.y / 100) * imageBounds.height;

      // The final position for the hotspot div should be relative to the `scaledImageDivRef`,
      // which is the parent of the hotspots. `imageBounds.left` and `imageBounds.top` are the offsets
      // of the visible image content from the top-left of the `scaledImageDivRef`.
      const finalX = imageBounds.left + hotspotX_on_image;
      const finalY = imageBounds.top + hotspotY_on_image;

      // The baseX/Y for centering calculations needs to be relative to the overall imageContainerRef,
      // which is what imageBounds (from getSafeImageBounds) provides.
      const baseXForCentering = imageBounds.left + (hotspot.x / 100) * imageBounds.width;
      const baseYForCentering = imageBounds.top + (hotspot.y / 100) * imageBounds.height;

      return {
        x: finalX,
        y: finalY,
        baseX: baseXForCentering, // Used for PAN_ZOOM_TO_HOTSPOT calculations
        baseY: baseYForCentering, // Used for PAN_ZOOM_TO_HOTSPOT calculations
      };

    } else {
      // EDITOR MODE (existing logic, potentially simplified or reviewed if issues arise)
      // The current editor logic seems to work, so we keep it but acknowledge it might be complex.
      // It uses imageBounds (which for editor is from the <img> tag) and applies transforms.
      // This might be calculating final screen positions, which HotspotViewer in editor mode might handle differently.

      const currentTransform = transform || lastAppliedTransformRef.current; // This is likely viewer's transform, not editor's zoom.
                                                                          // Editor's `editingZoom` is applied via CSS scale on `zoomedImageContainerRef`.
                                                                          // `HotspotViewer` in editor uses `dragContainerRef={zoomedImageContainerRef}`.

      // Calculate base position on the image content (imageBounds.width/height is content width/height from <img>)
      const baseX = (hotspot.x / 100) * imageBounds.width;
      const baseY = (hotspot.y / 100) * imageBounds.height;

      // Position relative to image bounds origin (imageBounds.left/top are relative to scrollableContainerRef)
      let positionX = imageBounds.left + baseX;
      let positionY = imageBounds.top + baseY;

      // Get container dimensions for transform origin calculations (Editor specific)
      let editorContainerDimensions = null;
      if (zoomedImageContainerRef.current) { // Use the container that is actually scaled in editor
        const rect = zoomedImageContainerRef.current.getBoundingClientRect();
         // The `editingZoom` is applied to `zoomedImageContainerRef`.
         // `HotspotViewer` instances are children of this.
         // Their `left`/`top` CSS will be relative to this `zoomedImageContainerRef`.
         // So, `pixelPosition` for editor should be `baseX, baseY` (relative to the <img> content),
         // and `actualImageRef` is a direct child of `zoomedImageContainerRef`.
         // The `imageBounds.left/top` for editor are offsets of `<img>` content within `scrollableContainerRef`.
         // This suggests the editor's `pixelPosition` might be best calculated within `ImageEditCanvas`
         // or this path needs significant rework to be relative to `zoomedImageContainerRef`.
         // Given editor works, we assume its `HotspotViewer`'s drag/placement logic overrides initial render if needed.

         // For now, returning values that are relative to the image content itself,
         // assuming the `editingZoom` scale on `zoomedImageContainerRef` handles it.
         // The `imageBounds.left/top` are offsets of the image *within the scrollable container*,
         // not within the `zoomedImageContainerRef`.
         // If `actualImageRef` is at (0,0) within `zoomedImageContainerRef`, then (baseX, baseY) is correct.
         // This is true because `actualImageRef` style doesn't have explicit positioning offsets.
        return {
             x: baseX,
             y: baseY,
             baseX: imageBounds.left + baseX, // Still provide this for other potential uses if needed
             baseY: imageBounds.top + baseY
        };
      }

      // If the primary `zoomedImageContainerRef` is not available, we cannot reliably calculate
      // the hotspot position in editor mode. The old fallback logic is complex and
      // likely misaligned with the current architecture. Returning null is safer.
      return null;
    }
  }, [isEditing, getSafeImageBounds, imageNaturalDimensions, imageFitMode, lastAppliedTransformRef, zoomedImageContainerRef, imageContainerRef]);


  // Helper to constrain transforms and prevent UI overlap
  const constrainTransform = useCallback((transform: ImageTransformState): ImageTransformState => {
    const imageBounds = getSafeImageBounds();
    const viewportCenter = getSafeViewportCenter();

    if (!imageBounds || !viewportCenter || !imageContainerRef.current) {
      return transform;
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();

    // Calculate the scaled image dimensions using imageBounds for content size
    const scaledWidth = imageBounds.width * transform.scale;
    const scaledHeight = imageBounds.height * transform.scale;

    // Reserve space for UI elements
    const timelineHeight = !isEditing && uniqueSortedSteps.length > 0 ? 100 : 0;
    // Calculate editor panel width based on HotspotEditorModal state
    const editorPanelWidth = isHotspotModalOpen ? 384 : 0; // HotspotEditorModal is 384px wide
    const sidebarWidth = 0; // No sidebar anymore - removed

    // This is the available visual area for the image content
    const availableWidth = containerRect.width - sidebarWidth - editorPanelWidth;
    const availableHeight = containerRect.height - timelineHeight;

    // Allow the image to move but keep at least 20% of its own scaled dimension visible
    const minVisibleImagePartWidth = scaledWidth * 0.2;
    const minVisibleImagePartHeight = scaledHeight * 0.2;

    // Translation limits for transform.translateX and transform.translateY
    const minTranslateX = -scaledWidth + minVisibleImagePartWidth;
    const maxTranslateX = availableWidth - minVisibleImagePartWidth;

    const minTranslateY = -scaledHeight + minVisibleImagePartHeight;
    const maxTranslateY = availableHeight - minVisibleImagePartHeight;

    // Apply constraints
    const constrainedTx = Math.max(minTranslateX, Math.min(maxTranslateX, transform.translateX));
    const constrainedTy = Math.max(minTranslateY, Math.min(maxTranslateY, transform.translateY));

    const constrainedTransform = {
      ...transform,
      translateX: constrainedTx,
      translateY: constrainedTy,
    };

    return constrainedTransform;
  }, [getSafeImageBounds, getSafeViewportCenter, isEditing, uniqueSortedSteps.length]);

  const applyTransform = useCallback((newTransform: ImageTransformState) => {
    // Enhanced safety checks to prevent temporal dead zone issues
    if (!newTransform || typeof newTransform.scale !== 'number') {
      console.warn('applyTransform: Invalid transform data provided', newTransform);
      return;
    }

    debugLog('Transform', 'Applying new transform', newTransform);
    
    // Clear any existing timeout to prevent race conditions
    if (applyTransformTimeoutRef.current) {
      clearTimeout(applyTransformTimeoutRef.current);
      applyTransformTimeoutRef.current = null;
    }
    
    try {
      // Update refs first for consistency
      isApplyingTransformRef.current = true;
      lastAppliedTransformRef.current = newTransform;
      
      // Update state
      setIsTransforming(true);
      setImageTransform(newTransform);

      // Reset flags after animation completes with enhanced cleanup
      applyTransformTimeoutRef.current = window.setTimeout(() => {
        try {
          setIsTransforming(false);
          isApplyingTransformRef.current = false;
          applyTransformTimeoutRef.current = null;
        } catch (error) {
          console.error('Error in applyTransform timeout cleanup:', error);
          // Ensure refs are reset even if state updates fail
          isApplyingTransformRef.current = false;
          applyTransformTimeoutRef.current = null;
        }
      }, 500);
    } catch (error) {
      console.error('Error in applyTransform:', error);
      // Ensure refs are reset in case of error
      isApplyingTransformRef.current = false;
      if (applyTransformTimeoutRef.current) {
        clearTimeout(applyTransformTimeoutRef.current);
        applyTransformTimeoutRef.current = null;
      }
    }
  }, [debugLog]);

  // Debounced version of applyTransform for performance optimization
  const debouncedApplyTransform = useMemo(
    () => {
      return (newTransform: ImageTransformState) => {
        if (debouncedApplyTransformTimeoutRef.current) {
          clearTimeout(debouncedApplyTransformTimeoutRef.current);
        }
        debouncedApplyTransformTimeoutRef.current = window.setTimeout(() => {
          applyTransform(newTransform);
        }, 16); // ~60fps
      };
    },
    [applyTransform] // Now safely referenced
  );

  // Memoized hotspot positions that update with explicit transform changes
  const hotspotsWithPositions = useMemo(() => {
    // Add safety checks to prevent temporal dead zone issues
    if (!hotspots || !Array.isArray(hotspots) || !getHotspotPixelPosition) {
      return [];
    }
    
    const currentTransform = lastAppliedTransformRef.current || { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
    return hotspots.map(hotspot => ({
      ...hotspot,
      pixelPosition: getHotspotPixelPosition(hotspot, currentTransform)
    }));
  }, [hotspots, getHotspotPixelPosition, imageTransform]); // Keep imageTransform to trigger updates

  const handleCenter = useCallback(() => {
    const container = scrollableContainerRef.current;
    if (!container || !actualImageRef.current) return; // Ensure actualImageRef.current also exists for safety

    // Check if there is an active transform targeting a hotspot
    if (imageTransform.targetHotspotId && imageTransform.scale > 1) {
      const targetHotspot = hotspots.find(h => h.id === imageTransform.targetHotspotId);

      if (targetHotspot) {
        // Calculate base hotspot position on the unzoomed image (1x scale of actualImageRef content)
        const hotspotXBase = (targetHotspot.x / 100) * actualImageRef.current.width;
        const hotspotYBase = (targetHotspot.y / 100) * actualImageRef.current.height;

        // Apply the editor's own canvas zoom (`editingZoom`) to this base position
        const hotspotXEditorZoomed = hotspotXBase * editingZoom;
        const hotspotYEditorZoomed = hotspotYBase * editingZoom;

        // Scroll the container to center this editor-zoomed hotspot position
        container.scrollLeft = Math.max(0, hotspotXEditorZoomed - (container.clientWidth / 2));
        container.scrollTop = Math.max(0, hotspotYEditorZoomed - (container.clientHeight / 2));

        return; // Centering handled for transformed hotspot
      }
    }

    // Default centering logic: center the entire (potentially editor-zoomed) image content
    const imageContentWidth = actualImageRef.current.width * editingZoom;
    const imageContentHeight = actualImageRef.current.height * editingZoom;

    container.scrollLeft = Math.max(0, (imageContentWidth - container.clientWidth) / 2);
    container.scrollTop = Math.max(0, (imageContentHeight - container.clientHeight) / 2);
  }, [editingZoom, imageTransform, hotspots]); // Dependencies as specified in the issue

  const [exploredHotspotId, setExploredHotspotId] = useState<string | null>(null);
  const [exploredHotspotPanZoomActive, setExploredHotspotPanZoomActive] = useState<boolean>(false);
  
  // Interaction parameter states

  // Define wheel zoom handler before the useEffect that uses it
  const handleWheelZoom = useCallback((event: WheelEvent) => {
    if (!event.ctrlKey || !isEditing) return;
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    const container = scrollableContainerRef.current;
    const imageContainer = zoomedImageContainerRef.current;
    if (!container || !imageContainer) return;

    // Get mouse position relative to the scroll container
    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;
    
    // Calculate current scroll position
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    
    // Calculate mouse position in the scrollable content
    const contentMouseX = mouseX + scrollLeft;
    const contentMouseY = mouseY + scrollTop;
    
    // Calculate new zoom level (5% increments)
    const delta = Math.sign(event.deltaY);
    const zoomIncrement = 0.05; // 5%
    const newZoom = Math.max(0.25, Math.min(5, editingZoom + (-delta * zoomIncrement)));
    
    if (newZoom !== editingZoom) {
      // Calculate the zoom ratio
      const zoomRatio = newZoom / editingZoom;
      
      // Calculate new scroll position to keep mouse position stable
      const newScrollLeft = contentMouseX * zoomRatio - mouseX;
      const newScrollTop = contentMouseY * zoomRatio - mouseY;
      
      setEditingZoom(newZoom);
      
      // Apply new scroll position after zoom
      requestAnimationFrame(() => {
        container.scrollLeft = Math.max(0, newScrollLeft);
        container.scrollTop = Math.max(0, newScrollTop);
      });
    }
  }, [editingZoom, isEditing]);

  // New image load handler for editing mode
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const newDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
    setImageNaturalDimensions(newDimensions);
    debugLog('Image', 'Image loaded successfully', newDimensions);
    setImageLoading(false);
    setPositionCalculating(true);
    // Clear any existing initialization timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    initTimeoutRef.current = window.setTimeout(() => {
      if (imageContainerRef.current) {
        setImageContainerRect(imageContainerRef.current.getBoundingClientRect());
      }
      setPositionCalculating(false);
      initTimeoutRef.current = null;
    }, 0);
  }, [debugLog]);


  // New zoom handler functions for editing mode
  const handleZoomIn = useCallback(() => {
    setEditingZoom(prev => Math.min(5, prev + 0.05));
  }, []);

  const handleZoomOut = useCallback(() => {
    setEditingZoom(prev => Math.max(0.25, prev - 0.05));
  }, []);

  const handleZoomReset = useCallback(() => {
    setEditingZoom(1);
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollLeft = 0;
      scrollableContainerRef.current.scrollTop = 0;
    }
  }, []);

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

  // Keyboard shortcut handlers
  const handleArrowLeftKey = useCallback((): boolean => {
    if (moduleState === 'learning') {
      handlePrevStep();
      return true;
    }
    return false;
  }, [moduleState, handlePrevStep]);

  const handleArrowRightKey = useCallback((): boolean => {
    if (moduleState === 'learning') {
      handleNextStep();
      return true;
    }
    return false;
  }, [moduleState, handleNextStep]);

  const handleEscapeKey = useCallback((): boolean => {
    if (isPlacingHotspot) {
      setIsPlacingHotspot(false);
      console.log("Hotspot placement cancelled via Escape key.");
      return true; // Indicate event was handled
    }
    if (imageTransform.scale > 1 || imageTransform.translateX !== 0 || imageTransform.translateY !== 0) {
      setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
      return true;
    } else if (isHotspotModalOpen) {
      setIsHotspotModalOpen(false); // Close the main editor modal
      setSelectedHotspotForModal(null); // Clear selection for the main editor modal
      // It's generally good practice to also ensure editingHotspot is cleared if this modal was tied to it,
      // though current logic might primarily use selectedHotspotForModal for this specific modal instance.
      // If editingHotspot directly controls this modal's visibility/content, uncommenting the line below would be safer.
      // setEditingHotspot(null);
      return true;
    }
    return false;
  }, [isPlacingHotspot, imageTransform, isHotspotModalOpen, setIsPlacingHotspot, setSelectedHotspotForModal, setIsHotspotModalOpen]);

  const handlePlusKey = useCallback((e: KeyboardEvent): boolean => {
    if (isEditing && (e.ctrlKey || e.metaKey)) {
      handleZoomIn();
      return true;
    }
    return false;
  }, [isEditing, handleZoomIn]);

  const handleMinusKey = useCallback((e: KeyboardEvent): boolean => {
    if (isEditing && (e.ctrlKey || e.metaKey)) {
      handleZoomOut();
      return true;
    }
    return false;
  }, [isEditing, handleZoomOut]);

  const handleZeroKey = useCallback((e: KeyboardEvent): boolean => {
    if (isEditing && (e.ctrlKey || e.metaKey)) {
      handleZoomReset();
      return true;
    }
    return false;
  }, [isEditing, handleZoomReset]);

  // Create stable keyboard handler reference to prevent TDZ issues
  const stableKeyboardHandlers = useMemo(() => ({
    handleArrowLeftKey,
    handleArrowRightKey,
    handleEscapeKey,
    handlePlusKey,
    handleMinusKey,
    handleZeroKey
  }), [
    handleArrowLeftKey,
    handleArrowRightKey,
    handleEscapeKey,
    handlePlusKey,
    handleMinusKey,
    handleZeroKey
  ]);

  // REMOVED: Old event execution system replaced with preview overlays
  // The eye icon preview now shows interactive editing overlays instead of executing events

  const handleFocusHotspot = useCallback((hotspotId: string) => {
    if (isEditing) {
      setSelectedHotspotForModal(hotspotId);
      if (isMobile) {
        // On mobile, focusing a hotspot should also switch to the properties tab and set editingHotspot
        setActiveMobileEditorTab('properties');
        const hotspot = hotspots.find(h => h.id === hotspotId);
        if (hotspot) {
          setEditingHotspot(hotspot);
        }
      } else {
        // On desktop, open the modal for editing
        setIsHotspotModalOpen(true);
      }
    } else if (moduleState === 'idle') {
      setExploredHotspotId(hotspotId);
      const firstEventForHotspot = timelineEvents
        .filter(e => e.targetId === hotspotId)
        .sort((a, b) => a.step - b.step)[0];
      setExploredHotspotPanZoomActive(!!(firstEventForHotspot && firstEventForHotspot.type === InteractionType.PAN_ZOOM_TO_HOTSPOT));
    }
    // In learning mode, clicks on dots don't typically change the active info panel unless it's a timeline driven change
  }, [isEditing, moduleState, timelineEvents, hotspots, isMobile, setActiveMobileEditorTab, setSelectedHotspotForModal, setIsHotspotModalOpen]);

  // DUPLICATE REMOVED - Original definition is used (now includes debugLog)
  // const clearImageBoundsCache = useCallback(() => {
  //   originalImageBoundsRef.current = null;
  //   debugLog('Cache', 'Cleared image bounds cache');
  // }, [debugLog]);

  // Define handleSave early, before useAutoSave
  const handleSave = useCallback(async () => {
    if (isSaving) {
      console.log('Save already in progress, skipping...');
      return;
    }
    
    setIsSaving(true);
    console.log('=== SAVE DEBUG ===');
    
    // await new Promise(resolve => setTimeout(resolve, 100)); // REMOVED
    
    const currentData = {
      backgroundImage,
      backgroundType,
      backgroundVideoType,
      hotspots,
      timelineEvents,
      imageFitMode
    };
    
    // Validate data before saving
    if (!Array.isArray(currentData.hotspots)) {
      console.error('Invalid hotspots data:', currentData.hotspots);
      alert('Invalid hotspot data detected. Please refresh and try again.');
      setIsSaving(false);
      return;
    }
    
    if (!Array.isArray(currentData.timelineEvents)) {
      console.error('Invalid timeline events data:', currentData.timelineEvents);
      alert('Invalid timeline data detected. Please refresh and try again.');
      setIsSaving(false);
      return;
    }
    
    console.log('Saving data:', {
      hotspotsCount: currentData.hotspots.length,
      timelineEventsCount: currentData.timelineEvents.length,
      hotspotIds: currentData.hotspots.map(h => h.id),
      backgroundImagePresent: !!currentData.backgroundImage
    });
    
    try {
      await onSave(currentData);
      console.log('Save completed successfully');
      setShowSuccessMessage(true);
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
      }
      successMessageTimeoutRef.current = window.setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Save failed: ' + errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [backgroundImage, backgroundType, backgroundVideoType, hotspots, timelineEvents, imageFitMode, isSaving, onSave]);

  // THEN define useAutoSave after handleSave is defined
  useAutoSave(isEditing, hotspots, timelineEvents, handleSave);

  const handleStartLearning = () => {
    setModuleState('learning');
    setExploredHotspotId(null);
    setExploredHotspotPanZoomActive(false); 
    setCurrentStep(uniqueSortedSteps[0] || 1);
    // Clear bounds cache for fresh calculation in new mode
    originalImageBoundsRef.current = null;
    // Force image bounds recalculation after state change
    setTimeout(() => {
      throttledRecalculatePositions();
    }, 100);
  };

  const handleStartExploring = useCallback(() => {
    setModuleState('idle');
    setExploredHotspotId(null);
    setExploredHotspotPanZoomActive(false);
    // Clear bounds cache for fresh calculation in new mode
    originalImageBoundsRef.current = null;
    // Force image bounds recalculation after state change
    setTimeout(() => {
      throttledRecalculatePositions();
    }, 100);
  }, [throttledRecalculatePositions]);

  const handleTimelineDotClick = useCallback((step: number) => {
    if (moduleState === 'idle' && !isEditing) {
        setModuleState('learning');
        setExploredHotspotId(null);
        setExploredHotspotPanZoomActive(false);
    }
    setCurrentStep(step);
  }, [moduleState, isEditing]);


  const handleImageUpload = useCallback(async (file: File) => {
    // If there's already an image and hotspots, warn the user
    if (backgroundImage && hotspots.length > 0) {
      const confirmReplace = confirm(
        `Replacing the image may affect hotspot positioning. You have ${hotspots.length} hotspot(s) that may need to be repositioned.\n\nDo you want to continue?`
      );
      if (!confirmReplace) return;
    }
    
    debugLog('Image', 'Image upload started', { fileName: file.name, fileSize: file.size });
    setImageLoading(true);

    try {
      // Upload to Firebase Storage and get URL
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
  }, [backgroundImage, hotspots.length, debugLog, projectId]);


  // New handleAddHotspot function as per plan
  // Note: Direct state setters (setHotspots, setEditingHotspot, setTimelineEvents, setCurrentStep) are used here
  // for simplicity and because the individual state updates are relatively independent and don't require
  // the more complex batching provided by `batchedSetState` which is used in `handleAttemptClose` for resetting multiple states.
  const handleAddHotspot = useCallback(() => {
    if (isPlacingHotspot) {
      // If already in placement mode, clicking again cancels it.
      setIsPlacingHotspot(false);
      console.log("Hotspot placement cancelled by clicking 'Add Hotspot' button again.");
    } else {
      // Enter "placing hotspot" mode.
      setIsPlacingHotspot(true);
      // Potentially show a message to the user, e.g., "Click on the image to place the hotspot."
      console.log("Add Hotspot clicked, entering placement mode.");
    }
  }, [isPlacingHotspot, setIsPlacingHotspot]);

  const handleCancelHotspotPlacement = useCallback(() => {
    if (isPlacingHotspot) {
      setIsPlacingHotspot(false);
      console.log("Hotspot placement cancelled via right-click or other direct cancel action.");
    }
  }, [isPlacingHotspot, setIsPlacingHotspot]);

  const handlePlaceNewHotspot = useCallback((x: number, y: number) => {
    const currentScheme = COLOR_SCHEMES.find(s => s.name === colorScheme) || COLOR_SCHEMES[0];
    const defaultColor = currentScheme.colors[hotspots.length % currentScheme.colors.length];

    const newHotspotData: HotspotData = {
      id: `h${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: x, // Use clicked x coordinate
      y: y, // Use clicked y coordinate
      title: "New Hotspot",
      description: "Default description",
      color: defaultColor,
      size: 'medium',
    };

    setHotspots(prevHotspots => [...prevHotspots, newHotspotData]);
    setSelectedHotspotForModal(newHotspotData.id);
    setIsHotspotModalOpen(true);

    // Optional: Create a default "SHOW_HOTSPOT" timeline event
    const newEventStep = timelineEvents.length > 0 ? Math.max(...timelineEvents.map(e => e.step), 0) + 1 : 1;
    const newShowEvent: TimelineEventData = {
      id: `te_show_${newHotspotData.id}_${Date.now()}`,
      step: newEventStep,
      name: `Show ${newHotspotData.title}`,
      type: InteractionType.SHOW_HOTSPOT,
      targetId: newHotspotData.id,
      message: ''
    };
    setTimelineEvents(prevEvents => [...prevEvents, newShowEvent].sort((a,b) => a.step - b.step));
    
    if (isEditing) {
      setCurrentStep(newEventStep);
    }

    setIsPlacingHotspot(false); // Exit placement mode
    console.log(`New hotspot placed at ${x}%, ${y}% and modal opened.`);
  }, [colorScheme, hotspots, timelineEvents, isEditing, setCurrentStep, setIsPlacingHotspot, setSelectedHotspotForModal, setIsHotspotModalOpen]);

  // Removed the first handleEditHotspotRequest (was for HotspotEditModal)

  // Unified handler for opening the HotspotEditorModal for an existing hotspot
  const handleOpenHotspotEditor = useCallback((hotspotId: string) => {
    console.log('Debug [InteractiveModule]: handleOpenHotspotEditor called', {
      hotspotId,
      currentModalState: isHotspotModalOpen,
      selectedHotspot: selectedHotspotForModal,
      timestamp: Date.now()
    });
    
    setSelectedHotspotForModal(hotspotId);
    setIsHotspotModalOpen(true);
    
    console.log('Debug [InteractiveModule]: Modal state updated for hotspot', hotspotId);
  }, [setSelectedHotspotForModal, setIsHotspotModalOpen, isHotspotModalOpen, selectedHotspotForModal]);

  // Removed handleSaveHotspot (was for HotspotEditModal)

  // Enhanced position handler with validation and debug logging
  const handleHotspotPositionChange = useCallback((hotspotId: string, x: number, y: number) => {
    // Input validation
    if (!hotspotId || typeof x !== 'number' || typeof y !== 'number') {
      console.error('Debug [InteractiveModule]: Invalid position change parameters', {
        hotspotId,
        x,
        y,
        timestamp: Date.now()
      });
      return;
    }
    
    // Clamp coordinates to valid range (0-100)
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    console.log('Debug [InteractiveModule]: Position change received', {
      hotspotId,
      originalPosition: { x, y },
      clampedPosition: { x: clampedX, y: clampedY },
      wasClamped: x !== clampedX || y !== clampedY,
      timestamp: Date.now()
    });
    
    setHotspots(prevHotspots => {
      const updatedHotspots = prevHotspots.map(h => 
        h.id === hotspotId ? { ...h, x: clampedX, y: clampedY } : h
      );
      
      // Verify the update was applied
      const updatedHotspot = updatedHotspots.find(h => h.id === hotspotId);
      console.log('Debug [InteractiveModule]: Position update applied', {
        hotspotId,
        newPosition: updatedHotspot ? { x: updatedHotspot.x, y: updatedHotspot.y } : null,
        success: !!updatedHotspot,
        timestamp: Date.now()
      });
      
      return updatedHotspots;
    });
  }, []);
  
  // Drag state change handler
  const handleDragStateChange = useCallback((isDragging: boolean) => {
    console.log('Debug [InteractiveModule]: Drag state changed', {
      isDragging,
      timestamp: Date.now()
    });
    
    setIsDragModeActive(isDragging);
  }, []); // Remove isDragModeActive dependency to prevent stale closures


  // Updated handleImageOrHotspotClick function
  // This function is now intended to be called by ImageEditCanvas with event and potential hotspotId
  const handleImageOrHotspotClick = useCallback((event: React.MouseEvent<HTMLElement>, hotspotIdFromCanvas?: string) => {
    // Check if the click target or its parent has the data-hotspot-id attribute
    let targetElement = event.target as HTMLElement;
    let foundHotspotId: string | undefined = hotspotIdFromCanvas; // Use if provided directly by canvas logic

    if (!foundHotspotId) { // If not directly provided, check data attributes
      while (targetElement && targetElement !== event.currentTarget) {
        const hsId = targetElement.dataset.hotspotId;
        if (hsId) {
          foundHotspotId = hsId;
          break;
        }
        targetElement = targetElement.parentElement as HTMLElement;
      }
    }

    if (foundHotspotId) {
      const clickedHotspot = hotspots.find(h => h.id === foundHotspotId);
      if (clickedHotspot) {
        // Only update if the clicked hotspot is different from the currently editing one
        if (editingHotspot?.id !== clickedHotspot.id) {
          setEditingHotspot(clickedHotspot);
        }
      }
    } else {
      // Clicked on background or an unidentifiable part of the canvas
      // Only update if there was a hotspot being edited
      if (editingHotspot !== null) {
        setEditingHotspot(null); // Close any open editor modal
      }

      // Existing logic for idle mode background click (if applicable when clicking canvas background)
      if (moduleState === 'idle' && !isEditing && backgroundImage) {
          setExploredHotspotId(null);
          setExploredHotspotPanZoomActive(false);
      }
    }
  }, [hotspots, moduleState, isEditing, backgroundImage, isDragModeActive]);

  const handleHotspotClick = useCallback((hotspotId: string) => {
    // This handler is for viewer mode clicks. It forwards to the main focus handler.
    handleFocusHotspot(hotspotId);
  }, [handleFocusHotspot]);

  const handleAddTimelineEvent = useCallback((event?: TimelineEventData) => {
    // If an event is passed (from enhanced editor), use it directly
    if (event) {
      setTimelineEvents(prev => {
        const filtered = prev.filter(e => e.id !== event.id); // Remove existing if editing
        return [...filtered, event].sort((a,b) => a.step - b.step);
      });
      if (isEditing) setCurrentStep(event.step);
      return;
    }
  }, [editorMaxStep, hotspots, currentStep, isEditing]);

  const handleUpdateTimelineEvent = useCallback((updatedEvent: TimelineEventData) => {
    setTimelineEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  }, []);

  const handleDeleteTimelineEvent = useCallback((eventId: string) => {
    setTimelineEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);
  
  // Legacy edit function removed - now handled by enhanced editor

  // Old handleTouchStart and handleTouchMove are removed as useTouchGestures handles this.
  // const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => { ... });
  // const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => { ... });

  const handleRemoveHotspot = useCallback((hotspotId: string) => {
    if (!confirm(`Are you sure you want to remove hotspot ${hotspotId} and its related timeline events?`)) return;
    setHotspots(prev => prev.filter(h => h.id !== hotspotId));
    setTimelineEvents(prev => prev.filter(event => event.targetId !== hotspotId));
    if (exploredHotspotId === hotspotId) {
      setExploredHotspotId(null);
      setExploredHotspotPanZoomActive(false);
    }
  }, [exploredHotspotId]);


  const getHighlightGradientStyle = () => {
    if (!highlightedHotspotId || !backgroundImage || !imageContainerRef.current) return {};

    const hotspotToHighlight = hotspots.find(h => h.id === highlightedHotspotId);
    if (!hotspotToHighlight) return {};

    const currentEvents = timelineEvents.filter(e => e.step === currentStep);
    const eventData = currentEvents.find(e =>
      e.type === InteractionType.HIGHLIGHT_HOTSPOT &&
      e.targetId === highlightedHotspotId
    );

    const imageBounds = getSafeImageBounds(); // Use safe version
    const containerRect = getSafeContainerRect(imageContainerRef);

    // Use custom spotlight position from event data if available, otherwise fall back to hotspot position
    const spotlightX = eventData?.spotlightX ?? hotspotToHighlight.x;
    const spotlightY = eventData?.spotlightY ?? hotspotToHighlight.y;
    
    let highlightXPercent = spotlightX; // Use spotlight position, not hotspot position
    let highlightYPercent = spotlightY; // Use spotlight position, not hotspot position

    if (imageBounds && containerRect.width > 0 && containerRect.height > 0) {
      // Calculate the spotlight's center in pixels, relative to the image's content area origin
      const hotspotPixelX_withinImageContent = (spotlightX / 100) * imageBounds.width;
      const hotspotPixelY_withinImageContent = (spotlightY / 100) * imageBounds.height;

      // Calculate the hotspot's center in pixels, relative to the imageContainerRef's origin.
      // imageBounds.left and imageBounds.top are offsets of the image content area from the container's origin.
      const hotspotPixelX_inContainer = imageBounds.left + hotspotPixelX_withinImageContent;
      const hotspotPixelY_inContainer = imageBounds.top + hotspotPixelY_withinImageContent;

      // Convert these absolute pixel positions (relative to container) to percentages of the container's dimensions
      highlightXPercent = (hotspotPixelX_inContainer / containerRect.width) * 100;
      highlightYPercent = (hotspotPixelY_inContainer / containerRect.height) * 100;
    } else if (imageBounds === null && containerRect.width > 0 && containerRect.height > 0) {
      // Fallback if imageBounds is null (e.g. before image loads) but container exists.
      // Use hotspot's original percentages directly, assuming they are relative to the container in this scenario.
      // This matches the fallback logic in the original issue snippet when imageBounds is null.
      // (The original snippet's fallback was inside `if (!imageBounds)`)
      // No change needed here for highlightXPercent, highlightYPercent as they are already set to fallbacks.
    }


    const radius = (eventData?.highlightRadius || 60) * imageTransform.scale;
    const shape = eventData?.highlightShape || 'circle';
    const dimOpacity = (eventData?.dimPercentage || 70) / 100;

    // Ensure percentages are within bounds for safety if the gradient is applied to the container.
    // If hotspot x/y can be outside 0-100 (e.g. due to data error), this clips the gradient center.
    highlightXPercent = Math.max(0, Math.min(100, highlightXPercent));
    highlightYPercent = Math.max(0, Math.min(100, highlightYPercent));

    // Create different gradients based on shape
    let backgroundStyle = '';
    if (shape === 'circle') {
      backgroundStyle = `radial-gradient(circle at ${highlightXPercent}% ${highlightYPercent}%, transparent 0%, transparent ${radius}px, rgba(0,0,0,${dimOpacity}) ${radius + 10}px)`;
    } else if (shape === 'oval') {
      backgroundStyle = `radial-gradient(ellipse at ${highlightXPercent}% ${highlightYPercent}%, transparent 0%, transparent ${radius}px, rgba(0,0,0,${dimOpacity}) ${radius + 10}px)`;
    } else if (shape === 'rectangle') {
      // For rectangle, use spotlight dimensions instead of radius
      const spotlightWidth = eventData?.spotlightWidth || 120;
      const spotlightHeight = eventData?.spotlightHeight || 120;
      
      // Convert pixel dimensions to percentages relative to container
      const containerRect = getSafeContainerRect(imageContainerRef);
      if (containerRect && containerRect.width > 0 && containerRect.height > 0) {
        const halfWidthPercent = (spotlightWidth / 2 / containerRect.width) * 100;
        const halfHeightPercent = (spotlightHeight / 2 / containerRect.height) * 100;
        
        backgroundStyle = `linear-gradient(
          to right,
          rgba(0,0,0,${dimOpacity}) 0%,
          rgba(0,0,0,${dimOpacity}) calc(${highlightXPercent}% - ${halfWidthPercent}%),
          transparent calc(${highlightXPercent}% - ${halfWidthPercent}%),
          transparent calc(${highlightXPercent}% + ${halfWidthPercent}%),
          rgba(0,0,0,${dimOpacity}) calc(${highlightXPercent}% + ${halfWidthPercent}%),
          rgba(0,0,0,${dimOpacity}) 100%
        ),
        linear-gradient(
          to bottom,
          rgba(0,0,0,${dimOpacity}) 0%,
          rgba(0,0,0,${dimOpacity}) calc(${highlightYPercent}% - ${halfHeightPercent}%),
          transparent calc(${highlightYPercent}% - ${halfHeightPercent}%),
          transparent calc(${highlightYPercent}% + ${halfHeightPercent}%),
          rgba(0,0,0,${dimOpacity}) calc(${highlightYPercent}% + ${halfHeightPercent}%),
          rgba(0,0,0,${dimOpacity}) 100%
        )`;
      } else {
        // Fallback if container dimensions aren't available
        const halfRadius = radius / 2;
        backgroundStyle = `linear-gradient(
          to right,
          rgba(0,0,0,${dimOpacity}) 0%,
          rgba(0,0,0,${dimOpacity}) calc(${highlightXPercent}% - ${halfRadius}px),
          transparent calc(${highlightXPercent}% - ${halfRadius}px),
          transparent calc(${highlightXPercent}% + ${halfRadius}px),
          rgba(0,0,0,${dimOpacity}) calc(${highlightXPercent}% + ${halfRadius}px),
          rgba(0,0,0,${dimOpacity}) 100%
        ),
        linear-gradient(
          to bottom,
          rgba(0,0,0,${dimOpacity}) 0%,
          rgba(0,0,0,${dimOpacity}) calc(${highlightYPercent}% - ${halfRadius}px),
          transparent calc(${highlightYPercent}% - ${halfRadius}px),
          transparent calc(${highlightYPercent}% + ${halfRadius}px),
          rgba(0,0,0,${dimOpacity}) calc(${highlightYPercent}% + ${halfRadius}px),
          rgba(0,0,0,${dimOpacity}) 100%
        )`;
      }
    }

    return {
      background: backgroundStyle,
      transition: 'background 0.3s ease-in-out',
    };
  };
  
  // Removed activeInfoHotspot - using modal now

  // Sub-component for displaying transform information
  const TransformIndicator = () => {
    if (imageTransform.scale === 1) {
      return null;
    }

    const focusedHotspot = imageTransform.targetHotspotId
      ? hotspots.find(h => h.id === imageTransform.targetHotspotId)
      : null;

    return (
      <div
        className="absolute top-20 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm"
        style={{ zIndex: Z_INDEX.INFO_PANEL }}
      >
        Zoom: {imageTransform.scale.toFixed(1)}x
        {focusedHotspot && (
          <span className="ml-2">(focused on {focusedHotspot.title})</span>
        )}
        {!isEditing && (
          <div className="mt-1 text-xs text-slate-300">Click empty area to reset view</div>
        )}
      </div>
    );
  };

  // Debug component for positioning verification (development only)
  const PositioningDebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const imageBounds = getSafeImageBounds();
    const containerRect = getSafeContainerRect(imageContainerRef);

    return (
      <div
        className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs"
        style={{ zIndex: Z_INDEX.DEBUG }}
      >
        <div className="font-bold mb-2">Positioning Debug</div>
        <div>Mode: {isEditing ? 'Editor' : 'Viewer'}</div>
        <div>Transform: scale({imageTransform.scale.toFixed(2)}) translate({imageTransform.translateX.toFixed(1)}, {imageTransform.translateY.toFixed(1)})</div>
        {imageBounds && (
          <div className="mt-1">
            <div>Image Bounds: {imageBounds.width.toFixed(1)}x{imageBounds.height.toFixed(1)}</div>
            <div>Position: ({imageBounds.left.toFixed(1)}, {imageBounds.top.toFixed(1)})</div>
          </div>
        )}
        {containerRect && (
          <div className="mt-1">
            <div>Container: {containerRect.width.toFixed(1)}x{containerRect.height.toFixed(1)}</div>
          </div>
        )}
        <div className="mt-1">Hotspots: {hotspotsWithPositions.length}</div>
        
        {/* Error Log Section */}
        {errorLog.length > 0 && (
          <div className="mt-2 border-t border-gray-600 pt-2">
            <div className="font-bold text-red-400">Recent Errors ({errorLog.length})</div>
            <div className="max-h-20 overflow-y-auto">
              {errorLog.slice(-3).map((error, index) => (
                <div key={error.timestamp} className="mt-1 text-red-300">
                  <div className="font-mono text-xs">{error.context}</div>
                  <div className="text-xs opacity-80 truncate">{error.error}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Function Validation Status */}
        <div className="mt-2 border-t border-gray-600 pt-2">
          <div className="font-bold text-blue-400">Function Status</div>
          <div className="text-xs">
            <span className={getSafeImageBounds ? 'text-green-400' : 'text-red-400'}>
              getSafeImageBounds: {getSafeImageBounds ? '✓' : '✗'}
            </span>
          </div>
          <div className="text-xs">
            <span className={getSafeViewportCenter ? 'text-green-400' : 'text-red-400'}>
              getSafeViewportCenter: {getSafeViewportCenter ? '✓' : '✗'}
            </span>
          </div>
          <div className="text-xs">
            <span className={constrainTransform ? 'text-green-400' : 'text-red-400'}>
              constrainTransform: {constrainTransform ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>
    );
  };


  const handleAttemptClose = useCallback(() => {
    if (isModeSwitching) {
      debugLog('ModeSwitch', 'Already switching, aborting close attempt.');
      return;
    }

    debugLog('ModeSwitch', 'Starting mode switch / close sequence.');
    setIsModeSwitching(true);

    // Cancel any pending operations
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
    if (successMessageTimeoutRef.current) {
      clearTimeout(successMessageTimeoutRef.current);
      successMessageTimeoutRef.current = null;
    }
    if (applyTransformTimeoutRef.current) {
      clearTimeout(applyTransformTimeoutRef.current);
      applyTransformTimeoutRef.current = null;
    }

    // Reset all states in a single batch
    batchedSetState([
      () => setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined }),
      () => setEditingZoom(1),
      () => setExploredHotspotId(null),
      () => setPulsingHotspotId(null),
      () => setHighlightedHotspotId(null),
      // () => setActiveHotspotInfoId(null), // Assuming this state exists, as per plan - REMOVED
      () => setCurrentMessage(null),
      () => setActiveHotspotDisplayIds(new Set()),
      () => setModuleState('idle'), // Reset module state
    ]);

    // Delay the actual close to allow state updates to complete
    closeTimeoutRef.current = setTimeout(() => {
      debugLog('ModeSwitch', 'Executing actual close action.');
      if (onClose) {
        // Pass a callback that will be executed by App.tsx's handleCloseModal
        onClose(() => {
          // This part is now effectively App.tsx's responsibility,
          // but InteractiveModule ensures its own state is set before this callback is even available to App.tsx
          setIsModeSwitching(false);
          debugLog('ModeSwitch', 'InteractiveModule internal cleanup finished, App-side callback executed.');
        });
      } else {
        // If no onClose is provided, finish mode switching here
        setIsModeSwitching(false);
        debugLog('ModeSwitch', 'InteractiveModule internal cleanup finished (no onClose callback).');
      }
    }, 150); // Delay for internal state updates to settle before calling onClose
  }, [
    isModeSwitching,
    onClose,
    batchedSetState,
    debugLog,
    // Add other dependencies if they are directly used in this callback for logic other than setting state
    // For example, if a condition for closing depends on another state, add it here.
    // States that are only being reset via batchedSetState do not need to be listed as deps
    // unless their current value is read for some logic within this callback before being reset.
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Auto-adjust image scale when editor panel opens/closes
  const previousPanelStateRef = useRef<boolean>(isHotspotModalOpen);
  useEffect(() => {
    const panelWasOpen = previousPanelStateRef.current;
    const panelIsNowOpen = isHotspotModalOpen;

    // Only adjust if panel state actually changed
    if (panelWasOpen !== panelIsNowOpen && !isMobile) {
      const optimalTransform = calculateOptimalImageScale(
        imageTransform.scale,
        imageTransform.translateX,
        imageTransform.translateY,
        panelIsNowOpen
      );

      // Apply the optimal transform if it's different from current
      if (optimalTransform.scale !== imageTransform.scale ||
          Math.abs(optimalTransform.translateX - imageTransform.translateX) > 1 ||
          Math.abs(optimalTransform.translateY - imageTransform.translateY) > 1) {
        setIsTransforming(true);
        setImageTransform(optimalTransform);

        // End transformation after animation completes
        if (stateChangeTimeoutRef.current) {
          clearTimeout(stateChangeTimeoutRef.current);
        }
        stateChangeTimeoutRef.current = window.setTimeout(() => {
          setIsTransforming(false);
          stateChangeTimeoutRef.current = null;
        }, 500);
      }
    }

    // Update the previous state ref
    previousPanelStateRef.current = panelIsNowOpen;
  }, [isHotspotModalOpen, isMobile, imageTransform, setImageTransform, setIsTransforming, calculateOptimalImageScale]);

  useEffect(() => {
    if (!imageContainerRef.current) return;

    // Enhanced debounced resize handler to prevent excessive calculations
    const debouncedHandleResize = throttle(() => {
      throttledRecalculatePositions();

      // Only recalculate transform if we're not in the middle of applying one
      // and if the transform was user-initiated (not timeline-driven)
      const currentTransform = lastAppliedTransformRef.current;
      if (!isApplyingTransformRef.current &&
          currentTransform.scale > 1 &&
          currentTransform.targetHotspotId &&
          moduleState === 'idle') { // Only in idle mode for user-initiated zooms

        // Use a separate timeout to avoid immediate recalculation
        setTimeout(() => {
          if (!isApplyingTransformRef.current) {
            const targetHotspot = hotspots.find(h => h.id === currentTransform.targetHotspotId);
            if (targetHotspot) {
              const imageBounds = getSafeImageBounds();
              const viewportCenter = getSafeViewportCenter();
              if (imageBounds && viewportCenter) {
                const hotspotX = (targetHotspot.x / 100) * imageBounds.width;
                const hotspotY = (targetHotspot.y / 100) * imageBounds.height;

                const hotspotOriginalX = imageBounds.left + hotspotX;
                const hotspotOriginalY = imageBounds.top + hotspotY;

                const translateX = viewportCenter.centerX - hotspotOriginalX * currentTransform.scale;
                const translateY = viewportCenter.centerY - hotspotOriginalY * currentTransform.scale;

                // Only update if values have actually changed significantly
                const threshold = 1; // 1px threshold
                if (Math.abs(translateX - currentTransform.translateX) > threshold ||
                    Math.abs(translateY - currentTransform.translateY) > threshold) {
                  setImageTransform(prev => ({ ...prev, translateX, translateY }));
                  lastAppliedTransformRef.current = { ...currentTransform, translateX, translateY };
                }
              }
            }
          }
        }, 50); // Small delay to let other effects settle
      }
    }, 100); // Debounce resize events to prevent excessive calculations

    // Safe initial setup
    const initialRect = getSafeContainerRect(imageContainerRef);
    if (initialRect.width > 0 && initialRect.height > 0) {
      setImageContainerRect(initialRect);
    }

    const resizeObserver = new ResizeObserver(debouncedHandleResize);
    resizeObserver.observe(imageContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [hotspots, getSafeImageBounds, getSafeViewportCenter, throttledRecalculatePositions, moduleState]);

  // Add wheel event listener for Ctrl+scroll zoom
  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (!container || !isEditing) return; // Only add when editing

    // Add event listener with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheelZoom, { passive: false });

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheelZoom);
      }
    };
  }, [handleWheelZoom, isEditing]);


  // Effect to handle viewer mode initialization and ensure proper image display
  useEffect(() => {
    if (imageNaturalDimensions) {
      throttledRecalculatePositions();
    }
  }, [imageNaturalDimensions]);

  useEffect(() => {
    if (!isEditing && backgroundImage && moduleState !== 'idle') {
      // When transitioning to viewer mode, ensure proper container setup
      const container = isMobile ? viewerImageContainerRef.current : imageContainerRef.current;
      if (container) {
        // Force a reflow to ensure container has proper dimensions
        container.offsetHeight;

        // Clear any cached bounds to force fresh calculation
        originalImageBoundsRef.current = null;

        // Recalculate positions after container is ready - staggered for reliability
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = window.setTimeout(() => {
          throttledRecalculatePositions();
          animationTimeoutRef.current = null;
        }, 50);

        // Additional recalculation for mobile devices with dynamic viewports
        if (isMobile) {
          if (stateChangeTimeoutRef.current) {
            clearTimeout(stateChangeTimeoutRef.current);
          }
          stateChangeTimeoutRef.current = window.setTimeout(() => {
            throttledRecalculatePositions();
            stateChangeTimeoutRef.current = null;
          }, 150);
        }
      }
    }
  }, [isEditing, backgroundImage, moduleState, isMobile, throttledRecalculatePositions]);

  // Effect to recalculate positions when image natural dimensions are loaded
  useEffect(() => {
    if (!isEditing && imageNaturalDimensions && backgroundImage) {
      // Image has loaded and we have dimensions, recalculate positions
      // Clear bounds cache to ensure fresh calculation with new dimensions
      originalImageBoundsRef.current = null;

      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      initTimeoutRef.current = window.setTimeout(() => {
        throttledRecalculatePositions();
        initTimeoutRef.current = null;
      }, 100);

      // Additional check for mobile viewport stability
      if (isMobile) {
        if (saveAnimationTimeoutRef.current) {
          clearTimeout(saveAnimationTimeoutRef.current);
        }
        saveAnimationTimeoutRef.current = window.setTimeout(() => {
          // Verify container dimensions are stable before final recalculation
          const container = viewerImageContainerRef.current;
          if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
            throttledRecalculatePositions();
          }
          saveAnimationTimeoutRef.current = null;
        }, 250);
      }
    }
  }, [isEditing, imageNaturalDimensions, backgroundImage, throttledRecalculatePositions, isMobile]);

  // Consolidated Initialization useEffect
  useEffect(() => {
    let isMounted = true;

    // Prevent re-initialization during mode switches or if already initialized for current data
    if (isModeSwitching) {
      debugLog('Init', 'Skipping initialization: mode switching.');
      return;
    }
    // If we consider isInitialized as a guard against re-running for the *same* initialData,
    // this might be too aggressive if initialData itself changes identity but not content.
    // However, the dependencies array [initialData, isEditing, isModeSwitching] handles actual data changes.
    // The primary role of isInitialized here is for the initial "Initializing..." screen.

    debugLog('Init', 'Starting initialization process...', { isEditing, initialDataProvided: !!initialData });
    if (isMounted) {
      setInitError(null); // Clear previous errors
    }

    // Clear any existing timeouts from previous renders or states
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
    if (successMessageTimeoutRef.current) {
      clearTimeout(successMessageTimeoutRef.current);
      successMessageTimeoutRef.current = null;
    }
    if (applyTransformTimeoutRef.current) {
      clearTimeout(applyTransformTimeoutRef.current);
      applyTransformTimeoutRef.current = null;
    }

    try {
      setBackgroundImage(initialData.backgroundImage);
      setBackgroundType(initialData.backgroundType || 'image');
      setBackgroundVideoType(initialData.backgroundVideoType || 'mp4');
      setHotspots(initialData.hotspots || []);
      setTimelineEvents(initialData.timelineEvents || []);
      setImageFitMode(initialData.imageFitMode || 'cover');

      const newInitialModuleState = isEditing ? 'learning' : 'idle';
      setModuleState(newInitialModuleState);

      const safeTimelineEvents = initialData.timelineEvents || [];
      const newUniqueSortedSteps = [...new Set(safeTimelineEvents.map(e => e.step))].sort((a, b) => a - b);
      let initialStepValue = 1; // Default
      if (newUniqueSortedSteps.length > 0) {
          // In both 'learning' and 'idle' modes, we want to start at the first available step.
          // The mode itself will determine if auto-play happens or if it's just the initial selected step.
          initialStepValue = newUniqueSortedSteps[0];
      }
      setCurrentStep(initialStepValue);

      // Reset all other interactive states
      setActiveHotspotDisplayIds(new Set());
      setPulsingHotspotId(null);
      setCurrentMessage(null);
      setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
      setHighlightedHotspotId(null);
      setExploredHotspotId(null);
      setExploredHotspotPanZoomActive(false);

      // Clear caches
      clearImageBoundsCache(); // This sets originalImageBoundsRef.current = null
      lastAppliedTransformRef.current = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };

      if (isMounted) {
        setIsInitialized(true);
        debugLog('Init', 'Initialization complete.');
      }

    } catch (error) {
      console.error('Module initialization failed:', error);
      debugLog('InitError', 'Module initialization failed', error);
      if (isMounted) {
        setInitError(error instanceof Error ? error : new Error(String(error)));
        setIsInitialized(true); // Still mark as initialized to show error UI
      }
    }

    // Cleanup for this effect
    return () => {
      isMounted = false;
      debugLog('Init', 'Cleanup function for initialization effect called.');
      // This cleanup runs when initialData or isEditing changes, or on unmount.
      // Setting isInitialized to false here would cause "Initializing..." screen to flash
      // if initialData or isEditing changes. This might be desired if a full re-init feel is wanted.
      // For now, let's not set isInitialized to false here, as the main purpose is the *initial* load.
      // Subsequent changes to initialData/isEditing will re-run the effect and reset states appropriately.

      // However, timeouts specific to this effect's lifecycle (if any were started and not cleared above)
      // should be cleared. Currently, all relevant timeouts are cleared at the start of the effect.
      // If a new initialData triggers this, we want to ensure old timeouts are gone.
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
        successMessageTimeoutRef.current = null;
      }
      if (applyTransformTimeoutRef.current) {
        clearTimeout(applyTransformTimeoutRef.current);
        applyTransformTimeoutRef.current = null;
      }
    };
  }, [initialData, isEditing, clearImageBoundsCache, isModeSwitching, debugLog]); // Added isModeSwitching and debugLog

  // Cleanup for closeTimeoutRef
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // REMOVED Duplicative Initialization useEffect - The new consolidated initialization effect above handles all this logic

  // Consider refactoring handleKeyDown into smaller, modular functions for each shortcut
  useEffect(() => {
    // REMOVED Redundant safety check:
    // React guarantees hooks are defined in order before this effect runs.
    // if (!handleArrowLeftKey || !handleArrowRightKey || !handleEscapeKey ||
    //     !handlePlusKey || !handleMinusKey || !handleZeroKey) {
    //   return;
    // }

    const handleKeyDown = (e: KeyboardEvent) => {
      debugLog('Keyboard', `Key '${e.key}' pressed`, { ctrl: e.ctrlKey, meta: e.metaKey });
      // Don't interfere with input fields
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable)
         ) {
        return;
      }

      let preventDefault = false;
      const handlers = stableKeyboardHandlers;

      if (e.key === 'ArrowLeft') {
        preventDefault = handlers.handleArrowLeftKey();
      } else if (e.key === 'ArrowRight') {
        preventDefault = handlers.handleArrowRightKey();
      } else if (e.key === 'Escape') {
        preventDefault = handlers.handleEscapeKey();
      } else if (e.key === '+' || e.key === '=') {
        preventDefault = handlers.handlePlusKey(e);
      } else if (e.key === '-') {
        preventDefault = handlers.handleMinusKey(e);
      } else if (e.key === '0') {
        preventDefault = handlers.handleZeroKey(e);
      }

      if (preventDefault) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [debugLog, stableKeyboardHandlers]); // Stable dependency



  useEffect(() => {
    // Add safety checks to prevent temporal dead zone issues
    if (!getSafeImageBounds || !getSafeViewportCenter || !constrainTransform || !applyTransform || timelineEvents === null || hotspots === null) {
      return;
    }

    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);

    // Removed newActiveHotspotInfoId - using modal now
    let newImageTransform: ImageTransformState = lastAppliedTransformRef.current || { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };

    if (moduleState === 'learning') {
      const newActiveDisplayIds = new Set<string>();
      let newMessage: string | null = null;
      let newPulsingHotspotId: string | null = null;
      let newHighlightedHotspotId: string | null = null;

      const eventsForCurrentStep = timelineEvents.filter(event => event.step === currentStep);
      let stepHasPanZoomEvent = false;

      eventsForCurrentStep.forEach(event => {
        if (event.targetId) newActiveDisplayIds.add(event.targetId);
        switch (event.type) {
          case InteractionType.SHOW_MESSAGE: if (event.message) newMessage = event.message; break;
          case InteractionType.SHOW_HOTSPOT: if (event.targetId) { /* Show in modal instead */ } break;
          case InteractionType.PULSE_HOTSPOT:
            if (event.targetId) {
              newPulsingHotspotId = event.targetId;
              if (event.duration) {
                pulseTimeoutRef.current = window.setTimeout(() => setPulsingHotspotId(prevId => prevId === event.targetId ? null : prevId), event.duration);
              }
            }
            break;
          case InteractionType.PAN_ZOOM_TO_HOTSPOT:
            stepHasPanZoomEvent = true;
            if (event.targetId) {
              const targetHotspot = hotspots.find(h => h.id === event.targetId);
              // Ensure hotspotsWithPositions is used if available, otherwise find in hotspots
              // const targetHotspot = hotspotsWithPositions.find(h => h.id === event.targetId) || hotspots.find(h => h.id === event.targetId);

              const imageBounds = getSafeImageBounds();
              const viewportCenter = getSafeViewportCenter();

              if (targetHotspot && imageBounds && viewportCenter) {
                const scale = event.zoomFactor || 2;

                // Calculate hotspot position on the unscaled image, relative to imageBounds content area
                const hotspotX = (targetHotspot.x / 100) * imageBounds.width;
                const hotspotY = (targetHotspot.y / 100) * imageBounds.height;

                // Calculate translation to center the hotspot
                // The viewportCenter.centerX/Y is the target point on the screen for the hotspot.
                // The hotspot's scaled position without additional translation would be:
                // (imageBounds.left + hotspotX) * scale (if transform-origin is top-left of container)
                // OR more simply, if thinking about the image content itself:
                // The point (hotspotX, hotspotY) on the image content needs to map to (viewportCenter.centerX, viewportCenter.centerY)
                // after the full transform `translate(translateX, translateY) scale(scale)` is applied to the div,
                // and considering the image content starts at `imageBounds.left, imageBounds.top` within that div.

                // The CSS transform `translate(tx, ty) scale(s)` on a div means:
                // screenX = divOriginalScreenX * s + tx
                // screenY = divOriginalScreenY * s + ty
                // If the div has `transform-origin: center center`, it's more complex.
                // The `scaledImageDivRef` has `transform-origin: center`.

                // Let's use the formula from the issue, as it's specified.
                // It calculates translateX/Y such that when the `scaledImageDivRef` is translated and scaled,
                // the specific hotspot point (hotspotX, hotspotY, which is relative to image content origin)
                // lands on viewportCenter.
                // The `imageBounds.left` and `imageBounds.top` are the offsets of the image content
                // *within* the `scaledImageDivRef` before the main `imageTransform` is applied.
                // So, if the `scaledImageDivRef` itself is at (0,0) in the container,
                // the image content origin is at `(imageBounds.left, imageBounds.top)`.
                // A point `(hotspotX, hotspotY)` on the image content is at
                // `(imageBounds.left + hotspotX, imageBounds.top + hotspotY)` relative to `scaledImageDivRef` origin.
                // After scaling this by `scale` (around `scaledImageDivRef`'s origin, which is `center`),
                // and then translating by `translateX, translateY`:
                // target_on_screen_X = ( (imageBounds.left + hotspotX) - divCenterX) * scale + divCenterX + translateX
                // target_on_screen_Y = ( (imageBounds.top + hotspotY) - divCenterY) * scale + divCenterY + translateY
                // We want target_on_screen_X = viewportCenter.centerX

                // Calculate translation for center-origin transform
                // With transform-origin: center, we need to account for the div's center point
                const divDimensions = imageContainerRef.current?.getBoundingClientRect();
                if (!divDimensions) return;
                const divCenterX = divDimensions.width / 2;
                const divCenterY = divDimensions.height / 2;

                // For center-origin scaling, the transform formula is:
                // final_position = (original_position - center) * scale + center + translate
                // We want: hotspot_final_position = viewportCenter
                // So: translate = viewportCenter - ((hotspot_original - center) * scale + center)
                // Simplifying: translate = viewportCenter - (hotspot_original - center) * scale - center

                const hotspotOriginalX = imageBounds.left + hotspotX;
                const hotspotOriginalY = imageBounds.top + hotspotY;

                const translateX = viewportCenter.centerX - (hotspotOriginalX - divCenterX) * scale - divCenterX;
                const translateY = viewportCenter.centerY - (hotspotOriginalY - divCenterY) * scale - divCenterY;

                let newTransform: ImageTransformState = {
                  scale,
                  translateX,
                  translateY,
                  targetHotspotId: event.targetId
                };

                newTransform = constrainTransform(newTransform);

                newImageTransform = newTransform;
              } else if (targetHotspot) { // imageBounds or viewportCenter might be null
                  // Fallback or error? For now, do nothing if critical info is missing.
                  // Or reset? The default is to reset if no pan/zoom event.
              }
            }
            break;
          case InteractionType.HIGHLIGHT_HOTSPOT:
            if (event.targetId) { newHighlightedHotspotId = event.targetId; }
            break;
          case InteractionType.SHOW_TEXT:
            if (event.textContent) {
              newMessage = event.textContent;
            }
            break;
          case InteractionType.SHOW_IMAGE:
            if (event.imageUrl) {
              // For now, show image URL as message - could be enhanced with modal
              newMessage = `Image: ${event.imageUrl}${event.caption ? ` - ${event.caption}` : ''}`;
            }
            break;
          case InteractionType.PAN_ZOOM:
            if (event.targetId) {
              stepHasPanZoomEvent = true;
              const targetHotspot = hotspots.find(h => h.id === event.targetId);
              const imageBounds = getSafeImageBounds();
              const viewportCenter = getSafeViewportCenter();

              if (targetHotspot && imageBounds && viewportCenter) {
                const scale = event.zoomLevel || 2;
                const hotspotX = (targetHotspot.x / 100) * imageBounds.width;
                const hotspotY = (targetHotspot.y / 100) * imageBounds.height;

                const hotspotOriginalX = imageBounds.left + hotspotX;
                const hotspotOriginalY = imageBounds.top + hotspotY;

                const translateX = viewportCenter.centerX - hotspotOriginalX * scale;
                const translateY = viewportCenter.centerY - hotspotOriginalY * scale;

                let newTransform: ImageTransformState = {
                  scale,
                  translateX,
                  translateY,
                  targetHotspotId: event.targetId
                };

                newTransform = constrainTransform(newTransform);
                newImageTransform = newTransform;
              }
            }
            break;
          case InteractionType.SPOTLIGHT:
            if (event.targetId) {
              newHighlightedHotspotId = event.targetId;
              // Could be enhanced with intensity and radius parameters
            }
            break;
          case InteractionType.QUIZ:
            if (event.quizQuestion) {
              newMessage = `Quiz: ${event.quizQuestion}`;
              // Could be enhanced with modal for quiz interaction
            }
            break;
          case InteractionType.PULSE_HIGHLIGHT:
            if (event.targetId) {
              newPulsingHotspotId = event.targetId;
              newHighlightedHotspotId = event.targetId;
              if (event.duration) {
                pulseTimeoutRef.current = window.setTimeout(() => {
                  setPulsingHotspotId(prevId => prevId === event.targetId ? null : prevId);
                  setHighlightedHotspotId(prevId => prevId === event.targetId ? null : prevId);
                }, event.duration);
              }
            }
            break;
          case InteractionType.PLAY_AUDIO:
            if (event.audioUrl) {
              // Basic audio playback - could be enhanced with volume control
              const audio = new Audio(event.audioUrl);
              if (event.volume !== undefined) {
                audio.volume = Math.max(0, Math.min(1, event.volume / 100));
              }
              audio.play().catch(error => console.warn('Audio playback failed:', error));
            }
            break;
          case InteractionType.SHOW_VIDEO:
            if (event.videoUrl) {
              showMediaModal('video', event.name || 'Video', {
                src: event.videoUrl,
                poster: event.poster,
                autoplay: event.autoplay || false,
                loop: event.loop || false
              });
            }
            break;
          case InteractionType.SHOW_AUDIO_MODAL:
            if (event.audioUrl) {
              showMediaModal('audio', event.name || 'Audio', {
                src: event.audioUrl,
                title: event.textContent,
                artist: event.artist,
                autoplay: event.autoplay || false,
                loop: event.loop || false
              });
            }
            break;
          case InteractionType.SHOW_IMAGE_MODAL:
            if (event.imageUrl) {
              showMediaModal('image', event.name || 'Image', {
                src: event.imageUrl,
                alt: event.caption || '',
                title: event.textContent,
                caption: event.caption
              });
            }
            break;
          case InteractionType.SHOW_YOUTUBE:
            if (event.youtubeVideoId) {
              showMediaModal('youtube', event.name || 'YouTube Video', {
                videoId: event.youtubeVideoId,
                startTime: event.youtubeStartTime,
                endTime: event.youtubeEndTime,
                autoplay: event.autoplay || false,
                loop: event.loop || false
              });
            }
            break;
        }
      });

      if (!stepHasPanZoomEvent && (lastAppliedTransformRef.current.scale !== 1 || lastAppliedTransformRef.current.translateX !== 0 || lastAppliedTransformRef.current.translateY !== 0)) {
        newImageTransform = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
      }

      eventsForCurrentStep.forEach(event => {
        if (event.type === InteractionType.HIDE_HOTSPOT && event.targetId) {
          newActiveDisplayIds.delete(event.targetId);
          if (newPulsingHotspotId === event.targetId) newPulsingHotspotId = null;
          if (newHighlightedHotspotId === event.targetId) newHighlightedHotspotId = null;
          if (newImageTransform.targetHotspotId === event.targetId) newImageTransform = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
          // Remove info display - using modal now
        }
      });

      setActiveHotspotDisplayIds(newActiveDisplayIds);
      setCurrentMessage(newMessage);
      setPulsingHotspotId(newPulsingHotspotId);
      setHighlightedHotspotId(newHighlightedHotspotId);

    } else if (moduleState === 'idle' && !isEditing) {
      setActiveHotspotDisplayIds(new Set(hotspots.map(h => h.id)));
      setCurrentMessage(null);
      setPulsingHotspotId(null);
      setHighlightedHotspotId(null);

      let transformToApply: ImageTransformState;

      if (exploredHotspotId && exploredHotspotPanZoomActive) {
        const hotspot = hotspots.find(h => h.id === exploredHotspotId);
        // Attempt to find a PAN_ZOOM_TO_HOTSPOT event. If not found, PAN_ZOOM could also be used.
        const panZoomEvent = timelineEvents
          .filter(e => e.targetId === exploredHotspotId &&
                       (e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT || e.type === InteractionType.PAN_ZOOM))
          .sort((a, b) => a.step - b.step)[0];

        if (hotspot && panZoomEvent) {
          const imageBounds = getSafeImageBounds();
          const viewportCenter = getSafeViewportCenter();

          if (imageBounds && viewportCenter) {
            const scale = panZoomEvent.zoomFactor || (panZoomEvent.type === InteractionType.PAN_ZOOM ? panZoomEvent.zoomLevel : undefined) || 2;
            const hotspotX = (hotspot.x / 100) * imageBounds.width;
            const hotspotY = (hotspot.y / 100) * imageBounds.height;

            const hotspotOriginalX = imageBounds.left + hotspotX;
            const hotspotOriginalY = imageBounds.top + hotspotY;

            const translateX = viewportCenter.centerX - hotspotOriginalX * scale;
            const translateY = viewportCenter.centerY - hotspotOriginalY * scale;

            transformToApply = {
              scale,
              translateX,
              translateY,
              targetHotspotId: hotspot.id
            };
          } else {
            // Fallback if imageBounds or viewportCenter is null
            transformToApply = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
          }
        } else {
          // Fallback if hotspot or its panZoomEvent is not found (e.g. hotspot exists but no zoom event for it)
          // This means exploredHotspotPanZoomActive might have been true based on a generic PAN_ZOOM,
          // but we still want to reset if specific parameters for it are missing.
          // Or, if exploredHotspotPanZoomActive was true but the event is somehow missing now.
          transformToApply = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
        }
      } else {
        // This covers:
        // 1. exploredHotspotId is null (initial 'idle' state, or background click)
        // 2. exploredHotspotId is set, but exploredHotspotPanZoomActive is false (hotspot has no pan/zoom event)
        transformToApply = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
      }

      newImageTransform = constrainTransform(transformToApply);

    } else {
      // This block executes if moduleState is not 'learning' and not ('idle' AND '!isEditing').
      // This typically means isEditing is true, or some other unexpected state.
      // Default behavior here is to reset if a transform is active.
      if (lastAppliedTransformRef.current.scale !== 1 || lastAppliedTransformRef.current.translateX !== 0 || lastAppliedTransformRef.current.translateY !== 0) {
        const resetTransform = {
          scale: 1,
          translateX: 0,
          translateY: 0,
          targetHotspotId: undefined
        };
        newImageTransform = constrainTransform(resetTransform);
      } else {
        // If current transform is already default, keep it.
        newImageTransform = lastAppliedTransformRef.current;
      }
    }
    // Apply the determined transform at the end, only if it has actually changed
    const currentTransform = lastAppliedTransformRef.current;
    if (newImageTransform.scale !== currentTransform.scale ||
        Math.abs(newImageTransform.translateX - currentTransform.translateX) > 1 ||
        Math.abs(newImageTransform.translateY - currentTransform.translateY) > 1 ||
        newImageTransform.targetHotspotId !== currentTransform.targetHotspotId) {

      lastAppliedTransformRef.current = newImageTransform;
      applyTransform(newImageTransform);
    }

    return () => { if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current); };
  }, [currentStep, timelineEvents, hotspots, moduleState, exploredHotspotId, exploredHotspotPanZoomActive, isEditing, getSafeImageBounds, getSafeViewportCenter, constrainTransform, applyTransform]);

  // Debug effect to track transform changes and detect loops
  useEffect(() => {
    if (debugMode) {
      debugLog('Transform State', 'Transform changed', {
        scale: imageTransform.scale,
        translateX: imageTransform.translateX.toFixed(2),
        translateY: imageTransform.translateY.toFixed(2),
        targetHotspotId: imageTransform.targetHotspotId,
        stack: new Error().stack?.split('\n').slice(1, 4)
      });
    }
  }, [imageTransform, debugMode, debugLog]);

  // ✅ IMPORTANT: All hooks must be called before any early returns
  
  // Master cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
      }
      if (applyTransformTimeoutRef.current) {
        clearTimeout(applyTransformTimeoutRef.current);
      }
      if (debouncedApplyTransformTimeoutRef.current) {
        clearTimeout(debouncedApplyTransformTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (stateChangeTimeoutRef.current) {
        clearTimeout(stateChangeTimeoutRef.current);
      }
      if (saveAnimationTimeoutRef.current) {
        clearTimeout(saveAnimationTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Handle all early returns after ALL hooks are called to prevent React 310 errors
  if (!isInitialized) {
    return <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
      <div className="text-white">Initializing module...</div>
    </div>;
  }

  if (initError) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
        <div className="bg-red-800 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Initialization Error</h2>
          <p className="mb-4">{initError.message}</p>
          <button
            onClick={onReloadRequest ? onReloadRequest : () => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
          >
            {onReloadRequest ? 'Retry Initialization' : 'Reload Page'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="main-content"
      tabIndex={-1}
      className={`text-slate-200 ${isEditing ? 'fixed inset-0 z-50 bg-slate-900' : 'fixed inset-0 z-50 bg-slate-900'}`}
      // Add outline-none to prevent default focus ring if not desired, or style it appropriately
      // style={{ outline: 'none' }}
    >
      {isEditing ? (
        isMobile ? (
          <MobileEditorLayout
            projectName={projectName}
            backgroundImage={backgroundImage || null}
            hotspots={hotspots}
            timelineEvents={timelineEvents}
            currentStep={currentStep}
            isEditing={isEditing}
            onBack={handleAttemptClose}
            onSave={handleSave}
            isSaving={isSaving}
            showSuccessMessage={showSuccessMessage}
            onAddHotspot={handleAddHotspot}
            selectedHotspot={editingHotspot}
            onUpdateHotspot={(updates) => {
              if (editingHotspot) {
                const updatedHotspot = { ...editingHotspot, ...updates };
                setHotspots(prev => prev.map(h => h.id === editingHotspot.id ? updatedHotspot : h));
                setEditingHotspot(updatedHotspot);
              }
            }}
            onDeleteHotspot={() => {
              if (editingHotspot) {
                handleRemoveHotspot(editingHotspot.id);
                setEditingHotspot(null);
              }
            }}
            activePanelOverride={activeMobileEditorTab === 'properties' ? 'properties' : activeMobileEditorTab === 'timeline' ? 'timeline' : 'image'}
            onActivePanelChange={(panel) => {
              if (panel === 'properties') {
                setActiveMobileEditorTab('properties');
              } else if (panel === 'timeline') {
                setActiveMobileEditorTab('timeline');
              }
            }}
            onAddTimelineEvent={handleAddTimelineEvent}
            onUpdateTimelineEvent={handleUpdateTimelineEvent}
            onDeleteTimelineEvent={handleDeleteTimelineEvent}
          >
            {/* Pass the existing ImageEditCanvas as children */}
            <div
              ref={imageContainerRef}
              className="flex-1 relative bg-slate-700 min-h-0 overflow-hidden"
              {...(isMobile && isEditing ? touchGestureHandlers : {})}
            >
              <ImageEditCanvas
                backgroundImage={backgroundImage}
                editingZoom={editingZoom}
                actualImageRef={actualImageRef}
                zoomedImageContainerRef={zoomedImageContainerRef}
                scrollableContainerRef={scrollableContainerRef}
                imageContainerRef={imageContainerRef}
                hotspotsWithPositions={hotspotsWithPositions}
                pulsingHotspotId={pulsingHotspotId}
                activeHotspotDisplayIds={activeHotspotDisplayIds}
                isPlacingHotspot={isPlacingHotspot}
                onPlaceNewHotspot={handlePlaceNewHotspot}
                highlightedHotspotId={highlightedHotspotId}
                getHighlightGradientStyle={getHighlightGradientStyle}
                onImageLoad={handleImageLoad}
                onImageOrHotspotClick={(e, hotspotId) => handleImageOrHotspotClick(e, hotspotId)}
                onFocusHotspot={handleFocusHotspot}
                onEditHotspotRequest={handleOpenHotspotEditor}
                onHotspotPositionChange={handleHotspotPositionChange}
                onDragStateChange={handleDragStateChange}
                isDragModeActive={isDragModeActive}
                isEditing={isEditing}
                isMobile={true}
                currentStep={currentStep}
                timelineEvents={timelineEvents}
                onImageUpload={handleImageUpload}
                getImageBounds={getSafeImageBounds}
                imageNaturalDimensions={imageNaturalDimensions}
                imageFitMode={imageFitMode}
              />
            </div>
          </MobileEditorLayout>
        ) : (
          <div className="fixed inset-0 z-50 bg-slate-900 pt-14 overflow-hidden"> {/* Add pt-14 for toolbar space */}
            {/* Add Toolbar */}
            <div style={{ position: 'relative', zIndex: Z_INDEX.TOOLBAR }}>
            <EditorToolbar
              projectName={projectName}
              onBack={handleAttemptClose}
              onReplaceImage={handleImageUpload}
              onAddHotspot={handleAddHotspot} // Pass the consolidated handler for desktop
              isAutoProgression={isTimedMode}
              onToggleAutoProgression={setIsTimedMode}
              autoProgressionDuration={autoProgressionDuration}
              onAutoProgressionDurationChange={setAutoProgressionDuration}
              currentZoom={editingZoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onCenter={handleCenter}
              currentColorScheme={colorScheme}
              onColorSchemeChange={setColorScheme}
              onSave={handleSave}
              isSaving={isSaving}
              showSuccessMessage={showSuccessMessage}
              isMobile={isMobile} // Will be false here
              isPlacingHotspot={isPlacingHotspot} // Pass isPlacingHotspot
              project={projectId ? {
                id: projectId,
                title: projectName,
                description: '',
                interactiveData: {
                  backgroundImage,
                  backgroundType,
                  backgroundVideoType,
                  hotspots,
                  timelineEvents,
                  imageFitMode: 'contain' // Default, or use current imageFitMode
                }
              } : undefined}
              // Background props for EditorToolbar -> EnhancedModalEditorToolbar
              backgroundImage={backgroundImage}
              backgroundType={backgroundType}
              backgroundVideoType={backgroundVideoType}
              onBackgroundImageChange={setBackgroundImage}
              onBackgroundTypeChange={setBackgroundType}
              onBackgroundVideoTypeChange={setBackgroundVideoType}
            />
            </div>

            {/* Main editing content - remove toolbar height */}
            <div className="h-full">
              {/* Main Image Canvas Area - Full Width */}
            <div className="relative bg-slate-900 h-full" style={{ zIndex: Z_INDEX.IMAGE_BASE }}>
              {/* Full-screen image container with zoom */}
              <div className="absolute inset-0">
                <TransformIndicator />
                <PositioningDebugPanel />
                
                {/* Viewport Container - scales with manual zoom */}
                <div className="viewport-container">
                  {debugMode && (
                    <div className="absolute top-20 left-4 text-xs text-white bg-black/70 p-2 font-mono space-y-1" style={{ zIndex: Z_INDEX.DEBUG }}>
                      <div>Mode: {isEditing ? 'Editor' : 'Viewer'}</div>
                      <div>Image Bounds: {JSON.stringify(getSafeImageBounds(), null, 2)}</div>
                      <div>Transform: scale={imageTransform.scale.toFixed(2)}, x={imageTransform.translateX.toFixed(0)}, y={imageTransform.translateY.toFixed(0)}</div>
                      <div>Viewport Center: {JSON.stringify(getSafeViewportCenter())}</div>
                      <div>Image Fit: {imageFitMode}</div>
                      {imageNaturalDimensions && <div>Natural: {imageNaturalDimensions.width}x{imageNaturalDimensions.height}</div>}
                    </div>
                  )}

                  {/* Hotspot Debug Info */}
                  {debugMode && (
                    <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-md" style={{ zIndex: Z_INDEX.DEBUG }}>
                      <h3 className="font-bold mb-2">Hotspot Debug Info</h3>
                      <div>Hotspots Count: {hotspots.length}</div>
                      <div>Timeline Events Count: {timelineEvents.length}</div>
                      <div className="mt-2">
                        <strong>Hotspot IDs:</strong>
                        {hotspots.map(h => (
                          <div key={h.id} className="ml-2">{h.id}: "{h.title}"</div>
                        ))}
                      </div>
                      <div className="mt-2">
                        <strong>Show Events:</strong>
                        {timelineEvents.filter(e => e.type === InteractionType.SHOW_HOTSPOT).map(e => (
                          <div key={e.id} className="ml-2">Step {e.step}: {e.targetId}</div>
                        ))}
                      </div>
                      <div className="mt-2">
                        <strong>Current Step:</strong> {currentStep}
                      </div>
                      <div>
                        <strong>Visible Hotspots:</strong> {hotspots.filter(h => 
                          timelineEvents.some(e => 
                            e.type === InteractionType.SHOW_HOTSPOT && 
                            e.targetId === h.id && 
                            e.step <= currentStep
                          )
                        ).length}
                      </div>
                    </div>
                  )}
                  
                  {/* Refactored Image Edit Canvas for Desktop */}
                  <ImageEditCanvas
                    backgroundImage={backgroundImage}
                    editingZoom={editingZoom}
                    actualImageRef={actualImageRef}
                    zoomedImageContainerRef={zoomedImageContainerRef}
                    scrollableContainerRef={scrollableContainerRef} // This is the main scrollable area for desktop
                    imageContainerRef={imageContainerRef} // This ref was originally on the direct child of scrollableContainerRef.
                                                          // ImageEditCanvas's internal structure should use this for click context if needed, or its own refs.
                    hotspotsWithPositions={hotspotsWithPositions}
                    pulsingHotspotId={pulsingHotspotId}
                    activeHotspotDisplayIds={activeHotspotDisplayIds}
                    highlightedHotspotId={highlightedHotspotId}
                    getHighlightGradientStyle={getHighlightGradientStyle}
                    onImageLoad={handleImageLoad}
                  // Pass the unified click handler to ImageEditCanvas.
                  // This allows ImageEditCanvas to report clicks, which InteractiveModule then uses
                  // to determine if a hotspot or the background was clicked.
                  onImageOrHotspotClick={(e, hotspotId) => handleImageOrHotspotClick(e, hotspotId)}
                  onTouchStart={touchGestureHandlers.handleTouchStart}
                    onTouchMove={touchGestureHandlers.handleTouchMove}
                    onTouchEnd={touchGestureHandlers.handleTouchEnd}
                    // onFocusHotspot is kept for potential keyboard navigation or other accessibility features
                    // that might directly trigger focus on a hotspot.
                    onFocusHotspot={handleFocusHotspot}
                    // onEditHotspotRequest is kept for alternative ways to trigger editing,
                    // e.g., a context menu or a dedicated edit button on a hotspot (if implemented).
                    onEditHotspotRequest={handleOpenHotspotEditor} // Renamed from handleHotspotEditRequest
                    onHotspotPositionChange={handleHotspotPositionChange}
                    onDragStateChange={handleDragStateChange}
                    isDragModeActive={isDragModeActive}
                    isEditing={isEditing}
                    isMobile={false} // Explicitly false
                    currentStep={currentStep}
                    timelineEvents={timelineEvents}
                    onImageUpload={handleImageUpload}
                    getImageBounds={getSafeImageBounds}
                    imageNaturalDimensions={imageNaturalDimensions}
                    imageFitMode={imageFitMode}
                    previewOverlayEvent={previewOverlayEvent}
                    onPreviewOverlayUpdate={handlePreviewOverlayUpdate}
                 isPlacingHotspot={isPlacingHotspot} // Pass down isPlacingHotspot
                  />
                </div>

              </div>
            </div>
          </div>
          
          {/* Fixed Bottom Timeline */}
          <div className="absolute bottom-0 left-0 right-0" style={{ zIndex: Z_INDEX.TIMELINE }}>
            {backgroundImage && (
              <div className="bg-slate-800/95 backdrop-blur-sm shadow-lg">
                <HorizontalTimeline
                  uniqueSortedSteps={uniqueSortedSteps}
                  currentStep={currentStep}
                  onStepSelect={handleTimelineDotClick}
                  isEditing={isEditing}
                  timelineEvents={timelineEvents}
                  hotspots={hotspots}
                  isMobile={isMobile}
                />
              </div>
            )}
          </div>
        </div>
        )
      ) : (
        <div className={`flex flex-col bg-slate-900 ${isMobile ? 'min-h-screen' : 'fixed inset-0 z-50 overflow-hidden'}`}>
            {/* Toolbar (Mobile: flex-shrink-0, Desktop: fixed positioning handled by ViewerToolbar itself) */}
            <div className={`${isMobile ? 'flex-shrink-0' : ''}`} style={{ zIndex: Z_INDEX.TOOLBAR }}>
              <ViewerToolbar
                projectName={projectName}
                onBack={handleAttemptClose}
                moduleState={moduleState}
                onStartLearning={handleStartLearning}
                onStartExploring={handleStartExploring}
                hasContent={!!backgroundImage}
                isMobile={isMobile}
              />
            </div>
            
            {/* Main content area (Image + Timeline for Mobile) */}
            {/* Desktop: This div is part of the fixed layout, for Mobile: it's the flex-1 content area */}
            <div className={`flex-1 flex flex-col relative ${isMobile ? '' : 'h-full'}`}>
            {/* Image container with mobile-safe sizing */}
            {/* Desktop: flex-1 to take available space above timeline, Mobile: flex-1 and min-h-0 for proper flex behavior */}
            <div
              ref={isMobile ? viewerImageContainerRef : imageContainerRef} // Use specific ref for mobile
              className="flex-1 relative bg-slate-900 min-h-0" // min-h-0 is important for flex children that might overflow
              style={{ zIndex: Z_INDEX.IMAGE_BASE }}
              onClick={(e) => handleImageOrHotspotClick(e)} // Unified click handling for all devices
              {...(isMobile && !isEditing ? touchGestureHandlers : {})} // Apply gesture handlers for mobile viewer
            >
              <div
                className="w-full h-full flex items-center justify-center"
                role={backgroundImage ? "button" : undefined}
                aria-label={backgroundImage ? (isMobile ? "Interactive image area" : "Interactive image") : undefined}
              >
                {/* TransformIndicator and Debug can be kept for both, or made conditional */}
                <TransformIndicator />
                <PositioningDebugPanel />
                {debugMode && (
                  <div className="absolute top-4 left-4 text-xs text-white bg-black/70 p-2 font-mono space-y-1" style={{ zIndex: Z_INDEX.DEBUG, marginTop: isMobile ? '0' : '56px' /* Adjust for desktop toolbar if needed */ }}>
                    <div>Mode: Viewer (isMobile: {isMobile.toString()})</div>
                    <div>Image Bounds: {JSON.stringify(getSafeImageBounds(), null, 2)}</div>
                    <div>Transform: scale={imageTransform.scale.toFixed(2)}, x={imageTransform.translateX.toFixed(0)}, y={imageTransform.translateY.toFixed(0)}</div>
                    <div>Viewport Center: {JSON.stringify(getSafeViewportCenter())}</div>
                    <div>Image Fit: {imageFitMode}</div>
                    {imageNaturalDimensions && <div>Natural: {imageNaturalDimensions.width}x{imageNaturalDimensions.height}</div>}
                  </div>
                )}

                {backgroundImage ? (
                  <>
                    {/* Container div for the image - maintains transform */}
                    <div
                      ref={scaledImageDivRef}
                      className="relative flex items-center justify-center w-full h-full"
                      style={{
                        transformOrigin: 'center',
                        transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
                        transition: isTransforming ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        zIndex: imageTransform.scale > 1 ? Z_INDEX.IMAGE_TRANSFORMED : Z_INDEX.IMAGE_BASE,
                      }}
                    >
                      {/* Actual image element */}
                      <img
                        ref={actualImageRef} // Reuse the same ref name as editor for consistency
                        src={backgroundImage}
                        alt="Interactive module background"
                        className={getImageClassName()} // Helper function for responsive classes
                        style={getImageStyle()} // Helper function for dynamic styles
                        onLoad={(e) => {
                          setImageNaturalDimensions({
                            width: e.currentTarget.naturalWidth,
                            height: e.currentTarget.naturalHeight
                          });
                          if (backgroundType === 'image' || !backgroundType) {
                            setImageLoading(false);
                          }
                        }}
                        onError={() => {
                          console.error('Failed to load background image:', backgroundImage);
                          setImageNaturalDimensions(null);
                          if (backgroundType === 'image' || !backgroundType) {
                            setImageLoading(false);
                          }
                        }}
                        draggable={false}
                      />

                      {/* Video Rendering */}
                      {(backgroundType === 'video' && backgroundImage) ? (
                        backgroundVideoType === 'youtube' ? (
                          <YouTubePlayer
                            videoId={extractYouTubeVideoId(backgroundImage) || ''}
                            className="absolute inset-0 w-full h-full"
                            autoplay={true}
                            loop={true}
                            showControls={false} // No controls for background video
                            style={{ objectFit: imageFitMode }} // Apply fit mode
                          />
                        ) : backgroundVideoType === 'mp4' ? (
                          <VideoPlayer
                            src={backgroundImage}
                            className="absolute inset-0 w-full h-full"
                            autoplay={true}
                            loop={true}
                            muted={true}
                            style={{ objectFit: imageFitMode }} // Apply fit mode
                          />
                        ) : null // Should ideally show an error or fallback if video type is unknown
                      ) : null}
                      {/* End Conditional Background Content */}

                      {/* Highlight overlay */}
                      {(moduleState === 'learning' || isEditing) && highlightedHotspotId && activeHotspotDisplayIds.has(highlightedHotspotId) && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ ...getHighlightGradientStyle(), zIndex: Z_INDEX.HOTSPOTS - 1 }}
                          aria-hidden="true"
                        />
                      )}

                      {/* Hotspots container */}
                      <div className="absolute inset-0" style={{ zIndex: Z_INDEX.HOTSPOTS }}>
                        {hotspotsWithPositions.map(hotspot => {
                          const shouldShow = (moduleState === 'learning' && activeHotspotDisplayIds.has(hotspot.id)) || (moduleState === 'idle');
                          if (!shouldShow) return null;
                          return (
                            <HotspotViewer
                              key={hotspot.id}
                              hotspot={hotspot}
                              pixelPosition={hotspot.pixelPosition}
                              usePixelPositioning={true}
                              imageElement={actualImageRef.current} // Pass the img element reference
                              isPulsing={(moduleState === 'learning') && pulsingHotspotId === hotspot.id && activeHotspotDisplayIds.has(hotspot.id)}
                              isDimmedInEditMode={false}
                              isEditing={false}
                              onFocusRequest={handleHotspotClick}
                              isContinuouslyPulsing={(moduleState === 'idle') && !isTransforming && !isHotspotDragging}
                              isMobile={isMobile}
                              onDragStateChange={setIsHotspotDragging}
                            />
                          );
                        })}
                      </div>
                    </div>
                    {/* Initial view buttons overlay (common for desktop/mobile idle) */}
                    {moduleState === 'idle' && !isEditing && backgroundImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ zIndex: Z_INDEX.MODAL }}>
                        <div className="text-center space-y-4 sm:space-y-6 p-6 sm:p-8 bg-black/60 rounded-lg sm:rounded-2xl border border-white/20 shadow-xl sm:shadow-2xl max-w-xs sm:max-w-md">
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Interactive Module Ready</h2>
                            <p className="text-slate-300 text-xs sm:text-sm">Choose how you'd like to explore this content</p>
                          </div>
                          <div className="flex flex-col space-y-2.5 sm:space-y-3">
                            <button
                              onClick={handleStartExploring}
                              className="flex-1 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold py-2.5 sm:py-3 px-5 sm:px-6 rounded-md sm:rounded-lg shadow-lg hover:from-sky-500 hover:to-cyan-500 transition-all duration-200 text-sm sm:text-base"
                            >
                              Explore Module
                            </button>
                            <button
                              onClick={handleStartLearning}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 sm:py-3 px-5 sm:px-6 rounded-md sm:rounded-lg shadow-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 text-sm sm:text-base"
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
                    <p>No background image set.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile timeline / Desktop timeline container */}
            {/* Desktop: timeline is part of fixed layout, Mobile: flex-shrink-0 */}
            {backgroundImage && (
              <div
                ref={isMobile ? viewerTimelineRef : null} // Use specific ref for mobile
                className={`${isMobile ? 'flex-shrink-0 relative' : 'bg-slate-800 border-t border-slate-700 absolute bottom-0 left-0 right-0'}`}
                style={{ zIndex: Z_INDEX.TIMELINE }}
              >
                <HorizontalTimeline
                  uniqueSortedSteps={uniqueSortedSteps}
                  currentStep={currentStep}
                  onStepSelect={handleTimelineDotClick}
                  isEditing={isEditing}
                  timelineEvents={timelineEvents}
                  hotspots={hotspots}
                  moduleState={moduleState}
                  onPrevStep={handlePrevStep}
                  onNextStep={handleNextStep}
                  currentStepIndex={currentStepIndex}
                  totalSteps={totalTimelineInteractionPoints}
                  isMobile={isMobile}
                />
              </div>
            )}
          </div>
        </div>
      )}


      {/* Enhanced Hotspot Editor Modal - Conditional rendering for mobile vs desktop */}
      {isMobile ? (
        <MobileEditorModal
          isOpen={isHotspotModalOpen}
          hotspot={selectedHotspotForModal ? hotspots.find(h => h.id === selectedHotspotForModal) || null : null}
          timelineEvents={selectedHotspotForModal ? timelineEvents.filter(e => e.targetId === selectedHotspotForModal) : []}
          currentStep={currentStep}
          onUpdateHotspot={(updates) => {
            if (selectedHotspotForModal) {
              setHotspots(prev => prev.map(h => h.id === selectedHotspotForModal ? { ...h, ...updates } : h));
            }
          }}
          onDeleteHotspot={() => {
            if (selectedHotspotForModal) {
              handleRemoveHotspot(selectedHotspotForModal);
              setIsHotspotModalOpen(false);
              setSelectedHotspotForModal(null);
            }
          }}
          onAddTimelineEvent={handleAddTimelineEvent}
          onUpdateTimelineEvent={(updatedEvent) => {
            setTimelineEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
          }}
          onDeleteTimelineEvent={(eventId) => {
            setTimelineEvents(prev => prev.filter(e => e.id !== eventId));
          }}
          onClose={() => {
            setIsHotspotModalOpen(false);
            setSelectedHotspotForModal(null);
          }}
        />
      ) : (
        <HotspotEditorModal
          isOpen={isHotspotModalOpen}
          selectedHotspot={selectedHotspotForModal ? hotspots.find(h => h.id === selectedHotspotForModal) || null : null}
          relatedEvents={selectedHotspotForModal ? timelineEvents.filter(e => e.targetId === selectedHotspotForModal) : []}
          currentStep={currentStep}
          backgroundImage={backgroundImage || ''}
          onUpdateHotspot={(updatedHotspot) => {
            setHotspots(prev => prev.map(h => h.id === updatedHotspot.id ? updatedHotspot : h));
          }}
          onDeleteHotspot={(hotspotId) => {
            handleRemoveHotspot(hotspotId);
            setIsHotspotModalOpen(false);
            setSelectedHotspotForModal(null);
          }}
          onAddEvent={handleAddTimelineEvent}
          onUpdateEvent={(updatedEvent) => {
            setTimelineEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
          }}
          onDeleteEvent={(eventId) => {
            setTimelineEvents(prev => prev.filter(e => e.id !== eventId));
          }}
          onClose={() => {
            setIsHotspotModalOpen(false);
            setSelectedHotspotForModal(null);
          }}
          allHotspots={hotspots}
          onPreviewOverlay={(event) => {
            console.log('🔍 PREVIEW DEBUG: onPreviewOverlay called in InteractiveModule', { 
              event: event ? { id: event.id, type: event.type, name: event.name } : null
            });
            setPreviewOverlayEvent(event);
          }}
        />
      )}

      {/* Media Modal */}
      {mediaModal.isOpen && (
        <MediaModal
          isOpen={mediaModal.isOpen}
          onClose={closeMediaModal}
          title={mediaModal.title}
          size="large"
          disableTouch={mediaModal.type === 'image'}
        >
          {mediaModal.type === 'video' && mediaModal.data && (
            <VideoPlayer
              src={mediaModal.data.src}
              title={mediaModal.title}
              poster={mediaModal.data.poster}
              autoplay={mediaModal.data.autoplay}
              loop={mediaModal.data.loop}
              className="w-full h-full"
            />
          )}

          {mediaModal.type === 'audio' && mediaModal.data && (
            <div className="p-4 flex items-center justify-center min-h-0 flex-1" style={{
              minHeight: isMobile ? 'max(300px, calc(100vh - env(keyboard-inset-height, 0px) - 200px))' : '400px'
            }}>
              <AudioPlayer
                src={mediaModal.data.src}
                title={mediaModal.data.title}
                artist={mediaModal.data.artist}
                autoplay={mediaModal.data.autoplay}
                loop={mediaModal.data.loop}
                className="w-full max-w-lg"
              />
            </div>
          )}

          {mediaModal.type === 'image' && mediaModal.data && (
            <ImageViewer
              src={mediaModal.data.src}
              alt={mediaModal.data.alt}
              title={mediaModal.data.title}
              caption={mediaModal.data.caption}
              className="w-full h-full min-h-[500px]"
            />
          )}

          {mediaModal.type === 'youtube' && mediaModal.data && (
            <div className="p-4">
              <YouTubePlayer
                videoId={mediaModal.data.videoId}
                title={mediaModal.title}
                startTime={mediaModal.data.startTime}
                endTime={mediaModal.data.endTime}
                autoplay={mediaModal.data.autoplay}
                loop={mediaModal.data.loop}
                className="w-full"
              />
            </div>
          )}
        </MediaModal>
      )}
    </div>
  );
};

// Auto-save functionality for data protection
const useAutoSave = (
  isEditing: boolean,
  hotspots: HotspotData[],
  timelineEvents: TimelineEventData[],
  handleSave: () => Promise<void>
) => {
  const lastDataRef = useRef<string>('');
  
  useEffect(() => {
    if (!isEditing) return; // Remove hotspots.length requirement - auto-save even empty projects
    
    const currentData = JSON.stringify({ hotspots, timelineEvents });
    if (currentData === lastDataRef.current) return;
    
    lastDataRef.current = currentData;
    
    const autoSaveTimer = setTimeout(() => {
      console.log('Auto-saving project...');
      handleSave().catch(error => {
        console.error('Auto-save failed:', error);
      });
    }, 10000); // Auto-save every 10 seconds (3x faster)
    
    return () => clearTimeout(autoSaveTimer);
  }, [hotspots, timelineEvents, isEditing, handleSave]);
};

export default InteractiveModule;
