// src/client/components/MobileEditorLayout.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types'; // Added InteractionType
import MobileHotspotEditor from './MobileHotspotEditor';
import MobileBackgroundSettings from './MobileBackgroundSettings';
import AuthButton from './AuthButton';

interface MobileEditorLayoutProps {
  projectName: string;
  backgroundImage: string | null;
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  currentStep: number;
  isEditing: boolean;
  children: React.ReactNode;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
  onAddHotspot?: () => void;
  selectedHotspot?: HotspotData | null;
  onUpdateHotspot?: (updates: Partial<HotspotData>) => void;
  onDeleteHotspot?: (hotspotId: string) => void; // HotspotId for clarity
  activePanelOverride?: 'image' | 'properties' | 'timeline' | 'background';
  onActivePanelChange?: (panel: 'image' | 'properties' | 'timeline' | 'background') => void;

  // Props needed for the enhanced MobileHotspotEditor's timeline tab
  onAddTimelineEvent: (event: TimelineEventData) => void;
  onUpdateTimelineEvent: (event: TimelineEventData) => void;
  onDeleteTimelineEvent: (eventId: string) => void;
  // allHotspots is already part of props (passed as 'hotspots'), re-pass to MobileHotspotEditor
  previewingEvents?: TimelineEventData[];
  onPreviewEvent?: (event: TimelineEventData) => void;
  onStopPreview?: () => void;

  // Background settings props
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4';
  onReplaceImage?: (file: File) => void;
  onBackgroundImageChange?: (url: string) => void;
  onBackgroundTypeChange?: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange?: (type: 'youtube' | 'mp4') => void;
}

interface ViewportState {
  height: number;
  availableHeight: number;
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
  };
}

