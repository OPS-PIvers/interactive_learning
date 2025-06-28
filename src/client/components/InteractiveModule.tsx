import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { InteractiveModuleState, HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import FileUpload from './FileUpload';
import HotspotViewer from './HotspotViewer';
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
// import PendingHotspotConfirmation from './PendingHotspotConfirmation'; // Removed as per plan
import LoadingSpinnerIcon from './icons/LoadingSpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import ReactDOM from 'react-dom';
import { appScriptProxy } from '../../lib/firebaseProxy';
import MediaModal from './MediaModal';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import ImageViewer from './ImageViewer';
import YouTubePlayer from './YouTubePlayer';

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
    // Ensure that if fn() returns null, the fallback is used.
    // Also handles cases where fn() might return other falsy values if not strictly T | null
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
  onClose?: () => void;
  projectName: string;
  projectId?: string;
}

interface ImageTransformState {
  scale: number;
  translateX: number;
  translateY: number;
  targetHotspotId?: string; 
}

interface PendingHotspotInfo {
  viewXPercent: number; 
  viewYPercent: number; 
  imageXPercent: number; 
  imageYPercent: number; 
}


const InteractiveModule: React.FC<InteractiveModuleProps> = ({ initialData, isEditing, onSave, onClose, projectName, projectId }) => {
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(initialData.backgroundImage);
  const [hotspots, setHotspots] = useState<HotspotData[]>(initialData.hotspots);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>(initialData.timelineEvents);
  
  const [moduleState, setModuleState] = useState<'idle' | 'learning'>(isEditing ? 'learning' : 'idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [imageLoading, setImageLoading] = useState(false);
  const [positionCalculating, setPositionCalculating] = useState(false);
  const [isModeSwitching, setIsModeSwitching] = useState(false);
  
  // New state for enhanced features
  const [isTimedMode, setIsTimedMode] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<string>('Default');
  const [autoProgressionDuration, setAutoProgressionDuration] = useState<number>(3000);
  // const [showHotspotEditModal, setShowHotspotEditModal] = useState<boolean>(false); // Removed: To be consolidated
  const [editingHotspot, setEditingHotspot] = useState<HotspotData | null>(null);
  
  // Missing state declaration for imageContainerRect
  const [imageContainerRect, setImageContainerRect] = useState<DOMRect | null>(null);
  
  // Save state management
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  const isMobile = useIsMobile();
  const [activeMobileEditorTab, setActiveMobileEditorTab] = useState<MobileEditorActiveTab>('properties');
  const mobileEditorPanelRef = useRef<HTMLDivElement>(null); // Ref for Agent 4
  // const [showPlacementHint, setShowPlacementHint] = useState<boolean>(false); // Removed, was tied to pendingHotspot
  
  // Image display state
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain' | 'fill'>(initialData.imageFitMode || 'cover'); 
  
  const [activeHotspotDisplayIds, setActiveHotspotDisplayIds] = useState<Set<string>>(new Set()); // Hotspots to *render* (dots)
  const [pulsingHotspotId, setPulsingHotspotId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  
  // Removed old InfoPanel state - using modal now
  
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

  // const [pendingHotspot, setPendingHotspot] = useState<PendingHotspotInfo | null>(null); // Removed as per plan
  const imageContainerRef = useRef<HTMLDivElement>(null); // General container for image area
  const viewportContainerRef = useRef<HTMLDivElement>(null); // Ref for the viewport that scales with manual zoom
  const scrollableContainerRef = useRef<HTMLDivElement>(null); // Ref for the outer scrollable container (editor)
  const scaledImageDivRef = useRef<HTMLDivElement>(null); // Ref for the div with background image (viewer)
  
  // Refs for Agent 4 (Touch Handling) - As per AGENTS.md
  const viewerImageContainerRef = useRef<HTMLDivElement>(null); // Specifically for mobile viewer image area
  const viewerTimelineRef = useRef<HTMLDivElement>(null); // Specifically for mobile viewer timeline area

  // New refs for the img-based system (editing mode only)
  const zoomedImageContainerRef = useRef<HTMLDivElement>(null);
  const actualImageRef = useRef<HTMLImageElement>(null);

  const [imageTransform, setImageTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const [viewportZoom, setViewportZoom] = useState<number>(1); // Keep for viewer mode
  const [zoomOrigin, setZoomOrigin] = useState<{x: number, y: number}>({x: 50, y: 50}); // Keep for viewer mode
  const [isTransforming, setIsTransforming] = useState(false);
  
  // New state for editing mode
  const [editingZoom, setEditingZoom] = useState<number>(1); // Only for editing mode
  // Already exists for editor mode, ensure it's used in viewer mode too
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number, height: number} | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  
  // Refs to break dependency loops
  const isApplyingTransformRef = useRef(false);
  const lastAppliedTransformRef = useRef<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  
  // Store original untransformed bounds to prevent feedback loops
  const originalImageBoundsRef = useRef<{width: number, height: number, left: number, top: number, absoluteLeft: number, absoluteTop: number} | null>(null);

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

  // Helper to get the actual div dimensions (viewer mode only)
  const getScaledImageDivDimensions = useCallback(() => {
    const divWidth = 80 * window.innerWidth / 100; // 80vw
    const divHeight = 80 * window.innerHeight / 100; // 80vh
    const maxWidth = 1200;
    const maxHeight = 800;
    
    return {
      width: Math.min(divWidth, maxWidth),
      height: Math.min(divHeight, maxHeight)
    };
  }, []);

  const throttledRecalculatePositions = useMemo(
    () => throttle(() => {
      if (imageContainerRef.current) {
        setImageContainerRect(imageContainerRef.current.getBoundingClientRect());
        // Potentially other position-dependent logic could be called here if needed.
      }
    }, 100), // 100ms delay
    [setImageContainerRect] // Include setImageContainerRect to prevent closure issues
  );

  const uniqueSortedSteps = useMemo(() => {
    if (timelineEvents.length === 0) return isEditing ? [1] : [];
    const steps = [...new Set(timelineEvents.map(e => e.step))].sort((a, b) => a - b);
    return steps.length > 0 ? steps : (isEditing ? [1] : []);
  }, [timelineEvents, isEditing]);

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

  // Unified helper to calculate image content bounds for both editor and viewer modes
  const getImageBounds = useCallback(() => {
    if (!imageContainerRef.current || !backgroundImage || !imageNaturalDimensions) {
      return null;
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();

    if (isEditing && actualImageRef.current) {
      // Editor mode: Extract bounds from actual img element but normalize to match viewer calculations
      const imgRect = actualImageRef.current.getBoundingClientRect();
      
      // Get the natural dimensions and calculate how the image is fitted
      const containerWidth = imgRect.width;
      const containerHeight = imgRect.height;
      const imageAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;
      const containerAspect = containerWidth / containerHeight;

      // Calculate the actual rendered image content area (accounting for object-fit behavior)
      let contentWidth, contentHeight, contentLeft = 0, contentTop = 0;

      // Most img elements use object-fit: contain by default
      if (containerAspect > imageAspect) {
        // Container is wider - image height fills, width is letterboxed
        contentHeight = containerHeight;
        contentWidth = contentHeight * imageAspect;
        contentLeft = (containerWidth - contentWidth) / 2;
      } else {
        // Container is taller - image width fills, height is letterboxed
        contentWidth = containerWidth;
        contentHeight = contentWidth / imageAspect;
        contentTop = (containerHeight - contentHeight) / 2;
      }

      return {
        width: contentWidth,
        height: contentHeight,
        left: (imgRect.left - containerRect.left) + contentLeft,
        top: (imgRect.top - containerRect.top) + contentTop,
        absoluteLeft: imgRect.left + contentLeft,
        absoluteTop: imgRect.top + contentTop
      };
    } else if (!isEditing) {
      // Viewer mode: Calculate bounds based on background-image positioning
      
      // Use cached bounds if available and transform is active to prevent feedback loops
      if (originalImageBoundsRef.current && lastAppliedTransformRef.current.scale > 1) {
        return originalImageBoundsRef.current;
      }

      // Get the div's configured dimensions
      const divDimensions = getScaledImageDivDimensions();
      const containerAspect = divDimensions.width / divDimensions.height;
      const imageAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;

      let contentWidth, contentHeight, contentLeft = 0, contentTop = 0;

      // Calculate content area based on fit mode (same logic for consistency)
      if (imageFitMode === 'cover') {
        if (containerAspect > imageAspect) {
          contentWidth = divDimensions.width;
          contentHeight = contentWidth / imageAspect;
          contentTop = (divDimensions.height - contentHeight) / 2;
        } else {
          contentHeight = divDimensions.height;
          contentWidth = contentHeight * imageAspect;
          contentLeft = (divDimensions.width - contentWidth) / 2;
        }
      } else if (imageFitMode === 'contain') {
        if (containerAspect > imageAspect) {
          contentHeight = divDimensions.height;
          contentWidth = contentHeight * imageAspect;
          contentLeft = (divDimensions.width - contentWidth) / 2;
        } else {
          contentWidth = divDimensions.width;
          contentHeight = contentWidth / imageAspect;
          contentTop = (divDimensions.height - contentHeight) / 2;
        }
      } else { // fill
        contentWidth = divDimensions.width;
        contentHeight = divDimensions.height;
      }

      // Calculate div position within container
      const timelineHeight = uniqueSortedSteps.length > 0 ? 100 : 0;
      const availableHeight = containerRect.height - timelineHeight;
      const availableWidth = containerRect.width;
      
      const divLeft = (availableWidth - divDimensions.width) / 2;
      const divTop = (availableHeight - divDimensions.height) / 2;

      const bounds = {
        width: contentWidth,
        height: contentHeight,
        left: divLeft + contentLeft,
        top: divTop + contentTop,
        absoluteLeft: containerRect.left + divLeft + contentLeft,
        absoluteTop: containerRect.top + divTop + contentTop
      };

      // Cache the original bounds for viewer mode
      originalImageBoundsRef.current = bounds;
      return bounds;
    }
    
    return null;
  }, [isEditing, backgroundImage, imageNaturalDimensions, imageFitMode, getScaledImageDivDimensions, uniqueSortedSteps.length]);

  const getSafeImageBounds = useCallback(() => {
    return safeGetPosition(() => getImageBounds(), null); // Fallback is null as per original getImageBounds
  }, [getImageBounds]);

  // Helper to clear cached bounds when needed
  const clearImageBoundsCache = useCallback(() => {
    originalImageBoundsRef.current = null;
  }, []);

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
    const imageBounds = getSafeImageBounds();
    if (!imageBounds) return null;

    // Use provided transform or current transform
    const currentTransform = transform || lastAppliedTransformRef.current;
    
    // Get container dimensions for transform origin calculations
    let containerDimensions = null;
    if (!isEditing) {
      // Viewer mode: use div dimensions
      const divDimensions = getScaledImageDivDimensions();
      containerDimensions = divDimensions;
    } else if (imageContainerRef.current) {
      // Editor mode: use container dimensions
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      containerDimensions = { width: containerRect.width, height: containerRect.height };
    }

    // Calculate base position on the image content
    const baseX = (hotspot.x / 100) * imageBounds.width;
    const baseY = (hotspot.y / 100) * imageBounds.height;
    
    // Position relative to image bounds
    let positionX = imageBounds.left + baseX;
    let positionY = imageBounds.top + baseY;

    // Apply transforms if active
    if (currentTransform.scale !== 1 || currentTransform.translateX !== 0 || currentTransform.translateY !== 0) {
      if (containerDimensions) {
        const centerX = containerDimensions.width / 2;
        const centerY = containerDimensions.height / 2;
        
        // Apply center-origin transform
        positionX = (positionX - centerX) * currentTransform.scale + centerX + currentTransform.translateX;
        positionY = (positionY - centerY) * currentTransform.scale + centerY + currentTransform.translateY;
      }
    }

    return {
      x: positionX,
      y: positionY,
      // Also return the base position for centering calculations
      baseX: imageBounds.left + baseX,
      baseY: imageBounds.top + baseY
    };
  }, [getSafeImageBounds, getScaledImageDivDimensions, isEditing]);

  const getSafeHotspotPixelPosition = useCallback((hotspot: HotspotData) => {
    return safeGetPosition(
      () => getHotspotPixelPosition(hotspot),
      { x: 0, y: 0, baseX: 0, baseY: 0 } // Fallback to a default position object
    );
  }, [getHotspotPixelPosition]);

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
    const sidebarWidth = 0; // No sidebar anymore - removed

    // This is the available visual area for the image content
    const availableWidth = containerRect.width - sidebarWidth;
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
  }, [getSafeImageBounds, getSafeViewportCenter, isEditing, uniqueSortedSteps.length, getScaledImageDivDimensions]);

  const applyTransform = useCallback((newTransform: ImageTransformState) => {
    debugLog('Transform', 'Applying new transform', newTransform);
    isApplyingTransformRef.current = true;
    lastAppliedTransformRef.current = newTransform;
    setIsTransforming(true);
    setImageTransform(newTransform);

    // Reset flags after animation completes
    setTimeout(() => {
      setIsTransforming(false);
      isApplyingTransformRef.current = false;
    }, 500);
  }, [debugLog]);

  // Debounced transform to prevent rapid successive applications
  const debouncedApplyTransform = useMemo(
    () => {
      let timeoutId: number | null = null;
      return (newTransform: ImageTransformState) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => {
          applyTransform(newTransform);
        }, 16); // ~60fps
      };
    },
    [applyTransform]
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
  const [interactionParams, setInteractionParams] = useState({
    zoomFactor: 2.0,
    highlightRadius: 60,
    pulseDuration: 2000,
    showingZoomSlider: false,
    showingHighlightSlider: false,
    showingPulseSlider: false
  });

  useEffect(() => {
    if (!imageContainerRef.current) return;

    const handleResize = () => {
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
                
                const divDimensions = getScaledImageDivDimensions();
                const divCenterX = divDimensions.width / 2;
                const divCenterY = divDimensions.height / 2;
                
                const hotspotOriginalX = imageBounds.left + hotspotX;
                const hotspotOriginalY = imageBounds.top + hotspotY;
                
                const translateX = viewportCenter.centerX - (hotspotOriginalX - divCenterX) * currentTransform.scale - divCenterX;
                const translateY = viewportCenter.centerY - (hotspotOriginalY - divCenterY) * currentTransform.scale - divCenterY;
                
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
    };

    // Call it once initially
    if (imageContainerRef.current) {
       setImageContainerRect(imageContainerRef.current.getBoundingClientRect());
    }
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(imageContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [hotspots, getSafeImageBounds, getSafeViewportCenter, throttledRecalculatePositions, moduleState, getScaledImageDivDimensions]);

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
    setTimeout(() => {
      if (imageContainerRef.current) {
        setImageContainerRect(imageContainerRef.current.getBoundingClientRect());
      }
      setPositionCalculating(false);
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


  useEffect(() => {
    setBackgroundImage(initialData.backgroundImage);
    setHotspots(initialData.hotspots);
    setTimelineEvents(initialData.timelineEvents);
    setImageFitMode(initialData.imageFitMode || 'cover');
    
    const newInitialModuleState = isEditing ? 'learning' : 'idle';
    setModuleState(newInitialModuleState);
    
    const newUniqueSortedSteps = [...new Set(initialData.timelineEvents.map(e => e.step))].sort((a, b) => a - b);
    let initialStepValue = 1;
    if (newInitialModuleState === 'learning' && newUniqueSortedSteps.length > 0) {
        initialStepValue = newUniqueSortedSteps[0];
    } else if (newInitialModuleState === 'idle' && newUniqueSortedSteps.length > 0) {
        initialStepValue = newUniqueSortedSteps[0];
    }
    setCurrentStep(initialStepValue);
        
    setActiveHotspotDisplayIds(new Set());
    setPulsingHotspotId(null);
    setCurrentMessage(null);
    setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
    setHighlightedHotspotId(null);
    setExploredHotspotId(null);
    setExploredHotspotPanZoomActive(false);

    // Clear cached bounds when data changes
    clearImageBoundsCache();
    lastAppliedTransformRef.current = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };

    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
  }, [initialData, isEditing, clearImageBoundsCache]);

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
    // } else if (pendingHotspot) { // Removed pendingHotspot logic
    //   setPendingHotspot(null);
    //   return true;
    }
    return false;
  }, [imageTransform, isHotspotModalOpen]);

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

  // Consider refactoring handleKeyDown into smaller, modular functions for each shortcut
  useEffect(() => {
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

      if (e.key === 'ArrowLeft') {
        preventDefault = handleArrowLeftKey();
      } else if (e.key === 'ArrowRight') {
        preventDefault = handleArrowRightKey();
      } else if (e.key === 'Escape') {
        preventDefault = handleEscapeKey();
      } else if (e.key === '+' || e.key === '=') {
        preventDefault = handlePlusKey(e);
      } else if (e.key === '-') {
        preventDefault = handleMinusKey(e);
      } else if (e.key === '0') {
        preventDefault = handleZeroKey(e);
      }

      if (preventDefault) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    debugLog,
    handleArrowLeftKey,
    handleArrowRightKey,
    handleEscapeKey,
    handlePlusKey,
    handleMinusKey,
    handleZeroKey
  ]);

