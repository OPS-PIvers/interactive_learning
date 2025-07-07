// src/client/components/MobileEditorModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { getActualViewportHeight, getKeyboardHeight, isKeyboardVisible } from '../utils/mobileUtils';

interface MobileEditorModalProps {
  isOpen: boolean;
  hotspot: HotspotData | null;
  timelineEvents: TimelineEventData[];
  currentStep: number;
  onClose: () => void;
  onUpdateHotspot: (updates: Partial<HotspotData>) => void;
  onDeleteHotspot: () => void;
  onAddTimelineEvent: (event: TimelineEventData) => void;
  onUpdateTimelineEvent: (event: TimelineEventData) => void;
  onDeleteTimelineEvent: (eventId: string) => void;
}

interface KeyboardState {
  isVisible: boolean;
  height: number;
  animating: boolean;
}

interface TabState {
  activeTab: 'basic' | 'style' | 'timeline' | 'advanced';
  canSwitchTabs: boolean;
}

const MOBILE_COLORS = [
  { name: 'Purple', value: 'bg-purple-500', color: '#a855f7' },
  { name: 'Blue', value: 'bg-blue-500', color: '#3b82f6' },
  { name: 'Green', value: 'bg-green-500', color: '#22c55e' },
  { name: 'Red', value: 'bg-red-500', color: '#ef4444' },
  { name: 'Yellow', value: 'bg-yellow-500', color: '#eab308' },
  { name: 'Pink', value: 'bg-pink-500', color: '#ec4899' },
  { name: 'Indigo', value: 'bg-indigo-500', color: '#6366f1' },
  { name: 'Gray', value: 'bg-gray-500', color: '#6b7280' },
];

const INTERACTION_TYPES = [
  { value: InteractionType.SHOW_HOTSPOT, label: 'Show Hotspot' },
  { value: InteractionType.PULSE_HOTSPOT, label: 'Pulse Hotspot' },
  { value: InteractionType.HIGHLIGHT_HOTSPOT, label: 'Highlight Area' },
  { value: InteractionType.PAN_ZOOM_TO_HOTSPOT, label: 'Zoom to Hotspot' },
  { value: InteractionType.SHOW_TEXT, label: 'Show Text' },
  { value: InteractionType.PLAY_VIDEO, label: 'Play Video' },
  { value: InteractionType.PLAY_AUDIO, label: 'Play Audio' },
];

