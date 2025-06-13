import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InteractiveModuleState, HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import FileUpload from './FileUpload';
import HotspotViewer from './HotspotViewer';
import TimelineControls from './TimelineControls';
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
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number, height: number} | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  const handleCenter = useCallback(() => {
    const container = scrollableContainerRef.current;
    const imageDisplay = zoomedImageContainerRef.current; // Or actualImageRef.current depending on what needs centering
    if (container && imageDisplay) {
      // const containerRect = container.getBoundingClientRect();
      // const imageRect = imageDisplay.getBoundingClientRect(); // Get dimensions of the zoomed image or its container

      // Calculate scroll positions to center the image
      // This logic might need adjustment based on how `editingZoom` affects `imageDisplay` dimensions
      // The goal is to set scrollLeft and scrollTop to center the content of imageDisplay within container.
      // A common approach:
      // container.scrollLeft = Math.max(0, (imageDisplay.scrollWidth * editingZoom - containerRect.width) / 2);
      // container.scrollTop = Math.max(0, (imageDisplay.scrollHeight * editingZoom - containerRect.height) / 2);
      // If using actualImageRef and its dimensions directly:

      // Simplified centering:
      // Get current dimensions of the scaled image content
      const imageContentWidth = (actualImageRef.current?.width || 0) * editingZoom;
      const imageContentHeight = (actualImageRef.current?.height || 0) * editingZoom;

      // Calculate scroll position to center this content within the container
      container.scrollLeft = Math.max(0, (imageContentWidth - container.clientWidth) / 2);
      container.scrollTop = Math.max(0, (imageContentHeight - container.clientHeight) / 2);
    }
  }, [editingZoom]); // Add other dependencies if necessary, like actualImageRef

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
    if (imageContainerRef.current) {
      setImageContainerRect(imageContainerRef.current.getBoundingClientRect());
      const resizeObserver = new ResizeObserver(() => {
        if (imageContainerRef.current) {
          setImageContainerRect(imageContainerRef.current.getBoundingClientRect());
        }
      });
      resizeObserver.observe(imageContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

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

  // Effect for managing InfoPanel anchor point
  useEffect(() => {
    if (activeHotspotInfoId && isEditing && actualImageRef.current) {
      const hotspot = hotspots.find(h => h.id === activeHotspotInfoId);
      if (hotspot) {
        const imgElement = actualImageRef.current;
        const imgRect = imgElement.getBoundingClientRect();
        const containerRect = imageContainerRef.current?.getBoundingClientRect();
        
        if (containerRect) {
          // Calculate hotspot position on the actual image
          const dotCenterX = imgRect.left + (hotspot.x / 100) * imgRect.width;
          const dotCenterY = imgRect.top + (hotspot.y / 100) * imgRect.height;
          
          // Convert to coordinates relative to the image container
          const anchorX = dotCenterX - containerRect.left;
          const anchorY = dotCenterY - containerRect.top;
          
          setInfoPanelAnchor({ x: anchorX, y: anchorY });
        }
      } else {
        setInfoPanelAnchor(null);
      }
    } else if (activeHotspotInfoId && !isEditing && imageContainerRef.current && scaledImageDivRef.current) {
      // Keep the old logic for viewer mode
      const hotspot = hotspots.find(h => h.id === activeHotspotInfoId);
      if (hotspot) {
        const containerRect = imageContainerRef.current.getBoundingClientRect();
        const scaledImgDivRect = scaledImageDivRef.current.getBoundingClientRect();

        const dotCenterXOnScaledImg = (hotspot.x / 100) * scaledImgDivRect.width;
        const dotCenterYOnScaledImg = (hotspot.y / 100) * scaledImgDivRect.height;

        const dotCenterXViewport = scaledImgDivRect.left + dotCenterXOnScaledImg;
        const dotCenterYViewport = scaledImgDivRect.top + dotCenterYOnScaledImg;
        
        const anchorX = dotCenterXViewport - containerRect.left;
        const anchorY = dotCenterYViewport - containerRect.top;

        setInfoPanelAnchor({ x: anchorX, y: anchorY });
      } else {
        setInfoPanelAnchor(null);
      }
    } else {
      setInfoPanelAnchor(null);
    }
  }, [activeHotspotInfoId, hotspots, editingZoom, imageNaturalDimensions, isEditing, imageTransform, imageContainerRect, viewportZoom]);


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
              if (targetHotspot && imageContainerRef.current) {
                const scale = event.zoomFactor || 2;
                const container = imageContainerRef.current;
                const containerRect = container.getBoundingClientRect();
                let imageWidth, imageHeight;
                
                if (isEditing && actualImageRef.current) {
                  // In editing mode, use the actual image dimensions
                  const imgRect = actualImageRef.current.getBoundingClientRect();
                  imageWidth = imgRect.width;
                  imageHeight = imgRect.height;
                } else if (!isEditing && scaledImageDivRef.current) {
                  // In viewer mode, calculate the effective image content area
                  const divRect = scaledImageDivRef.current.getBoundingClientRect();
                  
                  if (imageFitMode === 'cover' || imageFitMode === 'contain') {
                    // For cover/contain, we need to calculate the actual content area
                    // This is a simplified calculation - the real image content depends on aspect ratio
                    imageWidth = divRect.width;
                    imageHeight = divRect.height;
                  } else {
                    // For fill mode, the content fills the entire div
                    imageWidth = divRect.width;
                    imageHeight = divRect.height;
                  }
                } else {
                  // Fallback to container dimensions
                  imageWidth = containerRect.width;
                  imageHeight = containerRect.height;
                }
                
                // Calculate hotspot position on the unscaled image
                const hX = (targetHotspot.x / 100) * imageWidth; 
                const hY = (targetHotspot.y / 100) * imageHeight;
                
                // Calculate translation to center the hotspot in the container
                const centerX = containerRect.width / 2;
                const centerY = containerRect.height / 2;
                const translateX = centerX - hX * scale;
                const translateY = centerY - hY * scale;
                
                newImageTransform = { scale, translateX, translateY, targetHotspotId: event.targetId };
                newActiveHotspotInfoId = event.targetId;
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

      if (exploredHotspotId && exploredHotspotPanZoomActive) {
        const hotspot = hotspots.find(h => h.id === exploredHotspotId);
        const panZoomEvent = timelineEvents
            .filter(e => e.targetId === exploredHotspotId && e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT)
            .sort((a,b) => a.step - b.step)[0];

        if (hotspot && panZoomEvent && imageContainerRef.current) {
            const scale = panZoomEvent.zoomFactor || 2;
            const container = imageContainerRef.current;
            const containerRect = container.getBoundingClientRect();
            let imageWidth, imageHeight;
            
            if (isEditing && actualImageRef.current) {
              // In editing mode, use the actual image dimensions
              const imgRect = actualImageRef.current.getBoundingClientRect();
              imageWidth = imgRect.width;
              imageHeight = imgRect.height;
            } else if (!isEditing && scaledImageDivRef.current) {
              // In viewer mode, calculate the effective image content area
              const divRect = scaledImageDivRef.current.getBoundingClientRect();
              
              if (imageFitMode === 'cover' || imageFitMode === 'contain') {
                // For cover/contain, we need to calculate the actual content area
                // This is a simplified calculation - the real image content depends on aspect ratio
                imageWidth = divRect.width;
                imageHeight = divRect.height;
              } else {
                // For fill mode, the content fills the entire div
                imageWidth = divRect.width;
                imageHeight = divRect.height;
              }
            } else {
              // Fallback to container dimensions
              imageWidth = containerRect.width;
              imageHeight = containerRect.height;
            }
            
            // Calculate hotspot position on the unscaled image
            const hX = (hotspot.x / 100) * imageWidth; 
            const hY = (hotspot.y / 100) * imageHeight;
            
            // Calculate translation to center the hotspot in the container
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;
            const translateX = centerX - hX * scale;
            const translateY = centerY - hY * scale;
            
            setImageTransform({ scale, translateX, translateY, targetHotspotId: hotspot.id });
        } else { 
            setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
        }
      } else {
         setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
      }
    }
    
    return () => { if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current); };
  }, [currentStep, timelineEvents, hotspots, moduleState, exploredHotspotId, exploredHotspotPanZoomActive, isEditing, imageTransform.scale, imageTransform.translateX, imageTransform.translateY]); // Added imageTransform fields to dependencies

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
    if (!highlightedHotspotId || !backgroundImage || !scaledImageDivRef.current) return {};
    const hotspotToHighlight = hotspots.find(h => h.id === highlightedHotspotId);
    if (!hotspotToHighlight) return {};
    
    const currentEvents = timelineEvents.filter(e => e.step === currentStep);
    const eventData = currentEvents.find(e => e.type === InteractionType.HIGHLIGHT_HOTSPOT && e.targetId === highlightedHotspotId);
    
    // Radius needs to be scaled with the image zoom to maintain visual consistency
    const radius = (eventData?.highlightRadius || 60) * imageTransform.scale; 
    
    // Highlight position is relative to the scaled image div
    const highlightXPercent = hotspotToHighlight.x;
    const highlightYPercent = hotspotToHighlight.y;

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
                        transformOrigin: 'center',
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
                      {hotspots.map(hotspot => (
                        <HotspotViewer
                          key={hotspot.id}
                          hotspot={hotspot}
                          imageElement={actualImageRef.current}
                          isPulsing={pulsingHotspotId === hotspot.id && activeHotspotDisplayIds.has(hotspot.id)}
                          isDimmedInEditMode={currentStep > 0 && !timelineEvents.some(e => e.step === currentStep && e.targetId === hotspot.id && (e.type === InteractionType.SHOW_HOTSPOT || e.type === InteractionType.PULSE_HOTSPOT || e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT || e.type === InteractionType.HIGHLIGHT_HOTSPOT))}
                          isEditing={isEditing}
                          onFocusRequest={handleFocusHotspot}
                          onPositionChange={handleHotspotPositionChange}
                          isContinuouslyPulsing={false}
                        />
                      ))}
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
                      <div 
                        ref={scaledImageDivRef}
                        className="relative"
                        style={{
                          backgroundImage: `url(${backgroundImage})`,
                          backgroundSize: imageFitMode, 
                          backgroundPosition: 'center', 
                          backgroundRepeat: 'no-repeat',
                          transformOrigin: 'center',
                          transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
                          transition: 'transform 0.5s ease-in-out',
                          width: '80vw', // Centered, not full width
                          height: '80vh',
                          maxWidth: '1200px',
                          maxHeight: '800px'
                        }}
                        aria-hidden="true"
                      >
                        {(moduleState === 'learning' || isEditing) && highlightedHotspotId && backgroundImage && activeHotspotDisplayIds.has(highlightedHotspotId) && (
                          <div className="absolute inset-0 pointer-events-none" style={getHighlightGradientStyle()} aria-hidden="true"/>
                        )}
                        {hotspots.map(hotspot => (
                          (isEditing || (moduleState === 'learning' && activeHotspotDisplayIds.has(hotspot.id)) || (moduleState === 'idle')) && 
                          <HotspotViewer
                            key={hotspot.id}
                            hotspot={hotspot}
                            isPulsing={(moduleState === 'learning' || isEditing) && pulsingHotspotId === hotspot.id && activeHotspotDisplayIds.has(hotspot.id)}
                            isDimmedInEditMode={false}
                            isEditing={isEditing}
                            onFocusRequest={handleFocusHotspot}
                            onPositionChange={undefined}
                            isContinuouslyPulsing={moduleState === 'idle' && !isEditing && !exploredHotspotId}
                          />
                        ))}
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