// Removed InfoPanel positioning - using modal now


  useEffect(() => {
    // Add safety checks to prevent temporal dead zone issues
    if (!getSafeImageBounds || !getSafeViewportCenter || !constrainTransform || !applyTransform || !timelineEvents || !hotspots) {
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
                const divDimensions = getScaledImageDivDimensions();
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
                
                let newTransform = {
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

                const divDimensions = getScaledImageDivDimensions();
                const divCenterX = divDimensions.width / 2;
                const divCenterY = divDimensions.height / 2;
                
                const hotspotOriginalX = imageBounds.left + hotspotX;
                const hotspotOriginalY = imageBounds.top + hotspotY;
                
                const translateX = viewportCenter.centerX - (hotspotOriginalX - divCenterX) * scale - divCenterX;
                const translateY = viewportCenter.centerY - (hotspotOriginalY - divCenterY) * scale - divCenterY;
                
                let newTransform = {
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

      // This replaces the logic block for idle mode pan/zoom based on exploredHotspotId
      if (exploredHotspotId && exploredHotspotPanZoomActive) {
        const hotspot = hotspots.find(h => h.id === exploredHotspotId);
        const panZoomEvent = timelineEvents
          .filter(e => e.targetId === exploredHotspotId && e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT)
          .sort((a, b) => a.step - b.step)[0];

        if (hotspot && panZoomEvent) {
          const imageBounds = getSafeImageBounds();
          const viewportCenter = getSafeViewportCenter();

          if (imageBounds && viewportCenter) {
            const scale = panZoomEvent.zoomFactor || 2; // Use event's zoomFactor, fallback to 2
            const hotspotX = (hotspot.x / 100) * imageBounds.width;
            const hotspotY = (hotspot.y / 100) * imageBounds.height;
            
            // Calculate translation for center-origin transform (same as above)
            const divDimensions = getScaledImageDivDimensions();
            const divCenterX = divDimensions.width / 2;
            const divCenterY = divDimensions.height / 2;
            
            const hotspotOriginalX = imageBounds.left + hotspotX;
            const hotspotOriginalY = imageBounds.top + hotspotY;
            
            const translateX = viewportCenter.centerX - (hotspotOriginalX - divCenterX) * scale - divCenterX;
            const translateY = viewportCenter.centerY - (hotspotOriginalY - divCenterY) * scale - divCenterY;
            
            let transform = {
              scale,
              translateX,
              translateY,
              targetHotspotId: hotspot.id
            };
            newImageTransform = constrainTransform(transform); // Assign to newImageTransform
          } else {
            // Fallback if imageBounds or viewportCenter is null
            newImageTransform = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
          }
        } else {
          // Fallback if hotspot or its panZoomEvent is not found
          newImageTransform = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
        }
      } else if (exploredHotspotId && !exploredHotspotPanZoomActive) {
        // If a hotspot was explored and zoomed, but pan/zoom is no longer active (e.g., mouse out),
        // set to reset. This specific reset will be harmonized by the general reset logic in step 4
        // if no other zoom condition (like stepHasPanZoomEvent) is active.
        newImageTransform = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
      }
      // Note: If 'exploredHotspotId' itself is null, this entire block is skipped.
      // The general transform reset logic (to be updated in step 4) should handle the default case
      // where neither timeline-driven pan/zoom nor idle-explored-hotspot pan/zoom is active.
      //setImageTransform(newImageTransform); // Apply the determined transform // This line is removed as per the logic flow of the issue
    } else {
      // This block executes if no PAN_ZOOM_TO_HOTSPOT event is active for the current step,
      // AND idle mode pan/zoom (exploredHotspotId && exploredHotspotPanZoomActive) is also not active.
      if (lastAppliedTransformRef.current.scale !== 1 || lastAppliedTransformRef.current.translateX !== 0 || lastAppliedTransformRef.current.translateY !== 0) {
        // If the current transform is not the default, a reset is needed.
        const resetTransform = {
          scale: 1,
          translateX: 0,
          translateY: 0,
          targetHotspotId: undefined
        };
        // Apply constraints even to the reset state.
        newImageTransform = constrainTransform(resetTransform);
      } else {
        // If the current transform is already the default, ensure newImageTransform is set to this default state.
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
  }, [currentStep, timelineEvents, hotspots, moduleState, exploredHotspotId, exploredHotspotPanZoomActive, isEditing, getSafeImageBounds, getSafeViewportCenter, constrainTransform, applyTransform, getScaledImageDivDimensions]);

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

  // Move handleSave before useAutoSave to fix temporal dead zone
  const handleSave = useCallback(async () => {
    // Prevent multiple simultaneous saves
    if (isSaving) {
      console.log('Save already in progress, skipping...');
      return;
    }
    
    setIsSaving(true);
    console.log('=== SAVE DEBUG ===');
    
    // Wait for any pending state updates to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get fresh state values to ensure consistency
    const currentData = {
      backgroundImage,
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
      // Use ref to track timeout and clear on unmount
      const timeoutId = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timeoutId);
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

  const handleImageFitChange = useCallback((fitMode: 'cover' | 'contain' | 'fill') => {
    setImageFitMode(fitMode);
  }, []);

  // New handleAddHotspot function as per plan
  // Note: Direct state setters (setHotspots, setEditingHotspot, setTimelineEvents, setCurrentStep) are used here
  // for simplicity and because the individual state updates are relatively independent and don't require
  // the more complex batching provided by `batchedSetState` which is used in `handleAttemptClose` for resetting multiple states.
  const handleAddHotspot = useCallback(() => {
    const currentScheme = COLOR_SCHEMES.find(s => s.name === colorScheme) || COLOR_SCHEMES[0];
    const defaultColor = currentScheme.colors[hotspots.length % currentScheme.colors.length];

    const newHotspotData: HotspotData = {
      id: `h${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: 50, // Default center position
      y: 50, // Default center position
      title: "New Hotspot",
      description: "Default description",
      color: defaultColor,
      size: 'medium',
    };

    setHotspots(prevHotspots => [...prevHotspots, newHotspotData]);
    // setEditingHotspot(newHotspotData); // Removed: control HotspotEditorModal via isHotspotModalOpen & selectedHotspotForModal
    setSelectedHotspotForModal(newHotspotData.id); // Set the ID of the new hotspot
    setIsHotspotModalOpen(true); // Open the HotspotEditorModal

    // Optional: Create a default "SHOW_HOTSPOT" timeline event for the new hotspot
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
      setCurrentStep(newEventStep); // Optionally focus the timeline on this new event's step
    }
  }, [hotspots, timelineEvents, colorScheme, isEditing, setHotspots, setSelectedHotspotForModal, setIsHotspotModalOpen, setCurrentStep]); // Updated dependencies

  // Removed the first handleEditHotspotRequest (was for HotspotEditModal)

  // Unified handler for opening the HotspotEditorModal for an existing hotspot
  const handleOpenHotspotEditor = useCallback((hotspotId: string) => {
    setSelectedHotspotForModal(hotspotId);
    setIsHotspotModalOpen(true);
  }, [setSelectedHotspotForModal, setIsHotspotModalOpen]);

  // Removed handleSaveHotspot (was for HotspotEditModal)

  const handleHotspotPositionChange = useCallback((hotspotId: string, x: number, y: number) => {
    setHotspots(prevHotspots => 
      prevHotspots.map(h => h.id === hotspotId ? { ...h, x, y } : h)
    );
  }, []);


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
  }, [hotspots, moduleState, isEditing, backgroundImage]);


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

  const handleRemoveTimelineEvent = useCallback((eventId: string) => {
    if (!confirm(`Are you sure you want to remove timeline event ${eventId}?`)) return;
    setTimelineEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

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
    const containerRect = imageContainerRef.current.getBoundingClientRect();

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
      const containerRect = imageContainerRef.current?.getBoundingClientRect();
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
    const containerRect = imageContainerRef.current?.getBoundingClientRect();

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

    // Reset internal states of InteractiveModule
    batchedSetState([
      () => setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined }),
      () => setEditingZoom(1),
      () => setExploredHotspotId(null),
      () => setPulsingHotspotId(null),
      () => setHighlightedHotspotId(null),
      // Add any other relevant states from InteractiveModule that need resetting
    ]);

    setTimeout(() => {
      debugLog('ModeSwitch', 'Executing actual close action.');
      if (onClose) {
        onClose();
      }
      // The issue also mentions setIsModalOpen(false), setSelectedProject(null), etc.
      // These would be handled by the parent component that calls onClose.

      setIsModeSwitching(false);
      debugLog('ModeSwitch', 'Mode switch / close sequence finished.');
    }, 100); // 100ms delay
  }, [
    isModeSwitching,
    onClose,
    batchedSetState,
    debugLog,
    setImageTransform,
    setEditingZoom,
    setExploredHotspotId,
    setPulsingHotspotId,
    setHighlightedHotspotId
  ]);


  return (
    <div className={`text-slate-200 ${isEditing ? 'fixed inset-0 z-50 bg-slate-900' : 'fixed inset-0 z-50 bg-slate-900'}`}>
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
                highlightedHotspotId={highlightedHotspotId}
                getHighlightGradientStyle={getHighlightGradientStyle}
                onImageLoad={handleImageLoad}
                onImageOrHotspotClick={(e, hotspotId) => handleImageOrHotspotClick(e, hotspotId)}
                onFocusHotspot={handleFocusHotspot}
                onEditHotspotRequest={handleOpenHotspotEditor}
                onHotspotPositionChange={handleHotspotPositionChange}
                isEditing={isEditing}
                isMobile={true}
                currentStep={currentStep}
                timelineEvents={timelineEvents}
                onImageUpload={handleImageUpload}
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
                  // pendingHotspot={pendingHotspot} // Removed pendingHotspot
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
                    isEditing={isEditing}
                    isMobile={false} // Explicitly false
                    currentStep={currentStep}
                    timelineEvents={timelineEvents}
                    onImageUpload={handleImageUpload}
                  />
                </div>

                {/* Pending Hotspot Confirmation Overlay for Desktop - REMOVED */}
                {/* {pendingHotspot && (
                  <PendingHotspotConfirmation
                    pendingHotspot={pendingHotspot}
                    onConfirm={handleAddHotspot}
                    onCancel={() => {
                      // setPendingHotspot(null); // Removed
                      setShowPlacementHint(false);
                    }}
                  />
                )} */}
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
              onClick={!isMobile ? (e) => handleImageOrHotspotClick(e) : undefined} // Desktop handles general image click for reset
              {...(isMobile && !isEditing ? touchGestureHandlers : {})} // Apply gesture handlers for mobile viewer
            >
              <div
                className="w-full h-full flex items-center justify-center"
                onClick={isMobile ? (e) => handleImageOrHotspotClick(e) : undefined} // Mobile handles its own click for reset here
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
                    {/* Hidden image for natural dimensions, used by both desktop and mobile */}
                    {!isEditing && (
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
                    )}
                    {/* Scaled Image Div (used for background image and hotspots) */}
                    <div
                      ref={scaledImageDivRef} // This ref is used by getSafeImageBounds for viewer mode
                      className="relative" // Ensure positioning context for hotspots
                      style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: imageFitMode,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        transformOrigin: 'center',
                        transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
                        transition: isTransforming ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        // Sizing: Use 100% of parent for mobile, specific viewport % for desktop
                        width: isMobile ? '100%' : '80vw',
                        height: isMobile ? '100%' : '80vh',
                        maxWidth: isMobile ? '100%' : '1200px',
                        maxHeight: isMobile ? '100%' : '800px',
                        zIndex: imageTransform.scale > 1 ? Z_INDEX.IMAGE_TRANSFORMED : Z_INDEX.IMAGE_BASE,
                      }}
                      aria-hidden="true"
                    >
                      {/* Highlight Overlay */}
                      {(moduleState === 'learning' || isEditing) && highlightedHotspotId && activeHotspotDisplayIds.has(highlightedHotspotId) && (
                        <div className="absolute inset-0 pointer-events-none" style={{ ...getHighlightGradientStyle(), zIndex: Z_INDEX.HOTSPOTS - 1 }} aria-hidden="true"/>
                      )}
                      {/* Hotspots */}
                      <div style={{ zIndex: Z_INDEX.HOTSPOTS }}>
                        {hotspotsWithPositions.map(hotspot => {
                          const shouldShow = (moduleState === 'learning' && activeHotspotDisplayIds.has(hotspot.id)) || (moduleState === 'idle');
                          if (!shouldShow) return null;
                          return (
                            <MemoizedHotspotViewer
                              key={hotspot.id}
                              hotspot={hotspot}
                              pixelPosition={hotspot.pixelPosition}
                              usePixelPositioning={true}
                              isPulsing={(moduleState === 'learning') && pulsingHotspotId === hotspot.id && activeHotspotDisplayIds.has(hotspot.id)}
                              isDimmedInEditMode={false} // Not in editing mode here
                              isEditing={false}
                              onFocusRequest={handleFocusHotspot}
                              onEditRequest={handleOpenHotspotEditor} // Should not be called in viewer
                              isContinuouslyPulsing={moduleState === 'idle' && !exploredHotspotId}
                              isMobile={isMobile}
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
        />
      )}

      {/* Media Modal */}
      {mediaModal.isOpen && (
        <MediaModal
          isOpen={mediaModal.isOpen}
          onClose={closeMediaModal}
          title={mediaModal.title}
          size="large"
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
            <div className="p-4 flex items-center justify-center min-h-[400px]">
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
