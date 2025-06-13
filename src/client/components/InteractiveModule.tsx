import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InteractiveModuleState, HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import FileUpload from './FileUpload';
import HotspotViewer from './HotspotViewer';
import HorizontalTimeline from './HorizontalTimeline';
import InfoPanel from './InfoPanel';
import HotspotEditModal from './HotspotEditModal';
import StreamlinedHotspotEditor from './StreamlinedHotspotEditor';
import EditorToolbar, { COLOR_SCHEMES } from './EditorToolbar';
import ViewerToolbar from './ViewerToolbar';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import LoadingSpinnerIcon from './icons/LoadingSpinnerIcon';
import CheckIcon from './icons/CheckIcon';

interface InteractiveModuleProps {
  initialData: InteractiveModuleState;
  isEditing: boolean;
  onSave: (data: InteractiveModuleState) => void;
  onClose?: () => void;
  projectName: string;
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


const InteractiveModule: React.FC<InteractiveModuleProps> = ({ initialData, isEditing, onSave, onClose, projectName }) => {
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(initialData.backgroundImage);
  const [hotspots, setHotspots] = useState<HotspotData[]>(initialData.hotspots);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>(initialData.timelineEvents);
  
  const [moduleState, setModuleState] = useState<'idle' | 'learning'>(isEditing ? 'learning' : 'idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // New state for enhanced features
  const [isTimedMode, setIsTimedMode] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<string>('Default');
  const [autoProgressionDuration, setAutoProgressionDuration] = useState<number>(3000);
  const [showHotspotEditModal, setShowHotspotEditModal] = useState<boolean>(false);
  const [editingHotspot, setEditingHotspot] = useState<HotspotData | null>(null);
  
  // Save state management
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  
  // Image display state
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain' | 'fill'>(initialData.imageFitMode || 'cover'); 
  
  const [activeHotspotDisplayIds, setActiveHotspotDisplayIds] = useState<Set<string>>(new Set()); // Hotspots to *render* (dots)
  const [pulsingHotspotId, setPulsingHotspotId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  
  // For the InfoPanel component
  const [activeHotspotInfoId, setActiveHotspotInfoId] = useState<string | null>(null);
  const [infoPanelAnchor, setInfoPanelAnchor] = useState<{ x: number, y: number } | null>(null);
  const [imageContainerRect, setImageContainerRect] = useState<DOMRectReadOnly | undefined>(undefined);
  const [activeEditorTab, setActiveEditorTab] = useState<'properties' | 'timeline'>('properties');

  const [pendingHotspot, setPendingHotspot] = useState<PendingHotspotInfo | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null); // Ref for the viewport that scales with manual zoom
  const scrollableContainerRef = useRef<HTMLDivElement>(null); // Ref for the outer scrollable container
  const scaledImageDivRef = useRef<HTMLDivElement>(null); // Ref for the div with background image
  
  // New refs for the img-based system (editing mode only)
  const zoomedImageContainerRef = useRef<HTMLDivElement>(null);
  const actualImageRef = useRef<HTMLImageElement>(null);

  const [imageTransform, setImageTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const [viewportZoom, setViewportZoom] = useState<number>(1); // Keep for viewer mode
  const [zoomOrigin, setZoomOrigin] = useState<{x: number, y: number}>({x: 50, y: 50}); // Keep for viewer mode
  
  // New state for editing mode
  const [editingZoom, setEditingZoom] = useState<number>(1); // Only for editing mode
  // Already exists for editor mode, ensure it's used in viewer mode too
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number, height: number} | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  // Debug mode for development
  const [debugMode] = useState(() => process.env.NODE_ENV === 'development' && localStorage.getItem('debug_positioning') === 'true');

  // Track if transform is transitioning for smooth animations
  const [isTransforming, setIsTransforming] = useState(false);

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

  useEffect(() => {
    if (!imageContainerRef.current) return;

    let resizeTimer: number | null = null;

    const handleResize = () => {
      if (imageContainerRef.current) {
        setImageContainerRect(imageContainerRef.current.getBoundingClientRect());

        // Debounce transform recalculation
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          // Recalculate transform if zoomed
          if (imageTransform.scale > 1 && imageTransform.targetHotspotId) {
            const targetHotspot = hotspots.find(h => h.id === imageTransform.targetHotspotId);
            if (targetHotspot) {
              const imageBounds = getImageBounds();
              const viewportCenter = getViewportCenter();

              if (imageBounds && viewportCenter) {
                const hotspotX = (targetHotspot.x / 100) * imageBounds.width;
                const hotspotY = (targetHotspot.y / 100) * imageBounds.height;

                const translateX = viewportCenter.centerX - (hotspotX * imageTransform.scale) - imageBounds.left;
                const translateY = viewportCenter.centerY - (hotspotY * imageTransform.scale) - imageBounds.top;

                setImageTransform(prev => ({
                  ...prev,
                  translateX,
                  translateY
                }));
              }
            }
          }
        }, 100);
      }
    };

    handleResize(); // Initial calculation
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(imageContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [imageTransform.scale, imageTransform.targetHotspotId, hotspots, getImageBounds, getViewportCenter]);

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
    setImageNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  }, []);

