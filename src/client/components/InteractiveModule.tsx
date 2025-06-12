import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InteractiveModuleState, HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import FileUpload from './FileUpload';
import HotspotViewer from './HotspotViewer';
import TimelineControls from './TimelineControls';
import HorizontalTimeline from './HorizontalTimeline';
import InfoPanel from './InfoPanel';
import HotspotPulseSettings from './HotspotPulseSettings';
import HotspotEditModal from './HotspotEditModal';
import ImageControls from './ImageControls';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import LoadingSpinnerIcon from './icons/LoadingSpinnerIcon';
import CheckIcon from './icons/CheckIcon';

interface InteractiveModuleProps {
  initialData: InteractiveModuleState;
  isEditing: boolean;
  onSave: (data: InteractiveModuleState) => void;
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


const InteractiveModule: React.FC<InteractiveModuleProps> = ({ initialData, isEditing, onSave, projectName }) => {
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(initialData.backgroundImage);
  const [hotspots, setHotspots] = useState<HotspotData[]>(initialData.hotspots);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>(initialData.timelineEvents);
  
  const [moduleState, setModuleState] = useState<'idle' | 'learning'>(isEditing ? 'learning' : 'idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // New state for enhanced features
  const [isTimedMode, setIsTimedMode] = useState<boolean>(false);
  const [showPulseSettings, setShowPulseSettings] = useState<boolean>(false);
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

  const [imageTransform, setImageTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const [viewportZoom, setViewportZoom] = useState<number>(1);
  const [zoomOrigin, setZoomOrigin] = useState<{x: number, y: number}>({x: 50, y: 50}); // Transform origin as percentage
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

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

  // Add wheel event listener for Ctrl+scroll zoom
  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (!container) return;

    // Add event listener with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheelZoom, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheelZoom);
    };
  }, [handleWheelZoom]);


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
    if (activeHotspotInfoId && imageContainerRef.current && scaledImageDivRef.current) {
      const hotspot = hotspots.find(h => h.id === activeHotspotInfoId);
      if (hotspot) {
        const containerRect = imageContainerRef.current.getBoundingClientRect(); // Image container
        const scaledImgDivRect = scaledImageDivRef.current.getBoundingClientRect(); // The div that is actually scaled/translated

        // Calculate dot's center relative to the scaled image div's content
        const dotCenterXOnScaledImg = (hotspot.x / 100) * scaledImgDivRect.width;
        const dotCenterYOnScaledImg = (hotspot.y / 100) * scaledImgDivRect.height;

        // Calculate dot's center relative to the browser viewport
        const dotCenterXViewport = scaledImgDivRect.left + dotCenterXOnScaledImg;
        const dotCenterYViewport = scaledImgDivRect.top + dotCenterYOnScaledImg;
        
        // Convert to coordinates relative to the image container (InfoPanel's positioning parent)
        // Since both the InfoPanel and hotspots are inside the viewport container, they share the same scaling
        const anchorX = dotCenterXViewport - containerRect.left;
        const anchorY = dotCenterYViewport - containerRect.top;

        setInfoPanelAnchor({ x: anchorX, y: anchorY });
      } else {
        setInfoPanelAnchor(null);
      }
    } else {
      setInfoPanelAnchor(null);
    }
  }, [activeHotspotInfoId, hotspots, imageTransform, imageContainerRect, viewportZoom]); // Rerun if these change


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
              if (imageContainerRef.current && targetHotspot) {
                const scale = event.zoomFactor || 2;
                const { clientWidth: cW, clientHeight: cH } = imageContainerRef.current;
                // Calculate based on image's natural aspect ratio if available, or container if not
                // For simplicity, using clientWidth/Height of container for hotspot position calculation
                const hX = (targetHotspot.x / 100) * cW; 
                const hY = (targetHotspot.y / 100) * cH;
                newImageTransform = { scale, translateX: cW / 2 - hX * scale, translateY: cH / 2 - hY * scale, targetHotspotId: event.targetId };
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
            const { clientWidth: cW, clientHeight: cH } = imageContainerRef.current;
            const hX = (hotspot.x / 100) * cW; const hY = (hotspot.y / 100) * cH;
            setImageTransform({ scale, translateX: cW / 2 - hX * scale, translateY: cH / 2 - hY * scale, targetHotspotId: hotspot.id });
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
    const newHotspot: HotspotData = {
      id: `h${Date.now()}`, x: imageXPercent, y: imageYPercent, title,
      description: description || "Default description",
      color: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][hotspots.length % 5],
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
  }, [hotspots, timelineEvents, editorMaxStep, isEditing]);

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

  const handleZoomToPoint = useCallback((delta: number, clientX: number, clientY: number) => {
    if (!scrollableContainerRef.current) return;

    const container = scrollableContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate mouse position relative to scrollable container as percentage
    const mouseXPercent = ((clientX - containerRect.left) / containerRect.width) * 100;
    const mouseYPercent = ((clientY - containerRect.top) / containerRect.height) * 100;
    
    // Calculate new zoom level with finer increments
    const zoomIncrement = 0.1;
    const newZoom = Math.max(0.25, Math.min(3, viewportZoom + (delta > 0 ? zoomIncrement : -zoomIncrement)));
    
    if (newZoom !== viewportZoom) {
      setZoomOrigin({ x: mouseXPercent, y: mouseYPercent });
      setViewportZoom(newZoom);
    }
  }, [viewportZoom]);

  const handleWheelZoom = useCallback((event: WheelEvent) => {
    // Only handle Ctrl+scroll for zooming
    if (!event.ctrlKey) return;
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Normalize deltaY for consistent zoom behavior across different devices
    const delta = Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY), 100);
    
    // Use deltaY for zoom direction (negative = zoom in, positive = zoom out)
    handleZoomToPoint(-delta, event.clientX, event.clientY);
  }, [handleZoomToPoint]);

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (pendingHotspot) { // If confirming a pending hotspot, don't place another
        const target = event.target as HTMLElement;
        if(target.closest('.hotspot-confirmation-dialog')) return; // Click was on confirmation
    }
    if (isEditing && backgroundImage && imageContainerRef.current && scaledImageDivRef.current) {
        const target = event.target as HTMLElement;
         // Check if click is on InfoPanel or its children, or other UI controls
        if (target.closest('.hotspot-info-panel') || target.closest('[role="button"][aria-label^="Hotspot:"]') || target.closest('.image-navigation-controls') || target.closest('.initial-view-buttons') || target.closest('[aria-label="Module Timeline"]') || target.closest('.timeline-controls-container')) {
            return;
        }
        
        const containerRect = imageContainerRef.current.getBoundingClientRect();
        const viewportContainerRect = viewportContainerRef.current?.getBoundingClientRect();
        const scaledImgDivRect = scaledImageDivRef.current.getBoundingClientRect();

        // Click position relative to the browser viewport
        const clickX_viewport = event.clientX;
        const clickY_viewport = event.clientY;

        // Check if click is within the scaled image div bounds
        if (clickX_viewport < scaledImgDivRect.left || clickX_viewport > scaledImgDivRect.right ||
            clickY_viewport < scaledImgDivRect.top || clickY_viewport > scaledImgDivRect.bottom) {
            setPendingHotspot(null); // Click was outside the dynamic image area
            return;
        }
        
        // Click position relative to the scaled image div's top-left
        const clickX_on_scaled_img = clickX_viewport - scaledImgDivRect.left;
        const clickY_on_scaled_img = clickY_viewport - scaledImgDivRect.top;

        // Convert to percentage relative to the scaled image's dimensions
        const imageXPercent = Math.max(0, Math.min(100, (clickX_on_scaled_img / scaledImgDivRect.width) * 100));
        const imageYPercent = Math.max(0, Math.min(100, (clickY_on_scaled_img / scaledImgDivRect.height) * 100));
        
        // For visual pending marker, convert click to viewport container coordinates (accounting for viewport zoom)
        // The image container is now nested inside the viewport container that's scaled by viewportZoom
        let viewXPercent, viewYPercent;
        if (viewportContainerRect) {
          // Click relative to the viewport container, adjusted for viewport zoom
          const clickX_in_viewport = (clickX_viewport - viewportContainerRect.left) / viewportZoom;
          const clickY_in_viewport = (clickY_viewport - viewportContainerRect.top) / viewportZoom;
          
          // Convert to percentage relative to the unscaled viewport container dimensions
          const unscaledViewportWidth = viewportContainerRect.width / viewportZoom;
          const unscaledViewportHeight = viewportContainerRect.height / viewportZoom;
          viewXPercent = Math.max(0, Math.min(100, (clickX_in_viewport / unscaledViewportWidth) * 100));
          viewYPercent = Math.max(0, Math.min(100, (clickY_in_viewport / unscaledViewportHeight) * 100));
        } else {
          // Fallback to the old method if viewport container ref is not available
          viewXPercent = ((event.clientX - containerRect.left) / containerRect.width) * 100;
          viewYPercent = ((event.clientY - containerRect.top) / containerRect.height) * 100;
        }

        setPendingHotspot({ viewXPercent, viewYPercent, imageXPercent, imageYPercent });
        setActiveHotspotInfoId(null); // Hide any open info panel when trying to place new one

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
    <div className={`text-slate-200 ${isEditing ? 'fixed inset-0 z-50 bg-slate-900' : 'flex flex-col h-full'}`}>
      {isEditing ? (
        /* Full-Screen Editing Layout */
        <div className="flex h-screen">
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
                  ref={viewportContainerRef}
                  className="min-w-full min-h-full"
                  style={{
                    transform: `scale(${viewportZoom})`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transition: 'transform 0.2s ease-out',
                    width: viewportZoom > 1 ? `${100 * viewportZoom}%` : '100%',
                    height: viewportZoom > 1 ? `${100 * viewportZoom}%` : '100%',
                  }}
                >
                  {/* Image Container */}
                  <div 
                    ref={imageContainerRef}
                    className="relative w-full h-full bg-slate-900"
                    style={{ cursor: backgroundImage && !pendingHotspot ? 'crosshair' : 'default' }}
                    onClick={handleImageClick}
                    role={backgroundImage ? "button" : undefined}
                    aria-label={backgroundImage ? "Image canvas for adding hotspots" : "Interactive image"}
                  >
                    {backgroundImage ? (
                      <>
                        <div 
                          ref={scaledImageDivRef}
                          className="absolute w-full h-full"
                          style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: imageFitMode, 
                            backgroundPosition: 'center', 
                            backgroundRepeat: 'no-repeat',
                            transformOrigin: '0 0',
                            transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
                            transition: 'transform 0.5s ease-in-out',
                          }}
                          aria-hidden="true"
                        >
                          {highlightedHotspotId && backgroundImage && activeHotspotDisplayIds.has(highlightedHotspotId) && (
                            <div className="absolute inset-0 pointer-events-none" style={getHighlightGradientStyle()} aria-hidden="true"/>
                          )}
                          {hotspots.map(hotspot => (
                            <HotspotViewer
                              key={hotspot.id}
                              hotspot={hotspot}
                              isPulsing={pulsingHotspotId === hotspot.id && activeHotspotDisplayIds.has(hotspot.id)}
                              isDimmedInEditMode={currentStep > 0 && !timelineEvents.some(e => e.step === currentStep && e.targetId === hotspot.id && (e.type === InteractionType.SHOW_HOTSPOT || e.type === InteractionType.PULSE_HOTSPOT || e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT || e.type === InteractionType.HIGHLIGHT_HOTSPOT))}
                              isEditing={isEditing}
                              onFocusRequest={handleFocusHotspot}
                              onPositionChange={handleHotspotPositionChange}
                              isContinuouslyPulsing={false}
                            />
                          ))}
                        </div>
                        
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
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <p className="text-lg mb-4">Upload an image to start editing</p>
                          <FileUpload onFileUpload={handleImageUpload} />
                        </div>
                      </div>
                    )}
                  </div>
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
          <div className="w-80 bg-slate-800 border-l border-slate-600 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Module Editor</h2>
                <div className="flex items-center gap-2">
                  {/* Project Settings */}
                  <button
                    onClick={() => setShowPulseSettings(prev => !prev)}
                    className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                    title="Project Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  
                  {/* Save Button */}
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
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Zoom Controls */}
              {backgroundImage && (
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">Image Zoom</span>
                      <span className="text-xs text-slate-400" title="Hold Ctrl and scroll to zoom at cursor position">
                        (Ctrl+Scroll)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setZoomOrigin({x: 50, y: 50}); // Reset to center for manual controls
                          setViewportZoom(Math.max(0.25, viewportZoom - 0.25));
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 w-7 h-7 rounded text-sm transition-colors flex items-center justify-center"
                        title="Zoom out"
                      >
                        -
                      </button>
                      <span className="text-slate-300 text-sm min-w-[50px] text-center">
                        {Math.round(viewportZoom * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          setZoomOrigin({x: 50, y: 50}); // Reset to center for manual controls
                          setViewportZoom(Math.min(3, viewportZoom + 0.25));
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 w-7 h-7 rounded text-sm transition-colors flex items-center justify-center"
                        title="Zoom in"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setZoomOrigin({x: 50, y: 50}); // Reset to center
                        setViewportZoom(1);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-7 rounded text-xs transition-colors"
                      title="Reset to 100%"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        setZoomOrigin({x: 50, y: 50}); // Reset to center for fit
                        // Calculate zoom to fit image in viewable area
                        if (viewportContainerRef.current && scaledImageDivRef.current) {
                          const viewportRect = viewportContainerRef.current.getBoundingClientRect();
                          const imageRect = scaledImageDivRef.current.getBoundingClientRect();
                          
                          // Calculate the zoom needed to fit the image in the viewport
                          const scaleX = viewportRect.width / imageRect.width;
                          const scaleY = viewportRect.height / imageRect.height;
                          const fitZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
                          
                          setViewportZoom(Math.max(0.25, Math.min(3, fitZoom)));
                        }
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-7 rounded text-xs transition-colors"
                      title="Fit to viewable area"
                    >
                      Fit
                    </button>
                  </div>
                </div>
              )}

              {/* Project Settings Dropdown */}
              {showPulseSettings && (
                <div className="absolute right-4 top-16 w-96 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-600">
                      <h3 className="text-xl font-bold text-slate-100">Project Settings</h3>
                      <button
                        onClick={() => setShowPulseSettings(false)}
                        className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Image Configuration Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Image Configuration
                      </h4>
                      
                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                        {!backgroundImage ? (
                          <div>
                            <p className="text-sm text-slate-300 mb-3">Upload a background image to get started</p>
                            <FileUpload onFileUpload={handleImageUpload} />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Image Upload/Replace */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Background Image</label>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded border border-slate-600 bg-slate-700 bg-cover bg-center" 
                                     style={{ backgroundImage: `url(${backgroundImage})` }}></div>
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    className="hidden"
                                    id="image-upload"
                                  />
                                  <label 
                                    htmlFor="image-upload"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Replace Image
                                  </label>
                                </div>
                              </div>
                            </div>
                            
                            {/* Display Mode */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-3">Display Mode</label>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { value: 'cover', label: 'Cover', desc: 'Fill container, crop if needed' },
                                  { value: 'contain', label: 'Contain', desc: 'Fit entire image, may have gaps' },
                                  { value: 'fill', label: 'Fill', desc: 'Stretch to fill container' }
                                ].map(mode => (
                                  <button
                                    key={mode.value}
                                    onClick={() => handleImageFitChange(mode.value as any)}
                                    className={`p-3 rounded-lg border text-center transition-all ${
                                      imageFitMode === mode.value
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                    }`}
                                  >
                                    <div className="font-medium text-sm">{mode.label}</div>
                                    <div className="text-xs mt-1 opacity-80">{mode.desc}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Image Controls Section */}
                    {backgroundImage && (
                      <div className="mb-8">
                        <ImageControls
                          backgroundImage={backgroundImage}
                          onImageUpload={handleImageUpload}
                          onImageFit={(fitMode) => setImageFitMode(fitMode)}
                          currentFitMode={imageFitMode}
                          viewportZoom={viewportZoom}
                          onViewportZoomChange={setViewportZoom}
                        />
                      </div>
                    )}
                    
                    {/* Module Behavior Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        Module Behavior
                      </h4>
                      
                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                        {/* Auto-progression */}
                        <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-slate-200">Auto-progression</label>
                            <p className="text-xs text-slate-400 mt-1">Automatically advance through timeline steps</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isTimedMode}
                              onChange={(e) => setIsTimedMode(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        {/* Project Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-700 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-blue-400">{timelineEvents.length}</div>
                            <div className="text-xs text-slate-400">Timeline Events</div>
                          </div>
                          <div className="bg-slate-700 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-purple-400">{hotspots.length}</div>
                            <div className="text-xs text-slate-400">Hotspots</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hotspot Configuration Section */}
                    <div>
                      <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Hotspot Configuration
                      </h4>
                      
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Default Animation Settings</label>
                          <p className="text-xs text-slate-400 mb-3">Configure default pulse and animation settings for all hotspots</p>
                        </div>
                        
                        <HotspotPulseSettings
                          hotspots={hotspots}
                          onUpdateHotspot={(hotspotId, updates) => {
                            setHotspots(prevHotspots => prevHotspots.map(h =>
                              h.id === hotspotId ? { ...h, ...updates } : h
                            ));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeHotspotInfoId ? (
                /* Hotspot Editing Tools */
                <div className="space-y-6">
                  <div className="text-center text-slate-400">
                    <p>Hotspot editing tools will go here</p>
                    <p className="text-sm">Selected: {activeHotspotInfoId}</p>
                  </div>
                </div>
              ) : (
                /* No Hotspot Selected */
                <div className="text-center text-slate-400 py-8">
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
              <div className="bg-slate-800/95 backdrop-blur-sm border-t border-slate-600 shadow-lg">
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
      ) : (
        /* Non-Editing Mode - Viewer Layout */
        <div className="flex flex-col h-full">
          <div className="flex flex-row gap-6 flex-1">
            <div className="flex flex-col relative w-full">
              
              <div 
                ref={imageContainerRef}
                className="relative w-full flex-1 bg-slate-900 rounded-lg overflow-auto shadow-lg"
                style={{ cursor: 'default' }}
                onClick={handleImageClick}
                role={backgroundImage ? "button" : undefined}
                aria-label={backgroundImage ? "Interactive image" : undefined}
              >
                {backgroundImage ? (
                  <>
                    <div 
                      ref={scaledImageDivRef}
                      className="absolute w-full h-full"
                      style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: imageFitMode, 
                        backgroundPosition: 'center', 
                        backgroundRepeat: 'no-repeat',
                        transformOrigin: '0 0',
                        transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
                        transition: 'transform 0.5s ease-in-out',
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
                    
                    {!isEditing && backgroundImage && moduleState === 'learning' && uniqueSortedSteps.length > 0 && (
                      <div className="image-navigation-controls absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 backdrop-blur-sm p-2 rounded-lg shadow-xl">
                        <button
                          onClick={handlePrevStep}
                          disabled={currentStepIndex === 0}
                          className="p-2 rounded-full text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Previous step"
                        ><ChevronLeftIcon className="w-6 h-6" /></button>
                        <button
                          onClick={handleNextStep}
                          disabled={currentStepIndex >= totalTimelineInteractionPoints - 1}
                          className="p-2 rounded-full text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Next step"
                        ><ChevronRightIcon className="w-6 h-6" /></button>
                      </div>
                    )}

                    {moduleState === 'idle' && !isEditing && backgroundImage && (
                      <div className="initial-view-buttons absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="text-center space-y-6 p-8 bg-black/60 rounded-2xl border border-white/20 shadow-2xl max-w-md">
                          <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Interactive Module Ready</h2>
                            <p className="text-slate-300 text-sm">Choose how you'd like to explore this content</p>
                          </div>
                          <div className="flex flex-col space-y-3">
                            <button
                              onClick={() => {
                                setModuleState('idle');
                                setExploredHotspotId(null);
                                setExploredHotspotPanZoomActive(false);
                                setActiveHotspotInfoId(null);
                              }}
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
                     {/* Draggable InfoPanel */}
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
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <p>No background image set.</p>
                  </div>
                )}
              </div>
              
              {/* Timeline pinned to bottom of image container */}
              {backgroundImage && (moduleState === 'learning' || isEditing) && uniqueSortedSteps.length > 0 && (
                <div className="mt-2 bg-slate-800/70 backdrop-blur-sm rounded-lg shadow-md">
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
