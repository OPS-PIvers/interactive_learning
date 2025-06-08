import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InteractiveModuleState, HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import FileUpload from './FileUpload';
import HotspotViewer from './HotspotViewer';
import TimelineControls from './TimelineControls';
import HorizontalTimeline from './HorizontalTimeline';
import InfoPanel from './InfoPanel'; // Import the new InfoPanel component
import { PlusIcon } from './icons/PlusIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

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
    const reader = new FileReader();
    reader.onloadend = () => { setBackgroundImage(reader.result as string); };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(() => {
    onSave({ backgroundImage, hotspots, timelineEvents });
  }, [backgroundImage, hotspots, timelineEvents, onSave]);

  const handleAddHotspot = useCallback((imageXPercent: number, imageYPercent: number) => {
    const title = prompt("Enter hotspot title:", "New Hotspot");
    if (!title) { setPendingHotspot(null); return; }
    const description = prompt("Enter hotspot description:", "");
    const newHotspot: HotspotData = {
      id: `h${Date.now()}`, x: imageXPercent, y: imageYPercent, title,
      description: description || "Default description",
      color: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'][hotspots.length % 5]
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
    const newTitle = prompt("Enter new hotspot title:", hotspotToEdit.title);
    if (newTitle === null) return; 
    const newDescription = prompt("Enter new hotspot description:", hotspotToEdit.description);
    if (newDescription === null) return; 
    setHotspots(prevHotspots => prevHotspots.map(h => h.id === hotspotId ? { ...h, title: newTitle, description: newDescription } : h));
  }, [hotspots]);

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

  const handleAddTimelineEvent = useCallback(() => { 
    const name = prompt("Enter event name (e.g., 'Highlight Petal'):");
    if (!name) return;
    
    const typeValues = Object.values(InteractionType).join('\n - ');
    const typeStr = prompt(`Enter event type:\n - ${typeValues}`, InteractionType.SHOW_MESSAGE);
    if (!typeStr || !Object.values(InteractionType).includes(typeStr as InteractionType)) {
      alert('Invalid event type.');
      return;
    }
    const type = typeStr as InteractionType;
    
    const defaultStep = currentStep > 0 ? currentStep : (editorMaxStep +1);
    const stepStr = prompt("Enter step number:", defaultStep.toString());
    const step = parseInt(stepStr || defaultStep.toString(), 10);
    if (isNaN(step) || step < 1) {
      alert('Invalid step number.');
      return;
    }

    let newEvent: Partial<TimelineEventData> = { id: `te${Date.now()}`, name, type, step };

    if (type === InteractionType.SHOW_HOTSPOT || type === InteractionType.HIDE_HOTSPOT || type === InteractionType.PULSE_HOTSPOT || type === InteractionType.PAN_ZOOM_TO_HOTSPOT || type === InteractionType.HIGHLIGHT_HOTSPOT) {
      const targetId = prompt(`Enter Hotspot ID (available: ${hotspots.map(h => `${h.id} (${h.title})`).join(', ') || 'none'}):`);
      if (!targetId || !hotspots.find(h => h.id === targetId)) {
        alert('Invalid or non-existent Hotspot ID.');
        return;
      }
      newEvent.targetId = targetId;
      if (type === InteractionType.PULSE_HOTSPOT) {
        const durationStr = prompt("Enter pulse duration (ms, e.g., 2000):", "2000");
        newEvent.duration = parseInt(durationStr || '2000', 10);
      }
      if (type === InteractionType.PAN_ZOOM_TO_HOTSPOT) {
        const zoomStr = prompt("Enter zoom factor (e.g., 2 for 2x zoom):", "2");
        newEvent.zoomFactor = parseFloat(zoomStr || '2');
      }
      if (type === InteractionType.HIGHLIGHT_HOTSPOT) {
        const radiusStr = prompt("Enter highlight radius (px for clear area, e.g., 60):", "60");
        newEvent.highlightRadius = parseInt(radiusStr || '60', 10);
      }
    } else if (type === InteractionType.SHOW_MESSAGE) {
      const message = prompt("Enter message to display:");
      newEvent.message = message || "";
    }
    
    setTimelineEvents(prev => [...prev, newEvent as TimelineEventData].sort((a,b) => a.step - b.step));
    if (isEditing) setCurrentStep(step);
  }, [editorMaxStep, hotspots, currentStep, isEditing]);
  
  const handleEditTimelineEvent = useCallback((eventId: string) => { 
    const eventToEdit = timelineEvents.find(e => e.id === eventId);
    if (!eventToEdit) return;

    const name = prompt("Enter event name:", eventToEdit.name);
    if (name === null) return;

    const stepStr = prompt("Enter step number:", eventToEdit.step.toString());
    const step = parseInt(stepStr || eventToEdit.step.toString(), 10);
    if (isNaN(step) || step < 1) {
      alert('Invalid step number.');
      return;
    }

    const typeValues = Object.values(InteractionType).join('\n - ');
    const typeStr = prompt(`Enter event type:\n - ${typeValues}`, eventToEdit.type);
    if (!typeStr || !Object.values(InteractionType).includes(typeStr as InteractionType)) {
      alert('Invalid event type.');
      return;
    }
    const type = typeStr as InteractionType;

    let updatedEvent: TimelineEventData = { ...eventToEdit, name, step, type };
    if (type !== eventToEdit.type) {
        delete updatedEvent.message;
        delete updatedEvent.targetId;
        delete updatedEvent.duration;
        delete updatedEvent.zoomFactor;
        delete updatedEvent.highlightRadius;
    }

    if (type === InteractionType.SHOW_HOTSPOT || type === InteractionType.HIDE_HOTSPOT || type === InteractionType.PULSE_HOTSPOT || type === InteractionType.PAN_ZOOM_TO_HOTSPOT || type === InteractionType.HIGHLIGHT_HOTSPOT) {
      const targetId = prompt(`Enter Hotspot ID (available: ${hotspots.map(h => `${h.id} (${h.title})`).join(', ') || 'none'}):`, updatedEvent.targetId || '');
      if (!targetId || !hotspots.find(h => h.id === targetId)) {
        alert('Invalid or non-existent Hotspot ID.');
        return;
      }
      updatedEvent.targetId = targetId;

      if (type === InteractionType.PULSE_HOTSPOT) {
        const durationStr = prompt("Enter pulse duration (ms):", (updatedEvent.duration || 2000).toString());
        updatedEvent.duration = parseInt(durationStr || '2000', 10);
      }
      if (type === InteractionType.PAN_ZOOM_TO_HOTSPOT) {
        const zoomStr = prompt("Enter zoom factor:", (updatedEvent.zoomFactor || 2).toString());
        updatedEvent.zoomFactor = parseFloat(zoomStr || '2');
      }
      if (type === InteractionType.HIGHLIGHT_HOTSPOT) {
        const radiusStr = prompt("Enter highlight radius (px):", (updatedEvent.highlightRadius || 60).toString());
        updatedEvent.highlightRadius = parseInt(radiusStr || '60', 10);
      }
    } else if (type === InteractionType.SHOW_MESSAGE) {
      const message = prompt("Enter message to display:", updatedEvent.message || "");
      updatedEvent.message = message || "";
    }

    setTimelineEvents(prev => 
      prev.map(e => e.id === eventId ? updatedEvent : e).sort((a,b) => a.step - b.step)
    );
    if(isEditing) setCurrentStep(step);
  }, [timelineEvents, hotspots, isEditing]);

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
    <div className="flex flex-col lg:flex-row gap-6 h-full text-slate-200">
      <div className="lg:w-2/3 flex flex-col relative">
        {isEditing && !backgroundImage && <FileUpload onFileUpload={handleImageUpload} />}
        
        <div 
          ref={imageContainerRef}
          className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden shadow-lg"
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
                  backgroundSize: 'cover', backgroundPosition: 'center', transformOrigin: '0 0',
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
                    onFocusRequest={handleFocusHotspot} // Changed from onEditRequest/onRemove
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
               {/* Render InfoPanel here, outside the scaled div */}
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

        {pendingHotspot && isEditing && (
            <div className="hotspot-confirmation-dialog mt-4 p-4 bg-slate-700 rounded-lg shadow-md">
                <h4 className="text-lg font-semibold mb-2">Confirm Hotspot</h4>
                <p className="text-sm text-slate-300 mb-1">Place at: Image X: {pendingHotspot.imageXPercent.toFixed(1)}%, Image Y: {pendingHotspot.imageYPercent.toFixed(1)}%</p>
                <p className="text-xs text-slate-400 mb-3">(Coordinates are relative to the image content)</p>
                <button 
                    onClick={() => handleAddHotspot(pendingHotspot.imageXPercent, pendingHotspot.imageYPercent)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2"
                >Add Hotspot Here</button>
                <button onClick={() => setPendingHotspot(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
            </div>
        )}
        {(moduleState === 'learning' || isEditing) && currentMessage && (
          <div className="mt-4 p-3 bg-slate-700 rounded-lg shadow text-center" role="alert">
            <p className="text-slate-100">{currentMessage}</p>
          </div>
        )}
      </div>

      <div className="lg:w-1/3 flex flex-col timeline-controls-container">
        <TimelineControls
          events={timelineEvents}
          currentStep={currentStep} 
          maxStep={editorMaxStep}   
          onStepChange={setCurrentStep} 
          isEditing={isEditing}
          onAddEvent={handleAddTimelineEvent}
          onRemoveEvent={handleRemoveTimelineEvent}
          onEditEvent={handleEditTimelineEvent}
          hotspots={hotspots}
        />
        {isEditing && (
          <button onClick={handleSave} className="mt-auto w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors duration-200">
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
};

export default InteractiveModule;