const MobileEditorModal: React.FC<MobileEditorModalProps> = ({
  isOpen,
  hotspot,
  timelineEvents,
  currentStep,
  onClose,
  onUpdateHotspot,
  onDeleteHotspot,
  onAddTimelineEvent,
  onUpdateTimelineEvent,
  onDeleteTimelineEvent
}) => {
  const [keyboard, setKeyboard] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    animating: false
  });

  const [tabState, setTabState] = useState<TabState>({
    activeTab: 'basic',
    canSwitchTabs: true
  });

  const [localHotspot, setLocalHotspot] = useState<HotspotData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State for inline event editing
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [currentEditData, setCurrentEditData] = useState<TimelineEventData | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Sync local hotspot with prop
  useEffect(() => {
    if (hotspot) {
      setLocalHotspot({ ...hotspot });
      setHasUnsavedChanges(false);
    }
  }, [hotspot]);

  // Enhanced keyboard detection for mobile
  useEffect(() => {
    if (!isOpen) return;

    const detectKeyboard = () => {
      const keyboardHeight = getKeyboardHeight();
      const keyboardVisible = isKeyboardVisible();

      setKeyboard(prev => ({
        isVisible: keyboardVisible,
        height: keyboardHeight,
        animating: prev.isVisible !== keyboardVisible
      }));

      // Adjust tab switching ability when keyboard is open
      setTabState(prev => ({
        ...prev,
        canSwitchTabs: !keyboardVisible
      }));

      // Auto-scroll to focused input when keyboard opens
      if (keyboardVisible && document.activeElement) {
        setTimeout(() => {
          document.activeElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    };

    detectKeyboard();

    // Use both window resize and visual viewport resize for better detection
    const handleResize = () => {
      // Debounce to avoid excessive calls during orientation changes
      setTimeout(detectKeyboard, 100);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    
    // Also listen for orientation changes
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isOpen]);

  // Auto-save functionality with debouncing
  const autoSaveTimeoutRef = useRef<number>();
  const saveChanges = useCallback(() => {
    if (localHotspot && hasUnsavedChanges) {
      onUpdateHotspot(localHotspot);
      setHasUnsavedChanges(false);
    }
  }, [localHotspot, hasUnsavedChanges, onUpdateHotspot]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = window.setTimeout(saveChanges, 1000);
  }, [saveChanges]);

  const updateLocalHotspot = useCallback((updates: Partial<HotspotData>) => {
    setLocalHotspot(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // Handle modal close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      saveChanges();
    }
    onClose();
  }, [hasUnsavedChanges, saveChanges, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      
      // Set height to current viewport height to prevent jumps
      const currentHeight = getActualViewportHeight();
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = `${currentHeight}px`;
      document.body.style.top = `-${scrollPositionRef.current}px`;
    } else {
      const scrollY = scrollPositionRef.current;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  const renderBasicTab = () => (
    <div className="space-y-6 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Title
        </label>
        <input
          type="text"
          value={localHotspot?.title || ''}
          onChange={(e) => updateLocalHotspot({ title: e.target.value })}
          className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          placeholder="Enter hotspot title"
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={localHotspot?.description || ''}
          onChange={(e) => updateLocalHotspot({ description: e.target.value })}
          rows={4}
          className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          placeholder="Enter detailed description"
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Link (Optional)
        </label>
        <input
          type="url"
          value={localHotspot?.link || ''}
          onChange={(e) => updateLocalHotspot({ link: e.target.value })}
          className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          placeholder="https://example.com"
          style={{ fontSize: '16px' }}
        />
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-6 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {MOBILE_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateLocalHotspot({ backgroundColor: color.value })}
              className={`aspect-square rounded-xl border-3 transition-all duration-200 ${
                localHotspot?.backgroundColor === color.value
                  ? 'border-white ring-4 ring-purple-500 ring-opacity-50 scale-105'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.color }}
              aria-label={color.name}
            >
              {localHotspot?.backgroundColor === color.value && (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Size
        </label>
        <div className="flex space-x-3">
          {[
            { value: 'small', label: 'Small', size: '32px' },
            { value: 'medium', label: 'Medium', size: '40px' },
            { value: 'large', label: 'Large', size: '48px' }
          ].map((size) => (
            <button
              key={size.value}
              onClick={() => updateLocalHotspot({ size: size.value as any })}
              className={`flex-1 p-4 border-2 rounded-lg transition-all duration-200 ${
                localHotspot?.size === size.value
                  ? 'border-purple-500 bg-purple-500 bg-opacity-20'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`rounded-full ${localHotspot?.backgroundColor || 'bg-purple-500'}`}
                  style={{ width: size.size, height: size.size }}
                />
                <span className="text-sm text-gray-300">{size.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimelineTab = () => {
    const hotspotEvents = timelineEvents.filter(e => e.targetId === hotspot?.id);

    const handleEditClick = useCallback((eventToEdit: TimelineEventData) => {
      // If trying to edit a new event while another is already being edited,
      // effectively cancel the previous edit before starting the new one.
      if (editingEventId && editingEventId !== eventToEdit.id) {
        // console.log("Switching edit focus, previous changes (if any and not saved) are discarded.");
        // No explicit save/cancel prompt for simplicity, just switch.
      }

      if (editingEventId === eventToEdit.id) {
        // Clicked on the already editing event's edit button again - treat as cancel
        setEditingEventId(null);
        setCurrentEditData(null);
      } else {
        // Start editing the new event
        setEditingEventId(eventToEdit.id);
        setCurrentEditData({ ...eventToEdit }); // Create a fresh copy for editing
      }
    }, [editingEventId]); // Dependency: editingEventId to correctly handle switching logic

    const handleSaveEdit = useCallback(() => {
      if (currentEditData && editingEventId) {
        if (!currentEditData.name.trim()) {
          alert("Event name cannot be empty.");
          return;
        }
        if (isNaN(currentEditData.step) || currentEditData.step < 0) {
          alert("Step must be a non-negative number.");
          return;
        }
        if (isNaN(currentEditData.duration) || currentEditData.duration <= 0) {
          alert("Duration must be a positive number.");
          return;
        }

        onUpdateTimelineEvent(currentEditData);
        setEditingEventId(null);
        setCurrentEditData(null);
      }
    }, [currentEditData, editingEventId, onUpdateTimelineEvent]);

    const handleCancelEdit = useCallback(() => {
      setEditingEventId(null);
      setCurrentEditData(null);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      // No need for currentEditData in dependency array for setCurrentEditData(prev => ...)
      const { name, value } = e.target;
      setCurrentEditData(prev => prev ? {
        ...prev,
        [name]: (name === 'step' || name === 'duration') ? parseInt(value, 10) : value
      } : null);
    }, []);

    const renderEventEditForm = (eventData: TimelineEventData) => {
      if (!currentEditData || currentEditData.id !== eventData.id) return null;

      // Consistent input styling
      const inputBaseClasses = "w-full p-2.5 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors shadow-sm";
      const labelBaseClasses = "block text-xs font-medium text-slate-300 mb-1.5";

      return (
        <div className="mt-2 p-4 bg-slate-700 rounded-b-lg border-x border-b border-purple-500 space-y-4 shadow-lg">
          {/* Removed the extra title, as the main event item already shows the name */}
          <div>
            <label htmlFor={`eventName-${eventData.id}`} className={labelBaseClasses}>Event Name</label>
            <input
              type="text"
              id={`eventName-${eventData.id}`}
              name="name"
              value={currentEditData.name}
              onChange={handleInputChange}
              className={inputBaseClasses}
              placeholder="Descriptive event name"
            />
          </div>
          <div>
            <label htmlFor={`eventType-${eventData.id}`} className={labelBaseClasses}>Interaction Type</label>
            <select
              id={`eventType-${eventData.id}`}
              name="type"
              value={currentEditData.type}
              onChange={handleInputChange}
              className={`${inputBaseClasses} appearance-none`}
            >
              {INTERACTION_TYPES.map(type => (
                <option key={type.value} value={type.value} className="bg-slate-700 text-white py-1">
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`eventStep-${eventData.id}`} className={labelBaseClasses}>Step</label>
              <input
                type="number"
                id={`eventStep-${eventData.id}`}
                name="step"
                value={currentEditData.step}
                onChange={handleInputChange}
                className={inputBaseClasses}
                min="0"
              />
            </div>
            <div>
              <label htmlFor={`eventDuration-${eventData.id}`} className={labelBaseClasses}>Duration (ms)</label>
              <input
                type="number"
                id={`eventDuration-${eventData.id}`}
                name="duration"
                value={currentEditData.duration}
                onChange={handleInputChange}
                className={inputBaseClasses}
                min="1"
              />
            </div>
          </div>
          <div className="flex justify-end items-center space-x-3 pt-3 border-t border-slate-600 mt-3">
            <button
              onClick={handleCancelEdit} // This should effectively call handleEditClick with the same event to toggle off
              className="px-4 py-2 text-sm font-medium bg-slate-500 hover:bg-slate-400 text-slate-100 rounded-lg transition-colors min-h-[40px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors min-h-[40px]"
            >
              Save Changes
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4 p-4 pb-16"> {/* Added padding-bottom for scroll room when keyboard is up */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">Timeline Events</h3>
          <button
            onClick={() => {
              const newEvent: TimelineEventData = {
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Ensure unique ID
                name: 'New Event',
                type: InteractionType.SHOW_HOTSPOT,
                targetId: hotspot?.id || '',
                step: currentStep,
                duration: 2000,
                // message: '', // Optional: initialize if needed
              };
              onAddTimelineEvent(newEvent);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Add Event
          </button>
        </div>

        {hotspotEvents.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No timeline events for this hotspot.</p>
            <p className="text-sm">Add events to make this hotspot interactive.</p>
          </div>
        )}

        <div className="space-y-3"> {/* Increased spacing between event items */}
          {hotspotEvents.map((event) => {
            const isEditingThisEvent = editingEventId === event.id;
            return (
              <div
                key={event.id}
                className={`bg-slate-800 rounded-lg border transition-all duration-200 ease-in-out shadow-md
                  ${isEditingThisEvent ? 'border-purple-500 ring-1 ring-purple-500 bg-slate-750/70' : 'border-slate-700 hover:border-slate-600'}`}
              >
                {/* Reduced padding bottom on this div if form is open, form has its own padding */}
                <div className={`p-3.5 ${isEditingThisEvent ? 'pb-2 rounded-t-lg' : 'rounded-lg'}`}>
                  <div className="flex items-start justify-between"> {/* items-start for better alignment with multi-line text */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-purple-300 truncate" title={event.name}>
                        {event.name || `Event`}
                      </p>
                      <p className="text-xs text-slate-400">
                        Type: <span className="text-slate-300 font-medium">{INTERACTION_TYPES.find(t => t.value === event.type)?.label || 'Unknown'}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Step: <span className="text-slate-300 font-medium">{event.step}</span> • Duration: <span className="text-slate-300 font-medium">{event.duration}ms</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2 ml-2"> {/* Increased space for buttons */}
                      <button
                        onClick={() => handleEditClick(event)}
                        className={`p-2.5 rounded-lg transition-colors
                                    ${isEditingThisEvent ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-slate-700 text-slate-300 hover:text-purple-400 hover:bg-slate-600'}`}
                        aria-label={isEditingThisEvent ? "Cancel Edit" : "Edit event"}
                      >
                        {isEditingThisEvent ? (
                          // Close Icon (X)
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          // Pencil Icon
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (editingEventId === event.id) {
                            setEditingEventId(null);
                            setCurrentEditData(null);
                          }
                          onDeleteTimelineEvent(event.id);
                        }}
                        className="p-2.5 bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-600 transition-colors"
                        aria-label="Delete event"
                      >
                        {/* Trash Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {isEditingThisEvent && currentEditData && renderEventEditForm(event)}
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  if (!isOpen || !hotspot || !localHotspot) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex flex-col">
      {/* Modal */}
      <div
        ref={modalRef}
        className="bg-slate-800 flex flex-col h-full"
        style={{
          paddingBottom: keyboard.isVisible ? `${keyboard.height}px` : '0px',
          transition: keyboard.animating ? 'padding-bottom 0.3s ease' : 'none'
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Hotspot</h2>
                {hasUnsavedChanges && (
                  <p className="text-xs text-yellow-400">Unsaved changes</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {tabState.canSwitchTabs && (
          <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700">
            <div className="flex">
              {[
                { id: 'basic', label: 'Basic' },
                { id: 'style', label: 'Style' },
                { id: 'timeline', label: 'Timeline' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabState(prev => ({ ...prev, activeTab: tab.id as any }))}
                  className={`flex-1 py-4 px-2 text-center transition-colors ${
                    tabState.activeTab === tab.id
                      ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-700'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {tabState.activeTab === 'basic' && renderBasicTab()}
          {tabState.activeTab === 'style' && renderStyleTab()}
          {tabState.activeTab === 'timeline' && renderTimelineTab()}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Hotspot</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this hotspot? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteHotspot();
                  setShowDeleteConfirm(false);
                  handleClose();
                }}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileEditorModal;