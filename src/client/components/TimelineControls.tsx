import React, { useState, useCallback, useEffect } from 'react';
import { TimelineEventData, InteractionType, HotspotData } from '../../shared/types';
import EnhancedTimelineEventModal from './EnhancedTimelineEventModal';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PencilIcon } from './icons/PencilIcon';

// Add new interfaces
type SidebarMode = 'compact' | 'standard' | 'expanded';

interface SidebarModeIconProps {
  mode: SidebarMode;
  currentMode: SidebarMode;
  onClick: () => void;
}

interface TimelineControlsProps {
  events: TimelineEventData[];
  currentStep: number;
  maxStep: number;
  onStepChange: (step: number) => void;
  isEditing: boolean;
  onAddEvent: (event?: TimelineEventData) => void;
  onRemoveEvent: (eventId: string) => void;
  onEditEvent: (eventId: string) => void;
  hotspots: HotspotData[];
  isTimedMode?: boolean;
}

// Custom hook for responsive sidebar behavior
const useResponsiveSidebar = (mode: SidebarMode) => {
  const [effectiveMode, setEffectiveMode] = useState(mode);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) { // Mobile
        setEffectiveMode('compact');
      } else if (width < 1024) { // Tablet
        setEffectiveMode(mode === 'expanded' ? 'standard' : mode);
      } else { // Desktop
        setEffectiveMode(mode);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mode]);

  return effectiveMode;
};

