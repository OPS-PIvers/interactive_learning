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
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain' | 'fill'>('cover'); 
  
  const [activeHotspotDisplayIds, setActiveHotspotDisplayIds] = useState<Set<string>>(new Set()); // Hotspots to *render* (dots)
  const [pulsingHotspotId, setPulsingHotspotId] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  
  // For the InfoPanel component
  const [activeHotspotInfoId, setActiveHotspotInfoId] = useState<string | null>(null);
  const [infoPanelAnchor, setInfoPanelAnchor] = useState<{ x: number, y: number } | null>(null);
  const [imageContainerRect, setImageContainerRect] = useState<DOMRectReadOnly | undefined>(undefined);

  const [pendingHotspot, setPendingHotspot] = useState<PendingHotspotInfo | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const scaledImageDivRef = useRef<HTMLDivElement>(null); // Ref for the div with background image

  const [imageTransform, setImageTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  const [exploredHotspotId, setExploredHotspotId] = useState<string | null>(null);
  const [exploredHotspotPanZoomActive, setExploredHotspotPanZoomActive] = useState<boolean>(false);

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
        const containerRect = imageContainerRef.current.getBoundingClientRect(); // Overall container
        const scaledImgDivRect = scaledImageDivRef.current.getBoundingClientRect(); // The div that is actually scaled/translated

        // Calculate dot's center relative to the scaled image div's content
        const dotCenterXOnScaledImg = (hotspot.x / 100) * scaledImgDivRect.width;
        const dotCenterYOnScaledImg = (hotspot.y / 100) * scaledImgDivRect.height;

        // Calculate dot's center relative to the viewport
        const dotCenterXViewport = scaledImgDivRect.left + dotCenterXOnScaledImg;
        const dotCenterYViewport = scaledImgDivRect.top + dotCenterYOnScaledImg;
        
        // Convert to coordinates relative to the imageContainerRef (which is the InfoPanel's positioning parent)
        const anchorX = dotCenterXViewport - containerRect.left;
        const anchorY = dotCenterYViewport - containerRect.top;

        setInfoPanelAnchor({ x: anchorX, y: anchorY });
      } else {
        setInfoPanelAnchor(null);
      }
    } else {
      setInfoPanelAnchor(null);
    }
  }, [activeHotspotInfoId, hotspots, imageTransform, imageContainerRect]); // Rerun if these change


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
      await onSave({ backgroundImage, hotspots, timelineEvents });
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
  }, [backgroundImage, hotspots, timelineEvents, onSave]);

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
        const scaledImgDivRect = scaledImageDivRef.current.getBoundingClientRect();

        // Click position relative to the viewport
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
        
        // For visual pending marker, use click relative to container
        const viewXPercent = ((event.clientX - containerRect.left) / containerRect.width) * 100;
        const viewYPercent = ((event.clientY - containerRect.top) / containerRect.height) * 100;

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
    }
  }, [isEditing, backgroundImage, imageTransform, moduleState, pendingHotspot]);

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
    <div className="flex flex-row gap-6 h-full text-slate-200">
      <div className={`flex flex-col relative ${isEditing ? 'flex-1 min-w-0' : 'w-full'}`}>
        
        <div 
          ref={imageContainerRef}
          className="relative w-full flex-1 bg-slate-900 rounded-lg overflow-auto shadow-lg"
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
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <p>{isEditing ? 'Upload an image to start.' : 'No background image set.'}</p>
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

      {isEditing && (
        <div className="flex flex-col w-80 flex-shrink-0">
        {/* Compact Project Settings */}
        {isEditing && (
          <div className="mb-2">
            {!backgroundImage && <FileUpload onFileUpload={handleImageUpload} />}
            {backgroundImage && (
              <div className="bg-slate-800 rounded-lg border border-slate-600">
                <button
                  onClick={() => setShowPulseSettings(prev => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-700 transition-colors text-sm"
                >
                  <span className="text-slate-300">⚙️ Project Settings</span>
                  <span className={`transform transition-transform text-slate-400 ${showPulseSettings ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>
                {showPulseSettings && (
                  <div className="px-3 pb-3 border-t border-slate-600 space-y-3">
                    <ImageControls
                      backgroundImage={backgroundImage}
                      onImageUpload={handleImageUpload}
                      onImageFit={handleImageFitChange}
                      currentFitMode={imageFitMode}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <label htmlFor="timingModeToggle" className="text-slate-300">
                        Auto-progression:
                      </label>
                      <input
                        type="checkbox"
                        id="timingModeToggle"
                        checked={isTimedMode}
                        onChange={(e) => setIsTimedMode(e.target.checked)}
                        className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-slate-500 bg-slate-700"
                      />
                    </div>
                    <div className="text-xs text-slate-400">
                      Events: {timelineEvents.length} | Hotspots: {hotspots.length}
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
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Main Editing Toolbar */}
        {isEditing && (
          <div className="flex-1 bg-slate-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Editing Tools</h3>
            
            {/* Pending Hotspot Confirmation */}
            {pendingHotspot && (
              <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
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
            
            {/* Selected Hotspot Editor */}
            {activeHotspotInfoId && (
              <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
                <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                  🎯 Edit Hotspot
                  <button
                    onClick={handleEditHotspotRequest.bind(null, activeHotspotInfoId)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded"
                  >
                    Advanced Edit
                  </button>
                </h4>
                {(() => {
                  const hotspot = hotspots.find(h => h.id === activeHotspotInfoId);
                  if (!hotspot) return null;
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Title:</label>
                        <input
                          type="text"
                          value={hotspot.title}
                          onChange={(e) => {
                            setHotspots(prev => prev.map(h => 
                              h.id === activeHotspotInfoId ? { ...h, title: e.target.value } : h
                            ));
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Description:</label>
                        <textarea
                          value={hotspot.description}
                          onChange={(e) => {
                            setHotspots(prev => prev.map(h => 
                              h.id === activeHotspotInfoId ? { ...h, description: e.target.value } : h
                            ));
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-1">Size:</label>
                          <select
                            value={hotspot.size || 'medium'}
                            onChange={(e) => {
                              setHotspots(prev => prev.map(h => 
                                h.id === activeHotspotInfoId ? { ...h, size: e.target.value as any } : h
                              ));
                            }}
                            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-1">Color:</label>
                          <select
                            value={hotspot.color}
                            onChange={(e) => {
                              setHotspots(prev => prev.map(h => 
                                h.id === activeHotspotInfoId ? { ...h, color: e.target.value } : h
                              ));
                            }}
                            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                          >
                            <option value="bg-red-500">Red</option>
                            <option value="bg-blue-500">Blue</option>
                            <option value="bg-green-500">Green</option>
                            <option value="bg-yellow-500">Yellow</option>
                            <option value="bg-purple-500">Purple</option>
                            <option value="bg-pink-500">Pink</option>
                            <option value="bg-cyan-500">Cyan</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveHotspot(activeHotspotInfoId)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded"
                      >
                        🗑️ Delete Hotspot
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Timeline Interaction Tools */}
            <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
              <h4 className="text-md font-semibold mb-3">⏱️ Timeline & Interactions</h4>
              
              {/* Step Controls */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Current Step:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentStep}
                      onChange={(e) => setCurrentStep(parseInt(e.target.value) || 1)}
                      min={1}
                      max={editorMaxStep + 1}
                      className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white"
                    />
                    <span className="text-slate-400">/ {uniqueSortedSteps.length}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-1 px-2 rounded text-xs"
                  >← Prev</button>
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-1 px-2 rounded text-xs"
                  >→ Next</button>
                </div>
              </div>
              
              {/* Events for Current Step */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-200 mb-2">Events in Step {currentStep}:</h5>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {timelineEvents
                    .filter(e => e.step === currentStep)
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map(event => {
                      const hotspot = hotspots.find(h => h.id === event.targetId);
                      return (
                        <div key={event.id} className="flex items-center justify-between bg-slate-800 p-2 rounded text-xs">
                          <div className="flex-1">
                            <div className="font-medium text-white">{event.type.replace('_', ' ')}</div>
                            {hotspot && <div className="text-slate-400">{hotspot.title}</div>}
                            {event.message && <div className="text-slate-400 truncate">"{event.message}"</div>}
                          </div>
                          <button
                            onClick={() => handleRemoveTimelineEvent(event.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remove event"
                          >×</button>
                        </div>
                      );
                    })
                  }
                  {timelineEvents.filter(e => e.step === currentStep).length === 0 && (
                    <div className="text-slate-400 text-xs italic">No events in this step</div>
                  )}
                </div>
              </div>
              
              {/* Add Interactions for Selected Hotspot */}
              {activeHotspotInfoId && (
                <div className="border-t border-slate-600 pt-3">
                  <h5 className="text-sm font-medium text-slate-200 mb-2">Add Interaction:</h5>
                  <div className="space-y-2">
                    {/* Basic Interactions */}
                    <div className="grid grid-cols-2 gap-1 text-xs">
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
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded"
                      >Show</button>
                      <button
                        onClick={() => {
                          const duration = parseInt(prompt('Pulse duration (ms):', '2000') || '2000');
                          const event = {
                            id: `te_pulse_${activeHotspotInfoId}_${Date.now()}`,
                            step: currentStep,
                            name: `Pulse ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                            type: InteractionType.PULSE_HOTSPOT,
                            targetId: activeHotspotInfoId,
                            duration
                          };
                          handleAddTimelineEvent(event);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded"
                      >Pulse</button>
                      <button
                        onClick={() => {
                          const zoomFactor = parseFloat(prompt('Zoom factor (e.g., 2.0):', '2.0') || '2.0');
                          const event = {
                            id: `te_zoom_${activeHotspotInfoId}_${Date.now()}`,
                            step: currentStep,
                            name: `Zoom to ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                            type: InteractionType.PAN_ZOOM_TO_HOTSPOT,
                            targetId: activeHotspotInfoId,
                            zoomFactor
                          };
                          handleAddTimelineEvent(event);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded"
                      >Zoom</button>
                      <button
                        onClick={() => {
                          const highlightRadius = parseInt(prompt('Highlight radius (pixels):', '60') || '60');
                          const event = {
                            id: `te_highlight_${activeHotspotInfoId}_${Date.now()}`,
                            step: currentStep,
                            name: `Highlight ${hotspots.find(h => h.id === activeHotspotInfoId)?.title}`,
                            type: InteractionType.HIGHLIGHT_HOTSPOT,
                            targetId: activeHotspotInfoId,
                            highlightRadius
                          };
                          handleAddTimelineEvent(event);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded"
                      >Highlight</button>
                    </div>
                    
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
            
            {/* Current Message Display */}
            {currentMessage && (
              <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                <h4 className="text-sm font-medium text-slate-200 mb-1">💬 Current Message</h4>
                <p className="text-slate-100 text-sm">{currentMessage}</p>
              </div>
            )}
          </div>
        )}
        
        {isEditing && (
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`mt-auto w-full font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center space-x-2 ${
              isSaving 
                ? 'bg-green-500 cursor-not-allowed' 
                : showSuccessMessage 
                  ? 'bg-green-500' 
                  : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isSaving ? (
              <>
                <LoadingSpinnerIcon className="w-5 h-5" />
                <span>Saving...</span>
              </>
            ) : showSuccessMessage ? (
              <>
                <CheckIcon className="w-5 h-5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        )}
        
        {/* Success Message Toast */}
        {showSuccessMessage && (
          <div className="mt-4 p-3 bg-green-600/90 backdrop-blur-sm rounded-lg shadow-lg border border-green-500/50 animate-pulse">
            <div className="flex items-center justify-center space-x-2 text-white">
              <CheckIcon className="w-5 h-5" />
              <span className="font-medium">Project saved successfully!</span>
            </div>
          </div>
        )}
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