  // Universal helper to get the actual rendered image dimensions and position
  const getImageBounds = useCallback(() => {
    if (isEditing && actualImageRef.current && imageContainerRef.current) {
      // Editor mode: Use actual img element
      const imgRect = actualImageRef.current.getBoundingClientRect();
      const containerRect = imageContainerRef.current.getBoundingClientRect();

      return {
        // Image dimensions as rendered
        width: imgRect.width,
        height: imgRect.height,
        // Position relative to the image container
        left: imgRect.left - containerRect.left,
        top: imgRect.top - containerRect.top,
        // Absolute position for other calculations
        absoluteLeft: imgRect.left,
        absoluteTop: imgRect.top
      };
    } else if (!isEditing && scaledImageDivRef.current && imageContainerRef.current && backgroundImage && imageNaturalDimensions) {
      // Viewer mode: Calculate actual content area of background-image
      const divRect = scaledImageDivRef.current.getBoundingClientRect();
      const containerRect = imageContainerRef.current.getBoundingClientRect();

      // Calculate actual rendered dimensions based on fit mode
      const containerAspect = divRect.width / divRect.height;
      const imageAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;

      let width, height, left = 0, top = 0;

      if (imageFitMode === 'cover') {
        // Image covers entire container, may be clipped
        if (containerAspect > imageAspect) {
          width = divRect.width;
          height = width / imageAspect;
          top = (divRect.height - height) / 2;
        } else {
          height = divRect.height;
          width = height * imageAspect;
          left = (divRect.width - width) / 2;
        }
      } else if (imageFitMode === 'contain') {
        // Image fits entirely within container
        if (containerAspect > imageAspect) {
          height = divRect.height;
          width = height * imageAspect;
          left = (divRect.width - width) / 2;
        } else {
          width = divRect.width;
          height = width / imageAspect;
          top = (divRect.height - height) / 2;
        }
      } else { // fill
        // Image stretches to fill container
        width = divRect.width;
        height = divRect.height;
      }

      return {
        width,
        height,
        left: divRect.left - containerRect.left + left,
        top: divRect.top - containerRect.top + top,
        absoluteLeft: divRect.left + left,
        absoluteTop: divRect.top + top
      };
    }
    return null;
  }, [isEditing, backgroundImage, imageNaturalDimensions, imageFitMode]);

  // Helper to convert hotspot percentage to absolute pixel coordinates
  const getHotspotPixelPosition = useCallback((hotspot: HotspotData) => {
    const imageBounds = getImageBounds();
    if (!imageBounds) return null;

    // Apply any current transform
    const scale = imageTransform.scale;
    const translateX = imageTransform.translateX;
    const translateY = imageTransform.translateY;

    // Calculate base position on the image
    const baseX = (hotspot.x / 100) * imageBounds.width;
    const baseY = (hotspot.y / 100) * imageBounds.height;

    // Apply transform
    const transformedX = (baseX * scale) + translateX + imageBounds.left;
    const transformedY = (baseY * scale) + translateY + imageBounds.top;

    return {
      x: transformedX,
      y: transformedY,
      // Also return the base position for centering calculations
      baseX: baseX + imageBounds.left,
      baseY: baseY + imageBounds.top
    };
  }, [getImageBounds, imageTransform]);

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

  // Helper to constrain transforms and prevent UI overlap
  const constrainTransform = useCallback((transform: ImageTransformState): ImageTransformState => {
    const imageBounds = getImageBounds();
    const viewportCenter = getViewportCenter();

    if (!imageBounds || !viewportCenter || !imageContainerRef.current) {
      return transform;
    }

    const containerRect = imageContainerRef.current.getBoundingClientRect();

    // Calculate the scaled image dimensions using imageBounds for content size
    const scaledWidth = imageBounds.width * transform.scale;
    const scaledHeight = imageBounds.height * transform.scale;

    // Reserve space for UI elements
    const timelineHeight = !isEditing && uniqueSortedSteps.length > 0 ? 100 : 0;
    const sidebarWidth = isEditing ? 320 : 0; // Corrected: Was w-80 = 20rem = 320px

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
  }, [getImageBounds, getViewportCenter, isEditing, uniqueSortedSteps.length]);

  const applyTransform = useCallback((newTransform: ImageTransformState) => {
    setIsTransforming(true);
    setImageTransform(newTransform);

    // Reset transition flag after animation completes
    // Ensure this timeout matches the CSS transition duration (0.5s for viewer mode)
    setTimeout(() => {
      setIsTransforming(false);
    }, 500);
  }, [setImageTransform]); // Dependency: setImageTransform if it's from props, or empty if it's from local useState

