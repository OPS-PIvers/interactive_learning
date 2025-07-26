// src/client/components/MobileEditorModal.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useSwipeable } from 'react-swipeable';
import ReactPullToRefresh from 'react-pull-to-refresh';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { triggerHapticFeedback } from '../utils/hapticUtils';
import { useViewportHeight } from '../hooks/useViewportHeight';
import { mobileStateManager } from '../utils/mobileStateManager';

import TabContent from './mobile/TabContent';
const MobileEventPreview = lazy(() => import('./mobile/MobileEventPreview'));
const MobilePreviewOverlay = lazy(() => import('./mobile/MobilePreviewOverlay'));
const MobileEventTypeSelector = lazy(() => import('./mobile/MobileEventTypeSelector'));

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
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
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


const MOBILE_INTERACTION_TYPES = [
  // Visual Effects
  {
    category: 'Visual Effects',
    types: [
      { value: InteractionType.SPOTLIGHT, label: 'Spotlight', icon: '💡', description: 'Highlight specific area' },
      { value: InteractionType.PAN_ZOOM, label: 'Pan & Zoom', icon: '🔍', description: 'Focus on area' },
    ]
  },
  // Media Content
  {
    category: 'Media',
    types: [
      { value: InteractionType.SHOW_VIDEO, label: 'Video', icon: '🎥', description: 'Play video file' },
      { value: InteractionType.SHOW_AUDIO_MODAL, label: 'Audio', icon: '🎵', description: 'Play audio' },
      { value: InteractionType.SHOW_YOUTUBE, label: 'YouTube', icon: '📺', description: 'Play YouTube video' },
    ]
  },
  // Interactive
  {
    category: 'Interactive',
    types: [
      { value: InteractionType.SHOW_TEXT, label: 'Text Modal', icon: '💬', description: 'Show text popup' },
      { value: InteractionType.QUIZ, label: 'Quiz', icon: '❓', description: 'Ask question' },
    ]
  }
];