// SidebarModeIcon component
const SidebarModeIcon: React.FC<SidebarModeIconProps> = ({ mode, currentMode, onClick }) => {
  const isActive = mode === currentMode;
  
  const getIcon = () => {
    switch (mode) {
      case 'compact':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h4" />
          </svg>
        );
      case 'standard':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
      case 'expanded':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4m-4 0l5.656 5.656m0 0L12 12m-2.344-2.344L12 12m0 0l2.344-2.344M16 4h4m0 0v4m0-4l-5.656 5.656M16 20h4m0 0v-4m0 4l-5.656-5.656M8 20H4m0 0v-4m0 4l5.656-5.656" />
          </svg>
        );
    }
  };

  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        isActive 
          ? 'bg-slate-600 text-white' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
      }`}
      title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
    >
      {getIcon()}
    </button>
  );
};

const TimelineControls: React.FC<TimelineControlsProps> = ({ 
  events, 
  currentStep, 
  maxStep, 
  onStepChange, 
  isEditing, 
  onAddEvent, 
  onRemoveEvent, 
  onEditEvent, 
  hotspots,
  isTimedMode = false
}) => {
  // Enhanced editor is now the default and only option
  const useEnhancedEditor = true;
  const [enhancedModalOpen, setEnhancedModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEventData | null>(null);
  
  // Add sidebar mode state
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    // Load from localStorage or default to standard
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('sidebarMode') as SidebarMode) || 'standard';
    }
    return 'standard';
  });

  // Add persistence effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarMode', sidebarMode);
    }
  }, [sidebarMode]);

  // Add mode toggle function
  const toggleSidebarMode = useCallback((mode: SidebarMode) => {
    setSidebarMode(mode);
  }, []);

  // Use responsive sidebar behavior
  const effectiveSidebarMode = useResponsiveSidebar(sidebarMode);

  if (!isEditing) {
    return null; // Render nothing if not in editing mode
  }

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEnhancedModalOpen(true);
  };

  const handleEditEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setEditingEvent(event);
      setEnhancedModalOpen(true);
    }
  };

  const handleSaveEnhancedEvent = (eventData: TimelineEventData) => {
    onAddEvent(eventData);
    setEnhancedModalOpen(false);
    setEditingEvent(null);
  };

  const getEventDetails = (event: TimelineEventData): string => {
    let details = `${event.type}`;
    if (event.targetId) {
      const targetHotspot = hotspots.find(h => h.id === event.targetId);
      details += ` (${targetHotspot ? targetHotspot.title : event.targetId})`;
    }
    if (event.type === InteractionType.SHOW_MESSAGE && event.message) {
      details += `: "${event.message.substring(0,20)}${event.message.length > 20 ? '...' : ''}"`;
    }
    if (event.type === InteractionType.PULSE_HOTSPOT && event.duration) {
      details += ` (${event.duration}ms)`;
    }
    if (event.type === InteractionType.PAN_ZOOM_TO_HOTSPOT && event.zoomFactor) {
      details += ` (${event.zoomFactor}x)`;
    }
     if (event.type === InteractionType.HIGHLIGHT_HOTSPOT && event.highlightRadius) {
      details += ` (r:${event.highlightRadius}px)`;
    }
    return details;
  };

  // CompactMode component
  const CompactMode: React.FC<{
    currentStep: number;
    maxStep: number;
    eventsCount: number;
    onStepChange: (step: number) => void;
    onAddEvent: () => void;
  }> = ({ currentStep, maxStep, eventsCount, onStepChange, onAddEvent }) => (
    <div className="flex flex-col items-center space-y-4 h-full">
      {/* Mode Toggle */}
      <button
        onClick={() => toggleSidebarMode('standard')}
        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
        title="Expand sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Current Step Display */}
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-400">{currentStep}</div>
        <div className="text-xs text-slate-400">of {maxStep}</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / maxStep) * 100}%` }}
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => onStepChange(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="p-2 text-white hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous step"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onStepChange(Math.min(maxStep || 1, currentStep + 1))}
          disabled={currentStep === maxStep}
          className="p-2 text-white hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next step"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Add Event Button */}
      <button
        onClick={onAddEvent}
        className="mt-auto p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-colors"
        title="Add Timeline Event"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  );

  // ExpandedMode component
  const ExpandedMode: React.FC<{
    currentEvent: TimelineEventData | null;
    hotspots: HotspotData[];
  }> = ({ currentEvent, hotspots }) => {
    if (!currentEvent) {
      return (
        <div className="mt-4 p-4 bg-slate-700 rounded-lg">
          <p className="text-slate-400 text-center">Select an event to view details</p>
        </div>
      );
    }

    const targetHotspot = currentEvent.targetId ? 
      hotspots.find(h => h.id === currentEvent.targetId) : null;

    return (
      <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
        <h4 className="font-semibold text-slate-100 mb-3">Event Details</h4>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-slate-400">Type:</span>
            <span className="ml-2 text-slate-200">{currentEvent.type.replace(/_/g, ' ')}</span>
          </div>
          
          {targetHotspot && (
            <div>
              <span className="text-slate-400">Target:</span>
              <div className="ml-2 flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${targetHotspot.color || 'bg-gray-500'}`}></div>
                <span className="text-slate-200">{targetHotspot.title}</span>
              </div>
            </div>
          )}
          
          {currentEvent.message && (
            <div>
              <span className="text-slate-400">Message:</span>
              <p className="ml-2 text-slate-200 text-xs italic">"{currentEvent.message}"</p>
            </div>
          )}
          
          {currentEvent.duration && (
            <div>
              <span className="text-slate-400">Duration:</span>
              <span className="ml-2 text-slate-200">{currentEvent.duration}ms</span>
            </div>
          )}
          
          {currentEvent.zoomFactor && (
            <div>
              <span className="text-slate-400">Zoom:</span>
              <span className="ml-2 text-slate-200">{currentEvent.zoomFactor}x</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper to get current event
  const currentEvent = events.find(e => e.step === currentStep) || null;

  // Get sidebar classes
  const getSidebarClasses = (mode: SidebarMode) => {
    const baseClasses = "bg-slate-800 p-4 rounded-lg shadow-lg h-full flex flex-col transition-all duration-300";
    
    switch (mode) {
      case 'compact':
        return `${baseClasses} w-20`;
      case 'standard':
        return baseClasses;
      case 'expanded':
        return `${baseClasses} lg:w-96 xl:w-80`;
      default:
        return baseClasses;
    }
  };

  // Render header
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-3">
      {effectiveSidebarMode !== 'compact' ? (
        <h3 className="text-xl font-semibold text-slate-100">Timeline</h3>
      ) : (
        <div className="w-full flex justify-center">
          <span className="text-sm font-bold text-slate-100">{events.length}</span>
        </div>
      )}
      
      {effectiveSidebarMode !== 'compact' && (
        <div className="flex items-center space-x-1">
          <SidebarModeIcon
            mode="compact"
            currentMode={effectiveSidebarMode}
            onClick={() => toggleSidebarMode('compact')}
          />
          <SidebarModeIcon
            mode="standard"
            currentMode={effectiveSidebarMode}
            onClick={() => toggleSidebarMode('standard')}
          />
          <SidebarModeIcon
            mode="expanded"
            currentMode={effectiveSidebarMode}
            onClick={() => toggleSidebarMode('expanded')}
          />
        </div>
      )}
    </div>
  );
  
  return (
    <div className={getSidebarClasses(effectiveSidebarMode)}>
      {renderHeader()}
      
      {effectiveSidebarMode === 'compact' ? (
        <CompactMode
          currentStep={currentStep}
          maxStep={maxStep}
          eventsCount={events.length}
          onStepChange={onStepChange}
          onAddEvent={handleAddEvent}
        />
      ) : (
        <>
          {/* Standard and Expanded mode content */}
          <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4 max-h-[300px] lg:max-h-none min-h-[100px]">
            {events.length === 0 && <p className="text-slate-400">No timeline events yet.</p>}
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-md transition-all duration-200 cursor-pointer flex justify-between items-center group ${
                  currentStep === event.step ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
                onClick={() => onStepChange(event.step)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && onStepChange(event.step)}
                aria-label={`Event: ${event.name}, Step ${event.step}. Details: ${getEventDetails(event)}${currentStep === event.step ? '. Current step.' : ''}`}
              >
                <div>
                  <p className={`font-medium ${currentStep === event.step ? 'text-white' : 'text-slate-100'}`}>{event.name}</p>
                  <p className={`text-xs ${currentStep === event.step ? 'text-purple-200' : 'text-slate-400'}`}>
                    Step {event.step} - {getEventDetails(event)}
                  </p>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditEvent(event.id); }}
                    className="p-1 bg-blue-500/30 hover:bg-blue-500 text-white rounded-full"
                    aria-label={`Edit event ${event.name}`}
                  >
                    <PencilIcon className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveEvent(event.id); }}
                    className="p-1 bg-red-500/30 hover:bg-red-500 text-white rounded-full"
                    aria-label={`Remove event ${event.name}`}
                  >
                    <XMarkIcon className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation and Add Event Button */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700">
            <button
              onClick={() => onStepChange(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous step"
            >
              Prev
            </button>
            <span className="text-slate-300" aria-live="polite">Step {currentStep} / {maxStep}</span>
            <button
              onClick={() => onStepChange(Math.min(maxStep || 1, currentStep + 1))}
              disabled={currentStep === maxStep && events.length > 0}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next step"
            >
              Next
            </button>
          </div>
          
          <button
            onClick={handleAddEvent}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center justify-center space-x-2"
            aria-label="Add new timeline event"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Timeline Event</span>
          </button>
          
          {/* Expanded Mode Details */}
          {effectiveSidebarMode === 'expanded' && (
            <ExpandedMode
              currentEvent={currentEvent}
              hotspots={hotspots}
            />
          )}
        </>
      )}

      {/* Existing modals */}
      <EnhancedTimelineEventModal
        isOpen={enhancedModalOpen}
        onClose={() => {
          setEnhancedModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEnhancedEvent}
        event={editingEvent}
        hotspots={hotspots}
        isTimedMode={isTimedMode}
      />
    </div>
  );
};

export default TimelineControls;