  // Memoized hotspot positions to prevent recalculation
  const hotspotsWithPositions = useMemo(() => {
    return hotspots.map(hotspot => ({
      ...hotspot,
      pixelPosition: getHotspotPixelPosition(hotspot)
    }));
  }, [hotspots, getHotspotPixelPosition]);

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
    setActiveHotspotInfoId(null);
    setInfoPanelAnchor(null);
    setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
    setHighlightedHotspotId(null);
    setExploredHotspotId(null);
    setExploredHotspotPanZoomActive(false);

    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }
  }, [initialData, isEditing]);

// Universal InfoPanel positioning
useEffect(() => {
  if (activeHotspotInfoId) {
    const hotspot = hotspots.find(h => h.id === activeHotspotInfoId);
    if (hotspot) {
      const pixelPos = getHotspotPixelPosition(hotspot);
      if (pixelPos) {
        setInfoPanelAnchor({ x: pixelPos.x, y: pixelPos.y });
      } else {
        // Fallback to container-relative positioning
        if (imageContainerRef.current) {
          const containerRect = imageContainerRef.current.getBoundingClientRect();
          setInfoPanelAnchor({
            x: (hotspot.x / 100) * containerRect.width,
            y: (hotspot.y / 100) * containerRect.height
          });
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
}, [activeHotspotInfoId, hotspots, getHotspotPixelPosition, imageTransform]); // Added imageTransform dependency


  useEffect(() => {
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);

    let newActiveHotspotInfoId: string | null = null; // To determine which InfoPanel to show

    if (moduleState === 'learning') {
      const newActiveDisplayIds = new Set<string>();
      let newMessage: string | null = null;
      let newPulsingHotspotId: string | null = null;
      let newImageTransform: ImageTransformState = imageTransform;
      let newHighlightedHotspotId: string | null = null;
      
      const eventsForCurrentStep = timelineEvents.filter(event => event.step === currentStep);
      let stepHasPanZoomEvent = false;

      eventsForCurrentStep.forEach(event => {
        if (event.targetId) newActiveDisplayIds.add(event.targetId);
        switch (event.type) {
          case InteractionType.SHOW_MESSAGE: if (event.message) newMessage = event.message; break;
          case InteractionType.SHOW_HOTSPOT: if (event.targetId) newActiveHotspotInfoId = event.targetId; break;
          case InteractionType.PULSE_HOTSPOT:
            if (event.targetId) {
              newPulsingHotspotId = event.targetId; newActiveHotspotInfoId = event.targetId;
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

              const imageBounds = getImageBounds();
              const viewportCenter = getViewportCenter();

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
                
                // The provided formula is:
                // translateX = viewportCenter.centerX - (hotspotX * scale) - (imageBounds.left * scale);
                // translateY = viewportCenter.centerY - (hotspotY * scale) - (imageBounds.top * scale);
                // This formula assumes that the `transform-origin` for the scale is top-left (0,0) of the `scaledImageDivRef`,
                // and `imageBounds.left/top` are offsets within that.
                // Given `transform-origin: center` for `scaledImageDivRef`, this might need adjustment.
                // However, `getImageBounds()` calculates `imageBounds.left/top` as the offset of the *visible content area*
                // from the *container's* top-left.
                // And `imageTransform.translateX/Y` is applied to `scaledImageDivRef`.

                // Let's assume the provided formula is correct in the context of how these values are used.
                // The most important part is using `imageBounds.left/top` in the calculation.

                const translateX = viewportCenter.centerX - (hotspotX * scale) - (imageBounds.left * scale);
                const translateY = viewportCenter.centerY - (hotspotY * scale) - (imageBounds.top * scale);
                
                let newTransform = {
                  scale,
                  translateX,
                  translateY,
                  targetHotspotId: event.targetId
                };

                newTransform = constrainTransform(newTransform);

                newImageTransform = newTransform;
                newActiveHotspotInfoId = event.targetId;
              } else if (targetHotspot) { // imageBounds or viewportCenter might be null
                  // Fallback or error? For now, do nothing if critical info is missing.
                  // Or reset? The default is to reset if no pan/zoom event.
              }
            }
            break;
          case InteractionType.HIGHLIGHT_HOTSPOT:
            if (event.targetId) { newHighlightedHotspotId = event.targetId; newActiveHotspotInfoId = event.targetId; }
            break;
        }
      });

      if (!stepHasPanZoomEvent && (imageTransform.scale !== 1 || imageTransform.translateX !== 0 || imageTransform.translateY !== 0)) {
        newImageTransform = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
      }

      eventsForCurrentStep.forEach(event => {
        if (event.type === InteractionType.HIDE_HOTSPOT && event.targetId) {
          newActiveDisplayIds.delete(event.targetId);
          if (newPulsingHotspotId === event.targetId) newPulsingHotspotId = null;
          if (newHighlightedHotspotId === event.targetId) newHighlightedHotspotId = null;
          if (newImageTransform.targetHotspotId === event.targetId) newImageTransform = { scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined };
          if (newActiveHotspotInfoId === event.targetId) newActiveHotspotInfoId = null; // Hide info if hotspot is hidden
        }
      });
      
      setActiveHotspotDisplayIds(newActiveDisplayIds);
      setCurrentMessage(newMessage);
      setPulsingHotspotId(newPulsingHotspotId);
      setImageTransform(newImageTransform);
      setHighlightedHotspotId(newHighlightedHotspotId);
      setActiveHotspotInfoId(newActiveHotspotInfoId); // This will trigger InfoPanel
    
    } else if (moduleState === 'idle' && !isEditing) {
      setActiveHotspotDisplayIds(new Set(hotspots.map(h => h.id))); 
      setCurrentMessage(null);
      setPulsingHotspotId(null); 
      setHighlightedHotspotId(null); 
      setActiveHotspotInfoId(exploredHotspotId); // Show info for explored hotspot

      // This replaces the logic block for idle mode pan/zoom based on exploredHotspotId
      if (exploredHotspotId && exploredHotspotPanZoomActive) {
        const hotspot = hotspots.find(h => h.id === exploredHotspotId);
        const panZoomEvent = timelineEvents
          .filter(e => e.targetId === exploredHotspotId && e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT)
          .sort((a, b) => a.step - b.step)[0];

        if (hotspot && panZoomEvent) {
          const imageBounds = getImageBounds();
          const viewportCenter = getViewportCenter();

          if (imageBounds && viewportCenter) {
            const scale = panZoomEvent.zoomFactor || 2; // Use event's zoomFactor, fallback to 2
            const hotspotX = (hotspot.x / 100) * imageBounds.width;
            const hotspotY = (hotspot.y / 100) * imageBounds.height;
            const translateX = viewportCenter.centerX - (hotspotX * scale) - (imageBounds.left * scale);
            const translateY = viewportCenter.centerY - (hotspotY * scale) - (imageBounds.top * scale);
            
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
      if (imageTransform.scale !== 1 || imageTransform.translateX !== 0 || imageTransform.translateY !== 0) {
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
        // This is crucial if newImageTransform was not initialized to imageTransform at the start of the useEffect's logic.
        newImageTransform = imageTransform;
      }
    }
    // Apply the determined transform at the end, only if it has changed
    if (newImageTransform.scale !== imageTransform.scale ||
        newImageTransform.translateX !== imageTransform.translateX ||
        newImageTransform.translateY !== imageTransform.translateY ||
        newImageTransform.targetHotspotId !== imageTransform.targetHotspotId) {
      applyTransform(newImageTransform);
    }
    
    return () => { if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current); };
  }, [currentStep, timelineEvents, hotspots, moduleState, exploredHotspotId, exploredHotspotPanZoomActive, isEditing, imageTransform, getImageBounds, getViewportCenter, constrainTransform, applyTransform]);

  const handleFocusHotspot = useCallback((hotspotId: string) => {
    if (isEditing) {
      setActiveHotspotInfoId(hotspotId);
    } else if (moduleState === 'idle') {
      setExploredHotspotId(hotspotId);
      const firstEventForHotspot = timelineEvents
        .filter(e => e.targetId === hotspotId)
        .sort((a, b) => a.step - b.step)[0];
      setExploredHotspotPanZoomActive(!!(firstEventForHotspot && firstEventForHotspot.type === InteractionType.PAN_ZOOM_TO_HOTSPOT));
    }
    // In learning mode, clicks on dots don't typically change the active info panel unless it's a timeline driven change
  }, [isEditing, moduleState, timelineEvents]);


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
    setActiveHotspotInfoId(null);
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

  const handleTimelineDotClick = useCallback((step: number) => {
    if (moduleState === 'idle' && !isEditing) {
        setModuleState('learning');
        setExploredHotspotId(null);
        setExploredHotspotPanZoomActive(false);
        setActiveHotspotInfoId(null);
    }
    setCurrentStep(step);
  }, [moduleState, isEditing]);


  const handleImageUpload = useCallback((file: File) => {
    // If there's already an image and hotspots, warn the user
    if (backgroundImage && hotspots.length > 0) {
      const confirmReplace = confirm(
        `Replacing the image may affect hotspot positioning. You have ${hotspots.length} hotspot(s) that may need to be repositioned.\n\nDo you want to continue?`
      );
      if (!confirmReplace) return;
    }

    const reader = new FileReader();
    reader.onloadend = () => { setBackgroundImage(reader.result as string); };
    reader.readAsDataURL(file);
  }, [backgroundImage, hotspots.length]);

  const handleImageFitChange = useCallback((fitMode: 'cover' | 'contain' | 'fill') => {
    setImageFitMode(fitMode);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({ backgroundImage, hotspots, timelineEvents, imageFitMode });
      // Show success message
      setShowSuccessMessage(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      // Error handling is managed by parent component
    } finally {
      setIsSaving(false);
    }
  }, [backgroundImage, hotspots, timelineEvents, imageFitMode, onSave]);

  const handleAddHotspot = useCallback((imageXPercent: number, imageYPercent: number) => {
    const title = prompt("Enter hotspot title:", "New Hotspot");
    if (!title) { setPendingHotspot(null); return; }
    const description = prompt("Enter hotspot description:", "");
    
    // Get current color scheme
    const currentScheme = COLOR_SCHEMES.find(s => s.name === colorScheme) || COLOR_SCHEMES[0];
    
    const newHotspot: HotspotData = {
      id: `h${Date.now()}`, x: imageXPercent, y: imageYPercent, title,
      description: description || "Default description",
      color: currentScheme.colors[hotspots.length % currentScheme.colors.length],
      size: 'medium' // Default size
    };
    setHotspots(prev => [...prev, newHotspot]);
    setPendingHotspot(null);
    const newEventStep = editorMaxStep > 0 ? editorMaxStep : 1; 
    const newEvent: TimelineEventData = {
      id: `te_show_${newHotspot.id}_${Date.now()}`, step: newEventStep, name: `Show ${title}`,
      type: InteractionType.SHOW_HOTSPOT, targetId: newHotspot.id
    };
    setTimelineEvents(prev => [...prev, newEvent].sort((a,b) => a.step - b.step));
    if (isEditing) {
      setCurrentStep(newEventStep); 
      setActiveHotspotInfoId(newHotspot.id); // Show info panel for newly added hotspot in editor
    }
  }, [hotspots, colorScheme, timelineEvents, editorMaxStep, isEditing]);

  const handleEditHotspotRequest = useCallback((hotspotId: string) => {
    const hotspotToEdit = hotspots.find(h => h.id === hotspotId);
    if (!hotspotToEdit) return;
    setEditingHotspot(hotspotToEdit);
    setShowHotspotEditModal(true);
  }, [hotspots]);

  const handleSaveHotspot = useCallback((updatedHotspot: HotspotData) => {
    setHotspots(prevHotspots => 
      prevHotspots.map(h => h.id === updatedHotspot.id ? updatedHotspot : h)
    );
    setShowHotspotEditModal(false);
    setEditingHotspot(null);
  }, []);

  const handleHotspotPositionChange = useCallback((hotspotId: string, x: number, y: number) => {
    setHotspots(prevHotspots => 
      prevHotspots.map(h => h.id === hotspotId ? { ...h, x, y } : h)
    );
  }, []);


  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (pendingHotspot) { // If confirming a pending hotspot, don't place another
        const target = event.target as HTMLElement;
        if(target.closest('.hotspot-confirmation-dialog')) return; // Click was on confirmation
    }
    if (isEditing && backgroundImage && actualImageRef.current) {
        const target = event.target as HTMLElement;
        
        // Check if click is on UI elements
        if (target.closest('.hotspot-info-panel') || 
            target.closest('[role="button"][aria-label^="Hotspot:"]') || 
            target.closest('.image-navigation-controls') || 
            target.closest('.initial-view-buttons') || 
            target.closest('[aria-label="Module Timeline"]') || 
            target.closest('.timeline-controls-container')) {
          return;
        }
        
        const imgElement = actualImageRef.current;
        const imgRect = imgElement.getBoundingClientRect();
        
        // Check if click is within the image bounds
        if (event.clientX < imgRect.left || event.clientX > imgRect.right ||
            event.clientY < imgRect.top || event.clientY > imgRect.bottom) {
          setPendingHotspot(null);
          return;
        }
        
        // Calculate click position relative to the image
        const clickX = event.clientX - imgRect.left;
        const clickY = event.clientY - imgRect.top;
        
        // Convert to percentage of actual image dimensions
        const imageXPercent = (clickX / imgRect.width) * 100;
        const imageYPercent = (clickY / imgRect.height) * 100;
        
        // For visual pending marker (relative to the container)
        const container = imageContainerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const viewXPercent = ((event.clientX - containerRect.left) / containerRect.width) * 100;
          const viewYPercent = ((event.clientY - containerRect.top) / containerRect.height) * 100;
          
          setPendingHotspot({ viewXPercent, viewYPercent, imageXPercent, imageYPercent });
          setActiveHotspotInfoId(null);
        }

    } else if (moduleState === 'idle' && !isEditing && backgroundImage) {
        const target = event.target as HTMLElement;
        if (target.closest('.hotspot-info-panel') || target.closest('[role="button"][aria-label^="Hotspot:"]') || target.closest('.initial-view-buttons') || target.closest('[aria-label="Module Timeline"]')) {
          return; 
        }
        setExploredHotspotId(null);
        setExploredHotspotPanZoomActive(false);
        setActiveHotspotInfoId(null);
    } else if (isEditing && backgroundImage && !pendingHotspot) {
        // In editing mode, clicking empty space deselects hotspot
        const target = event.target as HTMLElement;
        if (target.closest('.hotspot-info-panel') || target.closest('[role="button"][aria-label^="Hotspot:"]') || target.closest('.image-navigation-controls') || target.closest('.initial-view-buttons') || target.closest('[aria-label="Module Timeline"]') || target.closest('.timeline-controls-container')) {
            return;
        }
        setActiveHotspotInfoId(null);
    }
  }, [isEditing, backgroundImage, imageTransform, moduleState, pendingHotspot, viewportZoom]);

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

  const handleRemoveHotspot = useCallback((hotspotId: string) => {
    if (!confirm(`Are you sure you want to remove hotspot ${hotspotId} and its related timeline events?`)) return;
    setHotspots(prev => prev.filter(h => h.id !== hotspotId));
    setTimelineEvents(prev => prev.filter(event => event.targetId !== hotspotId));
    if (activeHotspotInfoId === hotspotId) setActiveHotspotInfoId(null);
    if (exploredHotspotId === hotspotId) {
      setExploredHotspotId(null);
      setExploredHotspotPanZoomActive(false);
    }
  }, [activeHotspotInfoId, exploredHotspotId]);

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

    const imageBounds = getImageBounds();
    const containerRect = imageContainerRef.current.getBoundingClientRect();

    let highlightXPercent = hotspotToHighlight.x; // Fallback to original hotspot x percentage
    let highlightYPercent = hotspotToHighlight.y; // Fallback to original hotspot y percentage

    if (imageBounds && containerRect.width > 0 && containerRect.height > 0) {
      // Calculate the hotspot's center in pixels, relative to the image's content area origin
      const hotspotPixelX_withinImageContent = (hotspotToHighlight.x / 100) * imageBounds.width;
      const hotspotPixelY_withinImageContent = (hotspotToHighlight.y / 100) * imageBounds.height;

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

    // Ensure percentages are within bounds for safety if the gradient is applied to the container.
    // If hotspot x/y can be outside 0-100 (e.g. due to data error), this clips the gradient center.
    highlightXPercent = Math.max(0, Math.min(100, highlightXPercent));
    highlightYPercent = Math.max(0, Math.min(100, highlightYPercent));

    return {
      background: `radial-gradient(circle at ${highlightXPercent}% ${highlightYPercent}%, transparent 0%, transparent ${radius}px, rgba(0,0,0,0.7) ${radius + 10}px)`,
      transition: 'background 0.3s ease-in-out',
    };
  };
  
  const activeInfoHotspot = useMemo(() => {
    if (!activeHotspotInfoId) return null;
    return hotspots.find(h => h.id === activeHotspotInfoId) || null;
  }, [activeHotspotInfoId, hotspots]);


  return (
    <div className={`text-slate-200 ${isEditing ? 'fixed inset-0 z-50 bg-slate-900' : 'fixed inset-0 z-50 bg-slate-900'}`}>
      {isEditing ? (
        <div className="fixed inset-0 z-50 bg-slate-900 pt-14"> {/* Add pt-14 for toolbar space */}
          {/* Add Toolbar */}
          <EditorToolbar
            projectName={projectName}
            onBack={onClose || (() => {})}
            onReplaceImage={handleImageUpload}
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
          />
          
          {/* Main editing content - remove toolbar height */}
          <div className="flex h-full">
            {/* Main Image Canvas Area */}
          <div className="flex-1 relative bg-slate-900">
            {/* Full-screen image container with zoom */}
            <div className="absolute inset-0">
              {/* Viewport Container - scales with manual zoom */}
            {debugMode && (
              <div className="absolute top-20 left-4 text-xs text-white bg-black/70 p-2 z-50 font-mono space-y-1">
                <div>Mode: {isEditing ? 'Editor' : 'Viewer'}</div>
                <div>Image Bounds: {JSON.stringify(getImageBounds(), null, 2)}</div>
                <div>Transform: scale={imageTransform.scale.toFixed(2)}, x={imageTransform.translateX.toFixed(0)}, y={imageTransform.translateY.toFixed(0)}</div>
                <div>Viewport Center: {JSON.stringify(getViewportCenter())}</div>
                <div>Image Fit: {imageFitMode}</div>
                {imageNaturalDimensions && <div>Natural: {imageNaturalDimensions.width}x{imageNaturalDimensions.height}</div>}
              </div>
            )}
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
                    <div 
                      ref={zoomedImageContainerRef}
                      className="relative"
                      style={{
                        transform: `scale(${editingZoom})`,
                        transformOrigin: 'center', // As specified, though often top-left for editor canvas
                        transition: 'transform 0.2s ease-out',
                      }}
                    >
                      <img
                        ref={actualImageRef}
                        src={backgroundImage}
                        alt="Interactive module background"
                        className="block max-w-none"
                        style={{
                          width: scrollableContainerRef.current?.clientWidth || 'auto',
                          height: 'auto',
                        }}
                        onLoad={handleImageLoad}
                        draggable={false}
                      />
                      
                      {/* Highlight overlay */}
                      {highlightedHotspotId && backgroundImage && activeHotspotDisplayIds.has(highlightedHotspotId) && (
                        <div 
                          className="absolute inset-0 pointer-events-none" 
                          style={getHighlightGradientStyle()} 
                          aria-hidden="true"
                        />
                      )}
                      
                      {/* Hotspots */}
                      {hotspotsWithPositions.map(hotspot => { // Use hotspotsWithPositions
                        // const pixelPos = getHotspotPixelPosition(hotspot); // No longer needed here

                        return (
                          <HotspotViewer
                            key={hotspot.id}
                            hotspot={hotspot} // Pass the whole hotspot object which includes pixelPosition
                            pixelPosition={hotspot.pixelPosition} // Access pre-calculated position
                            usePixelPositioning={true}
                            imageElement={actualImageRef.current}
                            isPulsing={pulsingHotspotId === hotspot.id && activeHotspotDisplayIds.has(hotspot.id)}
                            isDimmedInEditMode={currentStep > 0 && !timelineEvents.some(e =>
                              e.step === currentStep &&
                              e.targetId === hotspot.id &&
                              (e.type === InteractionType.SHOW_HOTSPOT ||
                               e.type === InteractionType.PULSE_HOTSPOT ||
                               e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT ||
                               e.type === InteractionType.HIGHLIGHT_HOTSPOT)
                            )}
                            isEditing={isEditing}
                            onFocusRequest={handleFocusHotspot}
                            onPositionChange={handleHotspotPositionChange}
                            isContinuouslyPulsing={false}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <p className="text-lg mb-4">Upload an image to start editing</p>
                        <FileUpload onFileUpload={handleImageUpload} />
                      </div>
                    </div>
                  )}
                  
                  {pendingHotspot && imageContainerRef.current && (
                    <div 
                      className="absolute w-8 h-8 bg-green-500 opacity-70 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse flex items-center justify-center"
                      style={{ left: `${pendingHotspot.viewXPercent}%`, top: `${pendingHotspot.viewYPercent}%`}}
                      aria-hidden="true"
                    ><PlusIcon className="w-5 h-5 text-white"/></div>
                  )}

                  {/* InfoPanel */}
                  {activeInfoHotspot && infoPanelAnchor && imageContainerRect && (
                    <InfoPanel
                      hotspot={activeInfoHotspot}
                      anchorX={infoPanelAnchor.x}
                      anchorY={infoPanelAnchor.y}
                      imageContainerRect={imageContainerRect}
                      isEditing={isEditing}
                      onRemove={handleRemoveHotspot}
                      onEditRequest={handleEditHotspotRequest}
                      imageTransform={imageTransform}
                    />
                  )}
                </div>
              </div>
            </div>


            {/* Pending Hotspot Confirmation Overlay */}
            {pendingHotspot && !activeHotspotInfoId && (
              <div className="absolute top-4 right-80 z-10">
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-600">
                  <h4 className="text-md font-semibold mb-2 text-slate-200">🎯 Confirm New Hotspot</h4>
                  <p className="text-sm text-slate-300 mb-3">Position: {pendingHotspot.imageXPercent.toFixed(1)}%, {pendingHotspot.imageYPercent.toFixed(1)}%</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAddHotspot(pendingHotspot.imageXPercent, pendingHotspot.imageYPercent)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded"
                    >Add Hotspot</button>
                    <button 
                      onClick={() => setPendingHotspot(null)} 
                      className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded"
                    >Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Right Sidebar */}
          <div className="w-80 bg-slate-800 flex flex-col">
            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              {activeHotspotInfoId ? (
                <StreamlinedHotspotEditor
                  selectedHotspot={hotspots.find(h => h.id === activeHotspotInfoId)!}
                  relatedEvents={timelineEvents.filter(e => e.targetId === activeHotspotInfoId)}
                  allTimelineEvents={timelineEvents}
                  currentStep={currentStep}
                  onUpdateHotspot={(updatedHotspot) => {
                    setHotspots(prev => prev.map(h => h.id === updatedHotspot.id ? updatedHotspot : h));
                  }}
                  onDeleteHotspot={handleRemoveHotspot}
                  onAddEvent={handleAddTimelineEvent}
                  onUpdateEvent={(updatedEvent) => {
                    setTimelineEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
                  }}
                  onDeleteEvent={handleRemoveTimelineEvent}
                  onReorderEvents={(eventIds) => {
                    // Handle reordering - this is handled automatically in the component
                  }}
                  onJumpToStep={setCurrentStep}
                  onClose={() => setActiveHotspotInfoId(null)}
                />
              ) : (
                <div className="text-center text-slate-400 py-8 p-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No Hotspot Selected</h3>
                  <p className="text-sm">Click on a hotspot in the image to edit its properties and timeline events</p>
                  <p className="text-sm mt-2">Or click on the image to add a new hotspot</p>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Bottom Timeline */}
          <div className="absolute bottom-0 left-0 right-80 z-10">
            {backgroundImage && uniqueSortedSteps.length > 0 && (
              <div className="bg-slate-800/95 backdrop-blur-sm shadow-lg">
                <HorizontalTimeline
                  uniqueSortedSteps={uniqueSortedSteps}
                  currentStep={currentStep}
                  onStepSelect={handleTimelineDotClick}
                  isEditing={isEditing}
                  timelineEvents={timelineEvents}
                  hotspots={hotspots}
                />
              </div>
            )}
          </div>
        </div>
        </div>
      ) : (
        /* New Viewer Layout */
        <div className="fixed inset-0 z-50 bg-slate-900 pt-14">
          {/* Add ViewerToolbar */}
          <ViewerToolbar
            projectName={projectName}
            onBack={onClose || (() => {})}
            moduleState={moduleState}
            onStartLearning={handleStartLearning}
            onStartExploring={handleStartExploring}
            hasContent={!!backgroundImage}
          />
          
          {/* Main content area */}
          <div className="flex flex-col h-full">
            {/* Image container - full width */}
            <div className="flex-1 relative bg-slate-900">
              <div className="absolute inset-0">
            {debugMode && (
              <div className="absolute top-20 left-4 text-xs text-white bg-black/70 p-2 z-50 font-mono space-y-1">
                <div>Mode: {isEditing ? 'Editor' : 'Viewer'}</div>
                <div>Image Bounds: {JSON.stringify(getImageBounds(), null, 2)}</div>
                <div>Transform: scale={imageTransform.scale.toFixed(2)}, x={imageTransform.translateX.toFixed(0)}, y={imageTransform.translateY.toFixed(0)}</div>
                <div>Viewport Center: {JSON.stringify(getViewportCenter())}</div>
                <div>Image Fit: {imageFitMode}</div>
                {imageNaturalDimensions && <div>Natural: {imageNaturalDimensions.width}x{imageNaturalDimensions.height}</div>}
              </div>
            )}
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
                      {backgroundImage && !isEditing && (
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
                      <div 
                        ref={scaledImageDivRef}
                        className="relative"
                        style={{
                          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                          backgroundSize: imageFitMode,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          transformOrigin: 'center',
                          transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
                          transition: isTransforming ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                          width: '80vw', // From issue
                          height: '80vh', // From issue
                          maxWidth: '1200px', // From issue
                          maxHeight: '800px', // From issue
                        }}
                        aria-hidden="true"
                      >
                        {(moduleState === 'learning' || isEditing) && highlightedHotspotId && backgroundImage && activeHotspotDisplayIds.has(highlightedHotspotId) && (
                          <div className="absolute inset-0 pointer-events-none" style={getHighlightGradientStyle()} aria-hidden="true"/>
                        )}
                        {hotspotsWithPositions.map(hotspot => { // Use hotspotsWithPositions
                          const shouldShow = (moduleState === 'learning' && activeHotspotDisplayIds.has(hotspot.id)) ||
                                            (moduleState === 'idle');

                          if (!shouldShow) return null;

                          // const pixelPos = getHotspotPixelPosition(hotspot); // No longer needed here

                          return (
                            <HotspotViewer
                              key={hotspot.id}
                              hotspot={hotspot} // Pass the whole hotspot object which includes pixelPosition
                              pixelPosition={hotspot.pixelPosition} // Access pre-calculated position
                              usePixelPositioning={true}
                              isPulsing={(moduleState === 'learning' || isEditing) &&
                                         pulsingHotspotId === hotspot.id &&
                                         activeHotspotDisplayIds.has(hotspot.id)}
                              isDimmedInEditMode={false}
                              isEditing={false}
                              onFocusRequest={handleFocusHotspot}
                              isContinuouslyPulsing={moduleState === 'idle' && !exploredHotspotId}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Initial view buttons overlay when in idle mode */}
                      {moduleState === 'idle' && !isEditing && backgroundImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
                      
                      {/* InfoPanel */}
                      {activeInfoHotspot && infoPanelAnchor && imageContainerRect && (
                        <InfoPanel
                          hotspot={activeInfoHotspot}
                          anchorX={infoPanelAnchor.x}
                          anchorY={infoPanelAnchor.y}
                          imageContainerRect={imageContainerRect}
                          isEditing={isEditing}
                          onRemove={handleRemoveHotspot}
                          onEditRequest={handleEditHotspotRequest}
                          imageTransform={imageTransform}
                        />
                      )}
                    </>
                  ) : (
                    <div className="text-center text-slate-400">
                      <p>No background image set.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Timeline at bottom - full width */}
            {backgroundImage && uniqueSortedSteps.length > 0 && (
              <div className="bg-slate-800 border-t border-slate-700">
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
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hotspot Edit Modal */}
      <HotspotEditModal
        isOpen={showHotspotEditModal}
        onClose={() => {
          setShowHotspotEditModal(false);
          setEditingHotspot(null);
        }}
        onSave={handleSaveHotspot}
        hotspot={editingHotspot}
      />
    </div>
  );
};

export default InteractiveModule;
