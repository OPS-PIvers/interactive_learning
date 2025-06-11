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
  const scaledImageDivRef = useRef<HTMLDivElement>(null); // Ref for the div with background image

  const [imageTransform, setImageTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const [viewportZoom, setViewportZoom] = useState<number>(1);
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
    <div className="flex flex-col h-full text-slate-200">
      {/* Top Menu Bar */}
      {isEditing && (
        <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-600">
          <h2 className="text-lg font-semibold text-slate-100">Interactive Module Editor</h2>
          <div className="flex items-center gap-2">
            {/* Project Settings Menu */}
            <div className="relative">
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
              {showPulseSettings && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
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
      )}
      
      <div className="flex flex-row gap-6 flex-1">
        <div className={`flex flex-col relative ${(isEditing && activeHotspotInfoId) ? 'flex-1 min-w-0' : 'w-full'}`}>
        
        {/* Viewport Container - scales with manual zoom */}
        <div 
          className="relative w-full flex-1 overflow-auto bg-slate-900 rounded-lg shadow-lg"
          style={{
            // Ensure scrollbars appear when content is larger than container
            scrollBehavior: 'smooth',
            // Custom scrollbar styling for better UX
            scrollbarWidth: 'thin',
            scrollbarColor: '#475569 #1e293b',
          }}
        >
          <div
            ref={viewportContainerRef}
            className="min-w-full min-h-full"
            style={{
              transform: `scale(${viewportZoom})`,
              transformOrigin: '0 0',
              transition: 'transform 0.3s ease-out',
              // When zoomed, the content needs more space
              width: viewportZoom > 1 ? `${100 * viewportZoom}%` : '100%',
              height: viewportZoom > 1 ? `${100 * viewportZoom}%` : '100%',
            }}
          >
            {/* Image Container - contains content transforms for pan/zoom hotspot feature */}
            <div 
              ref={imageContainerRef}
              className="relative w-full h-full bg-slate-900"
              style={{ cursor: isEditing && backgroundImage && !pendingHotspot ? 'crosshair' : 'default' }}
              onClick={handleImageClick}
              role={isEditing && backgroundImage ? "button" : undefined}
              aria-label={isEditing && backgroundImage ? "Image canvas for adding hotspots" : "Interactive image"}
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
                    isDimmedInEditMode={isEditing && currentStep > 0 && !timelineEvents.some(e => e.step === currentStep && e.targetId === hotspot.id && (e.type === InteractionType.SHOW_HOTSPOT || e.type === InteractionType.PULSE_HOTSPOT || e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT || e.type === InteractionType.HIGHLIGHT_HOTSPOT))}
                    isEditing={isEditing}
                    onFocusRequest={handleFocusHotspot}
                    onPositionChange={isEditing ? handleHotspotPositionChange : undefined}
                    isContinuouslyPulsing={moduleState === 'idle' && !isEditing && !exploredHotspotId}
                  />
                ))}
              </div>
              
              {pendingHotspot && isEditing && imageContainerRef.current && (
                <div 
                  className="absolute w-8 h-8 bg-green-500 opacity-70 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse flex items-center justify-center"
                  style={{ left: `${pendingHotspot.viewXPercent}%`, top: `${pendingHotspot.viewYPercent}%`}}
                  aria-hidden="true"
                ><PlusIcon className="w-5 h-5 text-white"/></div>
              )}
              
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
                <div className="initial-view-buttons absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none p-4">
                  <div className="bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl space-y-4 pointer-events-auto max-w-md w-full">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">
                      {projectName}
                    </h2>
                    <p className="text-slate-300 text-center text-sm sm:text-base">
                      Click hotspots to explore or start the guided tour.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                      <button
                        onClick={() => { // "Explore Module" button action
                          setExploredHotspotId(null);
                          setExploredHotspotPanZoomActive(false);
                          setActiveHotspotInfoId(null); // Ensure panel closes
                          setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined }); // Reset view
                          setModuleState('idle'); // Explicitly stay in idle
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
              <p>{isEditing ? 'Upload an image to start.' : 'No background image set.'}</p>
            </div>
          )}
            </div>
          </div>
        </div>

        {/* Pending Hotspot Confirmation - shown when no hotspot selected */}
        {pendingHotspot && isEditing && !activeHotspotInfoId && (
          <div className="mt-2 p-3 bg-slate-700 rounded-lg border border-slate-600">
            <h4 className="text-md font-semibold mb-2">🎯 Confirm New Hotspot</h4>
            <p className="text-sm text-slate-300 mb-1">Position: {pendingHotspot.imageXPercent.toFixed(1)}%, {pendingHotspot.imageYPercent.toFixed(1)}%</p>
            <div className="flex gap-2 mt-3">
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
        )}
        
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

      {isEditing && activeHotspotInfoId && (
        <div className="flex flex-col w-80 flex-shrink-0">
        
        {/* Main Editing Toolbar */}
        <div className="flex-1 bg-slate-800 rounded-lg shadow-lg">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-600">
              <button
                onClick={() => setActiveEditorTab('properties')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeEditorTab === 'properties'
                    ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                🎯 Hotspot Properties
              </button>
              <button
                onClick={() => setActiveEditorTab('timeline')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeEditorTab === 'timeline'
                    ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                ⏱️ Timeline Events
              </button>
            </div>
            
            <div className="p-6">
              {/* Tab Content */}
              {activeEditorTab === 'properties' && (
                <div className="space-y-6">
                  {(() => {
                    const hotspot = hotspots.find(h => h.id === activeHotspotInfoId);
                    if (!hotspot) return <div className="text-slate-400">No hotspot selected</div>;
                    
                    return (
                      <>
                        {/* Basic Info Section */}
                        <div>
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            📝 Basic Information
                          </h4>
                          <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                              <input
                                type="text"
                                value={hotspot.title}
                                onChange={(e) => {
                                  setHotspots(prev => prev.map(h => 
                                    h.id === activeHotspotInfoId ? { ...h, title: e.target.value } : h
                                  ));
                                }}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter hotspot title..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                              <textarea
                                value={hotspot.description}
                                onChange={(e) => {
                                  setHotspots(prev => prev.map(h => 
                                    h.id === activeHotspotInfoId ? { ...h, description: e.target.value } : h
                                  ));
                                }}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Describe what this hotspot shows..."
                              />
                            </div>
                            <div className="bg-slate-800 rounded p-3">
                              <label className="block text-sm font-medium text-slate-300 mb-1">Position</label>
                              <div className="text-sm text-slate-400">
                                X: {hotspot.x.toFixed(1)}% • Y: {hotspot.y.toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Drag the hotspot on the image to reposition</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Appearance Section */}
                        <div>
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            🎨 Appearance
                          </h4>
                          <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Size</label>
                                <select
                                  value={hotspot.size || 'medium'}
                                  onChange={(e) => {
                                    setHotspots(prev => prev.map(h => 
                                      h.id === activeHotspotInfoId ? { ...h, size: e.target.value as any } : h
                                    ));
                                  }}
                                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="small">Small (12px)</option>
                                  <option value="medium">Medium (16px)</option>
                                  <option value="large">Large (20px)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                  {[
                                    { value: 'bg-red-500', color: 'bg-red-500', name: 'Red' },
                                    { value: 'bg-blue-500', color: 'bg-blue-500', name: 'Blue' },
                                    { value: 'bg-green-500', color: 'bg-green-500', name: 'Green' },
                                    { value: 'bg-yellow-500', color: 'bg-yellow-500', name: 'Yellow' },
                                    { value: 'bg-purple-500', color: 'bg-purple-500', name: 'Purple' },
                                    { value: 'bg-pink-500', color: 'bg-pink-500', name: 'Pink' },
                                    { value: 'bg-cyan-500', color: 'bg-cyan-500', name: 'Cyan' },
                                    { value: 'bg-orange-500', color: 'bg-orange-500', name: 'Orange' }
                                  ].map(color => (
                                    <button
                                      key={color.value}
                                      onClick={() => {
                                        setHotspots(prev => prev.map(h => 
                                          h.id === activeHotspotInfoId ? { ...h, color: color.value } : h
                                        ));
                                      }}
                                      className={`w-8 h-8 rounded-full ${color.color} border-2 transition-all ${
                                        hotspot.color === color.value
                                          ? 'border-white scale-110'
                                          : 'border-slate-600 hover:border-slate-400'
                                      }`}
                                      title={color.name}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Advanced Actions Section */}
                        <div>
                          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                            ⚙️ Advanced Actions
                          </h4>
                          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                            <button
                              onClick={() => handleEditHotspotRequest(activeHotspotInfoId)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              ✏️ Advanced Editor
                            </button>
                            
                            <div className="pt-3 border-t border-slate-600">
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the hotspot "${hotspot.title}"? This will also remove all related timeline events.`)) {
                                    handleRemoveHotspot(activeHotspotInfoId);
                                  }
                                }}
                                className="w-full bg-slate-600 hover:bg-red-600 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                              >
                                ⚠️ Delete Hotspot
                              </button>
                              <p className="text-xs text-slate-500 mt-1 text-center">This action cannot be undone</p>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              
              {activeEditorTab === 'timeline' && (
                <div className="space-y-6">
                  {/* Step Navigation */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      📍 Step Navigation
                    </h4>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-300 font-medium">Current Step:</span>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={currentStep}
                            onChange={(e) => setCurrentStep(parseInt(e.target.value) || 1)}
                            min={1}
                            max={editorMaxStep + 1}
                            className="w-16 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-center focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-slate-400">of {uniqueSortedSteps.length}</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: Math.max(uniqueSortedSteps.length, 5) }, (_, i) => {
                            const stepNum = i + 1;
                            const isActive = stepNum === currentStep;
                            const hasEvents = timelineEvents.some(e => e.step === stepNum);
                            return (
                              <button
                                key={stepNum}
                                onClick={() => setCurrentStep(stepNum)}
                                className={`flex-1 h-2 rounded-full transition-all ${
                                  isActive
                                    ? 'bg-blue-500'
                                    : hasEvents
                                      ? 'bg-green-500/60 hover:bg-green-500'
                                      : 'bg-slate-600 hover:bg-slate-500'
                                }`}
                                title={`Step ${stepNum}${hasEvents ? ' (has events)' : ' (empty)'}`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Step 1</span>
                          <span>Step {Math.max(uniqueSortedSteps.length, 5)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                          disabled={currentStep <= 1}
                          className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => setCurrentStep(currentStep + 1)}
                          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Events in Current Step */}
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      🎬 Events in Step {currentStep}
                    </h4>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {timelineEvents
                          .filter(e => e.step === currentStep)
                          .sort((a, b) => a.id.localeCompare(b.id))
                          .map(event => {
                            const hotspot = hotspots.find(h => h.id === event.targetId);
                            const getEventDisplay = (type: string) => {
                              switch (type) {
                                case 'SHOW_HOTSPOT': return { icon: '📍', name: 'Show Hotspot' };
                                case 'HIDE_HOTSPOT': return { icon: '🙈', name: 'Hide Hotspot' };
                                case 'PULSE_HOTSPOT': return { icon: '💫', name: 'Pulse Animation' };
                                case 'PAN_ZOOM_TO_HOTSPOT': return { icon: '🔍', name: 'Zoom to Location' };
                                case 'HIGHLIGHT_HOTSPOT': return { icon: '✨', name: 'Highlight Area' };
                                case 'SHOW_MESSAGE': return { icon: '💬', name: 'Show Message' };
                                default: return { icon: '⚙️', name: type.replace('_', ' ') };
                              }
                            };
                            const display = getEventDisplay(event.type);
                            
                            return (
                              <div key={event.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="text-lg">{display.icon}</span>
                                  <div className="flex-1">
                                    <div className="font-medium text-white">{display.name}</div>
                                    {hotspot && <div className="text-sm text-slate-400">Target: {hotspot.title}</div>}
                                    {event.message && <div className="text-sm text-slate-400 truncate">Message: "{event.message}"</div>}
                                    {event.duration && <div className="text-xs text-slate-500">Duration: {event.duration}ms</div>}
                                    {event.zoomFactor && <div className="text-xs text-slate-500">Zoom: {event.zoomFactor}x</div>}
                                    {event.highlightRadius && <div className="text-xs text-slate-500">Radius: {event.highlightRadius}px</div>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveTimelineEvent(event.id)}
                                  className="text-slate-400 hover:text-red-400 p-2 rounded transition-colors"
                                  title="Remove event"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })
                        }
                        {timelineEvents.filter(e => e.step === currentStep).length === 0 && (
                          <div className="text-center py-8 text-slate-400">
                            <div className="text-4xl mb-2">🎬</div>
                            <div className="font-medium">No events in this step</div>
                            <div className="text-sm">Add interactions below to bring this step to life</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Add New Interactions */}
                  {activeHotspotInfoId && (
                  <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      ➕ Add New Interaction
                    </h4>
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                      {/* Visual Effects Group */}
                      <div>
                        <h5 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                          ✨ Visual Effects
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const event = {
                                id: `te_show_${activeHotspotInfoId}_${Date.now()}`,
                                step: currentStep,
                                name: `Show ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                                type: InteractionType.SHOW_HOTSPOT,
                                targetId: activeHotspotInfoId
                              };
                              handleAddTimelineEvent(event);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            📍 Show
                          </button>
                          <button
                            onClick={() => {
                              const event = {
                                id: `te_hide_${activeHotspotInfoId}_${Date.now()}`,
                                step: currentStep,
                                name: `Hide ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                                type: InteractionType.HIDE_HOTSPOT,
                                targetId: activeHotspotInfoId
                              };
                              handleAddTimelineEvent(event);
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            🙈 Hide
                          </button>
                          <button
                            onClick={() => {
                              setInteractionParams(prev => ({ 
                                ...prev, 
                                showingPulseSlider: !prev.showingPulseSlider,
                                showingZoomSlider: false,
                                showingHighlightSlider: false
                              }));
                            }}
                            className={`bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                              interactionParams.showingPulseSlider ? 'ring-2 ring-purple-300' : ''
                            }`}
                          >
                            💫 Pulse
                          </button>
                      <button
                        onClick={() => {
                          setInteractionParams(prev => ({ 
                            ...prev, 
                            showingZoomSlider: !prev.showingZoomSlider,
                            showingHighlightSlider: false,
                            showingPulseSlider: false
                          }));
                        }}
                        className={`bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded ${
                          interactionParams.showingZoomSlider ? 'ring-2 ring-green-300' : ''
                        }`}
                      >Zoom</button>
                          <button
                            onClick={() => {
                              setInteractionParams(prev => ({ 
                                ...prev, 
                                showingHighlightSlider: !prev.showingHighlightSlider,
                                showingZoomSlider: false,
                                showingPulseSlider: false
                              }));
                            }}
                            className={`bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                              interactionParams.showingHighlightSlider ? 'ring-2 ring-yellow-300' : ''
                            }`}
                          >
                            ✨ Highlight
                          </button>
                        </div>
                    </div>
                    
                    {/* Parameter Sliders */}
                    {interactionParams.showingZoomSlider && (
                      <div className="bg-slate-800 p-3 rounded border border-green-500">
                        <label className="block text-xs text-slate-300 mb-2">Zoom Factor: {interactionParams.zoomFactor}x</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={interactionParams.zoomFactor}
                          onChange={(e) => setInteractionParams(prev => ({ ...prev, zoomFactor: parseFloat(e.target.value) }))}
                          className="w-full mb-2"
                        />
                        <button
                          onClick={() => {
                            const event = {
                              id: `te_zoom_${activeHotspotInfoId}_${Date.now()}`,
                              step: currentStep,
                              name: `Zoom to ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                              type: InteractionType.PAN_ZOOM_TO_HOTSPOT,
                              targetId: activeHotspotInfoId,
                              zoomFactor: interactionParams.zoomFactor
                            };
                            handleAddTimelineEvent(event);
                            setInteractionParams(prev => ({ ...prev, showingZoomSlider: false }));
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs"
                        >Add Zoom Interaction</button>
                      </div>
                    )}
                    
                    {interactionParams.showingHighlightSlider && (
                      <div className="bg-slate-800 p-3 rounded border border-yellow-500">
                        <label className="block text-xs text-slate-300 mb-2">Highlight Radius: {interactionParams.highlightRadius}px</label>
                        <input
                          type="range"
                          min="20"
                          max="200"
                          step="10"
                          value={interactionParams.highlightRadius}
                          onChange={(e) => setInteractionParams(prev => ({ ...prev, highlightRadius: parseInt(e.target.value) }))}
                          className="w-full mb-2"
                        />
                        <button
                          onClick={() => {
                            const event = {
                              id: `te_highlight_${activeHotspotInfoId}_${Date.now()}`,
                              step: currentStep,
                              name: `Highlight ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                              type: InteractionType.HIGHLIGHT_HOTSPOT,
                              targetId: activeHotspotInfoId,
                              highlightRadius: interactionParams.highlightRadius
                            };
                            handleAddTimelineEvent(event);
                            setInteractionParams(prev => ({ ...prev, showingHighlightSlider: false }));
                          }}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded text-xs"
                        >Add Highlight Interaction</button>
                      </div>
                    )}
                    
                    {interactionParams.showingPulseSlider && (
                      <div className="bg-slate-800 p-3 rounded border border-purple-500">
                        <label className="block text-xs text-slate-300 mb-2">Pulse Duration: {interactionParams.pulseDuration}ms</label>
                        <input
                          type="range"
                          min="500"
                          max="5000"
                          step="100"
                          value={interactionParams.pulseDuration}
                          onChange={(e) => setInteractionParams(prev => ({ ...prev, pulseDuration: parseInt(e.target.value) }))}
                          className="w-full mb-2"
                        />
                        <button
                          onClick={() => {
                            const event = {
                              id: `te_pulse_${activeHotspotInfoId}_${Date.now()}`,
                              step: currentStep,
                              name: `Pulse ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                              type: InteractionType.PULSE_HOTSPOT,
                              targetId: activeHotspotInfoId,
                              duration: interactionParams.pulseDuration
                            };
                            handleAddTimelineEvent(event);
                            setInteractionParams(prev => ({ ...prev, showingPulseSlider: false }));
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-xs"
                        >Add Pulse Interaction</button>
                      </div>
                    )}
                    
                    {/* Advanced Interactions */}
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <button
                        onClick={() => {
                          const event = {
                            id: `te_hide_${activeHotspotInfoId}_${Date.now()}`,
                            step: currentStep,
                            name: `Hide ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                            type: InteractionType.HIDE_HOTSPOT,
                            targetId: activeHotspotInfoId
                          };
                          handleAddTimelineEvent(event);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                      >Hide Hotspot</button>
                      <button
                        onClick={() => {
                          const message = prompt('Enter message to display:');
                          if (message) {
                            const event = {
                              id: `te_message_${Date.now()}`,
                              step: currentStep,
                              name: 'Show Message',
                              type: InteractionType.SHOW_MESSAGE,
                              message
                            };
                            handleAddTimelineEvent(event);
                          }
                        }}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white py-1 px-2 rounded"
                      >Show Message</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* General Timeline Actions */}
              {!activeHotspotInfoId && (
                <div className="border-t border-slate-600 pt-3">
                  <h5 className="text-sm font-medium text-slate-200 mb-2">General Actions:</h5>
                  <button
                    onClick={() => {
                      const message = prompt('Enter message to display:');
                      if (message) {
                        const event = {
                          id: `te_message_${Date.now()}`,
                          step: currentStep,
                          name: 'Show Message',
                          type: InteractionType.SHOW_MESSAGE,
                          message
                        };
                        handleAddTimelineEvent(event);
                      }
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-2 rounded text-xs"
                  >Add Message to Step</button>
                </div>
              )}
            </div>
            )}
            
            {/* Current Message Display */}
            {currentMessage && (
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <h4 className="text-sm font-medium text-slate-200 mb-1">💬 Current Message</h4>
                <p className="text-slate-100 text-sm">{currentMessage}</p>
              </div>
            )}
          </div>
        </div>
        </div>
      )}
      </div>

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