// Performance optimization: Create lookup map for interaction type labels
const interactionTypeLabelMap = new Map(
  MOBILE_INTERACTION_TYPES.flatMap(c => c.types).map(t => [t.value, t.label])
);

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
  onDeleteTimelineEvent,
  onInteractionStart,
  onInteractionEnd
}) => {
  const viewportHeight = useViewportHeight();
  const [isEditingHotspot, setIsEditingHotspot] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape'
  );

  const [tabState, setTabState] = useState<TabState>({
    activeTab: 'basic',
    canSwitchTabs: true
  });

  const [localHotspot, setLocalHotspot] = useState<HotspotData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEventData | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [eventToPreview, setEventToPreview] = useState<TimelineEventData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const initialModalHeight = useRef<number>(0);

  const handleRefresh = (resolve: () => void, reject: () => void) => {
    // Simulate a data refresh
    setTimeout(() => {
      resolve();
    }, 2000);
  };

  const handleSwipe = useSwipeable({
    onSwipedLeft: () => switchTab('right'),
    onSwipedRight: () => switchTab('left'),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const switchTab = (direction: 'left' | 'right') => {
    const tabs = ['basic', 'style', 'timeline'];
    const currentIndex = tabs.indexOf(tabState.activeTab);
    let nextIndex;

    if (direction === 'right') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    setTabState(prev => ({ ...prev, activeTab: tabs[nextIndex] as any }));
    triggerHapticFeedback('selection');
  };

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape'
      );
    };

    window.screen.orientation.addEventListener('change', handleOrientationChange);

    return () => {
      window.screen.orientation.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    if (hotspot) {
      const savedState = mobileStateManager.loadState();
      if (savedState && savedState.selectedHotspotId === hotspot.id) {
        // Restore state if it matches the current hotspot
        setLocalHotspot({ ...hotspot, ...savedState.hotspots.find(h => h.id === hotspot.id) });
      } else {
        setLocalHotspot({ ...hotspot });
      }
      setHasUnsavedChanges(false);
    }
  }, [hotspot]);

  useEffect(() => {
    if (isEditingHotspot) {
      onInteractionStart?.();
    } else {
      onInteractionEnd?.();
    }
  }, [isEditingHotspot, onInteractionStart, onInteractionEnd]);

  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      const handleFocusIn = (e: FocusEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          setIsEditingHotspot(true);
        }
      };
      const handleFocusOut = (e: FocusEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          setIsEditingHotspot(false);
        }
      };
      modal.addEventListener('focusin', handleFocusIn);
      modal.addEventListener('focusout', handleFocusOut);
      return () => {
        modal.removeEventListener('focusin', handleFocusIn);
        modal.removeEventListener('focusout', handleFocusOut);
      };
    }
  }, [modalRef]);

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
    setLocalHotspot(prev => {
      const newState = prev ? { ...prev, ...updates } : null;
      if (newState) {
        mobileStateManager.saveState({
          hotspots: [newState],
          selectedHotspotId: newState.id,
        });
      }
      return newState;
    });
    setHasUnsavedChanges(true);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  // Handle modal close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      saveChanges();
    }
    mobileStateManager.clearState();
    onClose();
  }, [hasUnsavedChanges, saveChanges, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      scrollPositionRef.current = window.scrollY; // Save scroll position
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollPositionRef.current}px`;
    } else {
      const scrollY = scrollPositionRef.current;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Memoize hotspot events to prevent unnecessary re-renders
  const hotspotEvents = useMemo(() => {
    return timelineEvents.filter(e => e.targetId === hotspot?.id);
  }, [timelineEvents, hotspot?.id]);

  const handlePreviewEvent = (event: TimelineEventData) => {
    setEventToPreview(event);
    setIsPreviewing(true);
    setIsPlaying(true); // Auto-play on open
  };

  const handleExitPreview = () => {
    setIsPreviewing(false);
    setEventToPreview(null);
    setIsPlaying(false);
    setPreviewKey(0); // Reset preview key
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleRestart = () => {
    // Force React to remount the preview component for a clean restart
    setPreviewKey(prev => prev + 1);
    setIsPlaying(true);
  };

  const handleHotspotEventsChange = (updatedHotspotEvents: TimelineEventData[]) => {
    const otherEvents = timelineEvents.filter(e => e.targetId !== hotspot?.id);
    const newTimeline = [...otherEvents, ...updatedHotspotEvents];

    // This is still a bit of a hack. A better approach would be to have more granular
    // update functions (onUpdate, onDelete, onReorder) passed to the editor.
    // For now, we'll find what changed and call the appropriate function.

    // Deletes
    hotspotEvents.forEach(oldEvent => {
      if (!updatedHotspotEvents.find(newEvent => newEvent.id === oldEvent.id)) {
        onDeleteTimelineEvent(oldEvent.id);
      }
    });

    // Additions and Updates
    updatedHotspotEvents.forEach(newEvent => {
      const oldEvent = hotspotEvents.find(e => e.id === newEvent.id);
      if (!oldEvent) {
        // onAddTimelineEvent(newEvent); This will be handled by the event type selector
      } else if (JSON.stringify(oldEvent) !== JSON.stringify(newEvent)) {
        onUpdateTimelineEvent(newEvent);
      }
    });
  };
  if (!isOpen || !hotspot || !localHotspot) return null;

  if (isPreviewing && eventToPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <MobileEventPreview
          key={previewKey}
          event={eventToPreview}
          hotspot={hotspot}
          onUpdateEvent={onUpdateTimelineEvent}
          backgroundImageUrl="data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='%23374151'/%3E%3C/svg%3E"
        />
        <MobilePreviewOverlay
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onRestart={handleRestart}
          onExit={handleExitPreview}
        />
      </div>
    );
  }

  const modalClasses = `fixed inset-0 z-50 bg-black bg-opacity-50 flex flex-col ${
    orientation === 'landscape' ? 'mobile-landscape-modal' : 'mobile-portrait-modal'
  }`;

  return (
    <div className={modalClasses}>
      {/* Modal */}
      <div
        ref={modalRef}
        className="bg-slate-800 flex flex-col"
        style={{ height: viewportHeight }}
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
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto" {...handleSwipe}>
          <ReactPullToRefresh onRefresh={() => Promise.resolve()}>
            <Suspense fallback={<div>Loading...</div>}>
              <TabContent
                activeTab={tabState.activeTab}
                localHotspot={localHotspot}
                updateLocalHotspot={updateLocalHotspot}
                hotspotEvents={hotspotEvents}
                editingEvent={editingEvent}
                setEditingEvent={setEditingEvent}
                onUpdateTimelineEvent={onUpdateTimelineEvent}
                handleHotspotEventsChange={handleHotspotEventsChange}
                setShowEventTypeSelector={setShowEventTypeSelector}
                handlePreviewEvent={handlePreviewEvent}
                setMediaFile={setMediaFile}
              />
            </Suspense>
          </ReactPullToRefresh>
        </div>

      </div>

      {showEventTypeSelector && (
        <Suspense fallback={<div>Loading...</div>}>
          <MobileEventTypeSelector
            onClose={() => setShowEventTypeSelector(false)}
            onSelect={(type) => {
              const newEvent: TimelineEventData = {
                id: `event_${Date.now()}`,
                name: `Event ${currentStep}`,
                type,
                targetId: hotspot?.id || '',
                step: currentStep,
                duration: 2000,
                // Initialize coordinates for positioning events
                ...(type === InteractionType.PAN_ZOOM_TO_HOTSPOT && { 
                  zoomFactor: 2.0,
                  targetX: hotspot?.x || 50,
                  targetY: hotspot?.y || 50
                }),
                ...(type === InteractionType.PAN_ZOOM && { 
                  targetX: hotspot?.x || 50,
                  targetY: hotspot?.y || 50
                }),
                ...(type === InteractionType.SPOTLIGHT && { 
                  spotlightX: hotspot?.x || 50,
                  spotlightY: hotspot?.y || 50
                })
              };
              onAddTimelineEvent(newEvent);
              setShowEventTypeSelector(false);
            }}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Hotspot</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this hotspot? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteHotspot();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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