// src/client/components/MobileEditorLayout.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotspotData, TimelineEventData, Project } from '../../shared/types';
import MobileEditorToolbar from './MobileEditorToolbar';
import MobileHotspotEditor from './MobileHotspotEditor';
import MobileNavigationBar from './mobile/MobileNavigationBar';
import { useMobileKeyboard } from '../hooks/useMobileKeyboard';

interface MobileEditorLayoutProps {
  project: Project;
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

  // Props for EditorToolbar
  isPlacingHotspot?: boolean;
  onToggleAutoProgression: (enabled: boolean) => void;
  isAutoProgression: boolean;
  autoProgressionDuration: number;
  onAutoProgressionDurationChange: (duration: number) => void;
  currentZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onCenter: () => void;
  currentColorScheme: string;
  onColorSchemeChange: (scheme: string) => void;
  viewerModes: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  onViewerModeChange: (mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => void;
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
  project,
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
  onBackgroundVideoTypeChange,

  // EditorToolbar props
  isPlacingHotspot,
  onToggleAutoProgression,
  isAutoProgression,
  autoProgressionDuration,
  onAutoProgressionDurationChange,
  currentZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onCenter,
  currentColorScheme,
  onColorSchemeChange,
  viewerModes,
  onViewerModeChange
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewingEventId, setPreviewingEventId] = useState<string | null>(null);
  
  // Mobile keyboard handling
  const keyboardInfo = useMobileKeyboard();

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
  const [showHotspotEditor, setShowHotspotEditor] = useState(false);

  useEffect(() => {
    if (activePanelOverride && activePanelOverride !== activePanel) {
      // Add a small delay to prevent race conditions during rapid panel switches
      const timeout = setTimeout(() => {
        setActivePanel(activePanelOverride);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [activePanelOverride, activePanel]);

  // Auto-open hotspot editor modal when a hotspot is selected
  useEffect(() => {
    if (selectedHotspot && !showHotspotEditor) {
      setShowHotspotEditor(true);
    }
  }, [selectedHotspot, showHotspotEditor]);

  // Close hotspot editor when no hotspot is selected
  useEffect(() => {
    if (!selectedHotspot && showHotspotEditor) {
      setShowHotspotEditor(false);
    }
  }, [selectedHotspot, showHotspotEditor]);
  
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
  }, [activePanel]);


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
    <div 
      className="flex flex-col h-full"
      style={{
        /* iOS Safari viewport handling */
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        maxHeight: '100dvh',
        /* Fallback for browsers without dvh support */
        minHeight: '100vh'
      }}
    >
      {/* Mobile Navigation Bar */}
      <MobileNavigationBar
        mode="editor"
        project={project}
        onBack={onBack}
        onSave={onSave}
        isSaving={isSaving}
        showSuccessMessage={showSuccessMessage}
        onAddHotspot={onAddHotspot}
        isPlacingHotspot={isPlacingHotspot}
        currentZoom={currentZoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onZoomReset={onZoomReset}
        backgroundType={backgroundType}
        onBackgroundTypeChange={onBackgroundTypeChange}
        onReplaceImage={onReplaceImage}
        viewerModes={viewerModes}
        onViewerModeChange={onViewerModeChange}
      />

      {/* Main Content Area - Always show the image with hotspots */}
      <div 
        className="flex-1 relative bg-slate-800 min-h-0 flex items-center justify-center"
        style={{
          /* Calculate proper height excluding header and toolbar */
          minHeight: 0,
          /* Account for fixed toolbar height to prevent content overlap */
          marginBottom: 'calc(var(--mobile-bottom-toolbar-height, 56px) + env(safe-area-inset-bottom, 0px))',
          /* Ensure content area is properly constrained */
          maxHeight: 'calc(100dvh - var(--mobile-header-height, 80px) - var(--mobile-bottom-toolbar-height, 56px) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          /* Fallback for browsers without dvh support */
          maxHeight: 'calc(100vh - 136px)', // 80px header + 56px toolbar
          overflow: 'hidden'
        }}
      >
        <div 
          className="w-full h-full relative overflow-hidden"
          style={{
            /* Safe area padding for content */
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
            /* Ensure container fits properly within bounds */
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          {children}
        </div>
      </div>
      
      {/* Fixed Toolbar - positioned outside flex layout */}
      <MobileEditorToolbar
        onAddHotspot={onAddHotspot}
        isPlacingHotspot={isPlacingHotspot}
        onSave={onSave}
        isSaving={isSaving}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
      />
    </div>
  );

  const renderFullscreenLayout = () => (
    <div className="fixed inset-0 bg-slate-900 z-50">
      {renderCompactLayout()}
    </div>
  );

  const renderHotspotEditorModal = () => (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => {
          setShowHotspotEditor(false);
          onActivePanelChange?.('image');
        }}
      />
      
      {/* Modal Content */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-2xl flex flex-col"
        style={{
          /* Dynamic max height for iOS Safari */
          maxHeight: 'min(80dvh, calc(100vh - env(safe-area-inset-top, 44px) - 32px))',
          /* Fallback for browsers without dvh support */
          maxHeight: '80vh',
          /* Ensure modal stays above iOS Safari UI */
          bottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: 150 // Higher z-index for iOS Safari
        }}
      >
        {/* Modal Header */}
        <div className="flex-shrink-0 bg-slate-800 rounded-t-2xl border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Edit Hotspot
            </h3>
            <button
              onClick={() => {
                setShowHotspotEditor(false);
                // Clear the selected hotspot when closing modal
                onActivePanelChange?.('image');
              }}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            paddingBottom: `${viewport.keyboardHeight + viewport.safeAreaInsets.bottom}px` 
          }}
        >
          {selectedHotspot && onUpdateHotspot && onDeleteHotspot ? (
            <MobileHotspotEditor
              hotspot={selectedHotspot}
              allHotspots={hotspots}
              timelineEvents={timelineEvents}
              currentStep={currentStep}
              onUpdate={onUpdateHotspot}
              onDelete={onDeleteHotspot}
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
              <p className="text-sm">Please select a hotspot to edit.</p>
            </div>
          )}
        </div>

        {/* Modal Footer with Save & Close */}
        <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 p-4">
          <button
            onClick={() => {
              setShowHotspotEditor(false);
              onActivePanelChange?.('image');
            }}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </>
  );

  // Choose layout based on current mode
  switch (editorMode) {
    case 'fullscreen':
      return (
        <>
          {renderFullscreenLayout()}
          {showHotspotEditor && renderHotspotEditorModal()}
        </>
      );
    case 'modal':
      return (
        <>
          {renderFullscreenLayout()}
          {showHotspotEditor && renderHotspotEditorModal()}
        </>
      );
    default:
      return (
        <div 
          ref={layoutRef}
          className={`h-full w-full bg-slate-900 relative overflow-hidden keyboard-aware-container ${keyboardInfo.isVisible ? 'keyboard-open' : ''}`}
          style={{ 
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderCompactLayout()}
          {showHotspotEditor && renderHotspotEditorModal()}
        </div>
      );
  }
};

export default MobileEditorLayout;