const MobileEditorLayout: React.FC<MobileEditorLayoutProps> = ({
  projectName,
  backgroundImage,
  hotspots,
  timelineEvents,
  currentStep,
  isEditing,
  children,
  onBack,
  onSave,
  isSaving,
  showSuccessMessage,
  onAddHotspot,
  selectedHotspot,
  onUpdateHotspot,
  onDeleteHotspot,
  activePanelOverride,
  onActivePanelChange,
  onAddTimelineEvent,
  onUpdateTimelineEvent,
  onDeleteTimelineEvent,
  previewingEvents = [],
  onPreviewEvent,
  onStopPreview,
  backgroundType = 'image',
  backgroundVideoType = 'youtube',
  onReplaceImage,
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewingEventId, setPreviewingEventId] = useState<string | null>(null);

  const handlePreviewEvent = useCallback((event: TimelineEventData) => {
    setPreviewingEventId(event.id);
    setIsPreviewMode(true);
    onPreviewEvent?.(event);
  }, [onPreviewEvent]);

  const handleStopPreview = useCallback(() => {
    setPreviewingEventId(null);
    setIsPreviewMode(false);
    onStopPreview?.();
  }, [onStopPreview]);

  const [viewport, setViewport] = useState<ViewportState>({
    height: window.innerHeight,
    availableHeight: window.innerHeight,
    keyboardHeight: 0,
    isKeyboardVisible: false,
    safeAreaInsets: {
      top: 0,
      bottom: 0
    }
  });

  const [editorMode, setEditorMode] = useState<'compact' | 'fullscreen' | 'modal'>('compact');
  const [activePanel, setActivePanel] = useState<'image' | 'properties' | 'timeline' | 'background'>(activePanelOverride || 'image');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    if (activePanelOverride) {
      setActivePanel(activePanelOverride);
    }
  }, [activePanelOverride]);
  
  const layoutRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Enhanced viewport detection for mobile browsers
  useEffect(() => {
    const detectViewportChanges = () => {
      const windowHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || windowHeight;
      const keyboardHeight = Math.max(0, windowHeight - visualViewportHeight);
      const isKeyboardVisible = keyboardHeight > 100; // Threshold for keyboard detection
      
      // Get safe area insets - use CSS custom properties that are properly set
      const style = getComputedStyle(document.documentElement);
      const safeAreaTopValue = style.getPropertyValue('--safe-area-inset-top') || '0px';
      const safeAreaBottomValue = style.getPropertyValue('--safe-area-inset-bottom') || '0px';
      const safeAreaTop = parseInt(safeAreaTopValue) || 0;
      const safeAreaBottom = parseInt(safeAreaBottomValue) || 0;

      setViewport({
        height: windowHeight,
        availableHeight: visualViewportHeight,
        keyboardHeight,
        isKeyboardVisible,
        safeAreaInsets: {
          top: safeAreaTop,
          bottom: safeAreaBottom
        }
      });

      // Automatically switch layout modes based on available space
      const availableHeightWithoutKeyboard = visualViewportHeight; // visualViewportHeight already accounts for keyboard

      if (isKeyboardVisible && activePanel === 'properties') {
        // If keyboard is visible and we are on the properties panel,
        // check if there's enough space. If not, switch to modal.
        // Estimate typical header/toolbar height for 'compact' mode.
        const compactModeNonContentHeight = 120; // Approx height of header + bottom tabs
        if (availableHeightWithoutKeyboard < compactModeNonContentHeight + 200) { // 200px for content
          setEditorMode('modal');
        } else {
          setEditorMode('compact');
        }
      } else if (isKeyboardVisible && activePanel !== 'properties') {
        // If keyboard is visible but not on properties, modal might be suitable
        // to give more space to the primary content (e.g. image) by moving secondary elements (properties) to a modal.
        // However, the original logic forced properties panel here, which could be disruptive.
        // For now, let's assume if keyboard is up for non-properties, user might be interacting with browser UI (e.g. find in page)
        // or an unexpected scenario. Compact or fullscreen might still be better.
        // Re-evaluate if specific use cases for keyboard + non-properties panel arise.
        if (availableHeightWithoutKeyboard < 600) {
          setEditorMode('fullscreen');
        } else {
          setEditorMode('compact');
        }
      } else if (availableHeightWithoutKeyboard < 600) { // No keyboard, check height for fullscreen
        setEditorMode('fullscreen');
      } else { // Default to compact
        setEditorMode('compact');
      }
    };

    // Initial detection
    detectViewportChanges();

    // Listen for viewport changes
    window.addEventListener('resize', detectViewportChanges);
    window.visualViewport?.addEventListener('resize', detectViewportChanges);
    window.visualViewport?.addEventListener('scroll', detectViewportChanges);

    return () => {
      window.removeEventListener('resize', detectViewportChanges);
      window.visualViewport?.removeEventListener('resize', detectViewportChanges);
      window.visualViewport?.removeEventListener('scroll', detectViewportChanges);
    };
  }, []);

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const handleBackGesture = useCallback((e: TouchEvent) => {
    // Implement edge swipe detection for back navigation
    if (e.touches[0]?.clientX < 20 && !viewport.isKeyboardVisible) {
      onBack();
    }
  }, [onBack, viewport.isKeyboardVisible]);

  useEffect(() => {
    document.addEventListener('touchstart', handleBackGesture);
    return () => document.removeEventListener('touchstart', handleBackGesture);
  }, [handleBackGesture]);

  const renderCompactLayout = () => (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div 
        ref={toolbarRef}
        className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700"
        style={{ 
          paddingTop: `${viewport.safeAreaInsets.top}px`,
          height: `${56 + viewport.safeAreaInsets.top}px`
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-300 hover:text-white transition-colors -ml-2"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-white truncate max-w-32">
              {projectName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {onAddHotspot && (
              <button
                onClick={onAddHotspot}
                className="p-2 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                aria-label="Add Hotspot"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isSaving
                  ? 'text-slate-400 cursor-not-allowed'
                  : showSuccessMessage
                  ? 'text-green-400'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              {isSaving ? 'Saving...' : showSuccessMessage ? 'Saved!' : 'Save'}
            </button>
            
            <AuthButton variant="compact" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Conditional Content Based on Active Panel */}
        {activePanel === 'image' ? (
          /* Image Editing Area */
          <div className="flex-1 relative bg-slate-800 min-h-0">
            {children}
          </div>
        ) : activePanel === 'properties' ? (
          /* Properties Panel */
          <div className="flex-1 bg-slate-800 overflow-y-auto">
            {selectedHotspot && onUpdateHotspot && onDeleteHotspot ? (
              <MobileHotspotEditor
                hotspot={selectedHotspot}
                allHotspots={hotspots}
                timelineEvents={timelineEvents}
                currentStep={currentStep}
                onUpdate={onUpdateHotspot}
                onDelete={onDeleteHotspot ? () => onDeleteHotspot(selectedHotspot.id) : undefined}
                onAddTimelineEvent={onAddTimelineEvent}
                onUpdateTimelineEvent={onUpdateTimelineEvent}
                onDeleteTimelineEvent={onDeleteTimelineEvent}
              />
            ) : (
              <div className="p-6 text-center text-slate-400">
                <div className="mb-4">
                  <svg className="w-12 h-12 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">No Hotspot Selected</p>
                <p className="text-sm">Tap on a hotspot in the image to edit its properties</p>
              </div>
            )}
          </div>
        ) : activePanel === 'background' ? (
          /* Background Settings Panel */
          <div className="flex-1 bg-slate-800 overflow-y-auto">
            {onReplaceImage && onBackgroundImageChange && onBackgroundTypeChange && onBackgroundVideoTypeChange ? (
              <MobileBackgroundSettings
                backgroundImage={backgroundImage}
                backgroundType={backgroundType}
                backgroundVideoType={backgroundVideoType}
                onReplaceImage={onReplaceImage}
                onBackgroundImageChange={onBackgroundImageChange}
                onBackgroundTypeChange={onBackgroundTypeChange}
                onBackgroundVideoTypeChange={onBackgroundVideoTypeChange}
              />
            ) : (
              <div className="p-6 text-center text-slate-400">
                <div className="mb-4">
                  <svg className="w-12 h-12 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Background Settings</p>
                <p className="text-sm">Background upload handlers not available</p>
              </div>
            )}
          </div>
        ) : (
          /* Timeline Panel */
          <div className="flex-1 bg-slate-800 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Timeline Events</h3>
                <p className="text-sm text-slate-400">Current Step: {currentStep}</p>
              </div>

              {/* Timeline Events List */}
              <div className="space-y-3 mb-6">
                {timelineEvents.length > 0 ? (
                  timelineEvents
                    .sort((a, b) => a.step - b.step)
                    .map((event) => (
                      <div 
                        key={event.id}
                        className="bg-slate-700 rounded-lg p-3 border border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-400">
                            Step {event.step}
                          </span>
                          <span className="text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded">
                            {event.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-white font-medium">{event.name}</p>
                        {event.message && (
                          <p className="text-xs text-slate-300 mt-1">{event.message}</p>
                        )}
                        {event.targetId && hotspots.find(h => h.id === event.targetId) && (
                          <p className="text-xs text-blue-400 mt-1">
                            Target: {hotspots.find(h => h.id === event.targetId)?.title}
                          </p>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <svg className="w-10 h-10 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No timeline events yet</p>
                    <p className="text-xs mt-1">Timeline events are automatically created when you add hotspots</p>
                  </div>
                )}
              </div>

              {/* Timeline editing is now handled by the HorizontalTimeline component when isEditing is true */}
            </div>
          </div>
        )}

        {/* Bottom Panel Navigation */}
        <div className="flex-shrink-0 bg-slate-900 border-t border-slate-700">
          <div className="flex">
            {[
              { id: 'image', label: 'Image' },
              { id: 'properties', label: 'Properties' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'background', label: 'Background' }
            ].map((panel) => (
              <button
                key={panel.id}
                onClick={() => {
                  const newPanel = panel.id as 'image' | 'properties' | 'timeline' | 'background';
                  setActivePanel(newPanel);
                  onActivePanelChange?.(newPanel);
                }}
                className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors ${
                  activePanel === panel.id
                    ? 'text-purple-400 bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{panel.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFullscreenLayout = () => (
    <div className="fixed inset-0 bg-slate-900 z-50">
      {renderCompactLayout()}
    </div>
  );

  const renderModalLayout = () => (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Simplified header when in modal mode */}
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setEditorMode('compact')}
            className="text-slate-300 hover:text-white"
          >
            ← Back to Editor
          </button>
          <span className="text-white font-medium">Edit Properties</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className="text-purple-400 hover:text-purple-300"
            >
              Save
            </button>
            <AuthButton variant="compact" />
          </div>
        </div>
      </div>

      {/* Full-height content for comfortable editing */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          paddingBottom: `${viewport.keyboardHeight + viewport.safeAreaInsets.bottom}px` 
        }}
      >
        {activePanel === 'properties' && selectedHotspot && onUpdateHotspot && onDeleteHotspot ? (
          <MobileHotspotEditor
            hotspot={selectedHotspot}
            allHotspots={hotspots}
            timelineEvents={timelineEvents}
            currentStep={currentStep}
            onUpdate={onUpdateHotspot}
            onDelete={onDeleteHotspot ? () => onDeleteHotspot(selectedHotspot.id) : undefined}
            onAddTimelineEvent={onAddTimelineEvent}
            onUpdateTimelineEvent={onUpdateTimelineEvent}
            onDeleteTimelineEvent={onDeleteTimelineEvent}
          />
        ) : (
          <div className="p-6 text-center text-slate-400">
             <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">No Hotspot Selected</p>
            <p className="text-sm">Select a hotspot to edit its properties here, or tap 'Back to Editor' if this panel is not active.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Choose layout based on current mode
  switch (editorMode) {
    case 'fullscreen':
      return renderFullscreenLayout();
    case 'modal':
      return renderModalLayout();
    default:
      return (
        <div 
          ref={layoutRef}
          className="h-full w-full bg-slate-900 relative overflow-hidden"
          style={{ 
            height: `${viewport.availableHeight}px`,
            paddingBottom: `${viewport.safeAreaInsets.bottom}px`
          }}
        >
          {renderCompactLayout()}
        </div>
      );
  }
};

export default MobileEditorLayout;