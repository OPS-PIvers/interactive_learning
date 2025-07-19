// src/client/components/MobileEditorLayout.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotspotData, TimelineEventData, InteractionType, Project } from '../../shared/types';
import EditorToolbar from './EditorToolbar';
import MobileHotspotEditor from './MobileHotspotEditor';
import MobileBackgroundSettings from './MobileBackgroundSettings';
import AuthButton from './AuthButton';
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );
  const [showHotspotEditor, setShowHotspotEditor] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

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
      {/* Mobile Editor Toolbar with Settings Cog */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <span>← Back</span>
          </button>
          <h1 className="text-lg font-semibold text-white truncate mx-4">
            {project.title}
          </h1>
          <div className="flex items-center space-x-3">
            {/* Add Hotspot Button */}
            {onAddHotspot && (
              <button
                onClick={onAddHotspot}
                disabled={isPlacingHotspot}
                className={`p-2 rounded-lg transition-colors ${
                  isPlacingHotspot 
                    ? 'bg-red-600 text-white' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
                title={isPlacingHotspot ? "Tap on image to place hotspot" : "Add hotspot"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            
            {/* Settings Cog Menu */}
            <div className="relative settings-menu-container">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* Settings Dropdown Menu */}
              {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
                  <div className="p-4 space-y-4">
                    <div className="border-b border-slate-600 pb-3">
                      <h3 className="text-sm font-medium text-white mb-2">Zoom Controls</h3>
                      <div className="flex items-center space-x-2">
                        <button onClick={onZoomOut} className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="text-xs text-slate-300 min-w-0 flex-1 text-center">
                          {Math.round(currentZoom * 100)}%
                        </span>
                        <button onClick={onZoomIn} className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button onClick={onZoomReset} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white">
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-b border-slate-600 pb-3">
                      <h3 className="text-sm font-medium text-white mb-2">Background</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="backgroundType"
                            checked={backgroundType === 'image'}
                            onChange={() => onBackgroundTypeChange?.('image')}
                            className="text-purple-500"
                          />
                          <span className="text-xs text-slate-300">Image</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="backgroundType"
                            checked={backgroundType === 'video'}
                            onChange={() => onBackgroundTypeChange?.('video')}
                            className="text-purple-500"
                          />
                          <span className="text-xs text-slate-300">Video</span>
                        </label>
                        {onReplaceImage && (
                          <div className="mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="replace-image"
                              onChange={(e) => e.target.files?.[0] && onReplaceImage(e.target.files[0])}
                            />
                            <label
                              htmlFor="replace-image"
                              className="block w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white text-center cursor-pointer"
                            >
                              Replace Image
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-white mb-2">Viewer Modes</h3>
                      <div className="space-y-2">
                        {(['explore', 'selfPaced', 'timed'] as const).map((mode) => (
                          <label key={mode} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={viewerModes[mode] ?? false}
                              onChange={(e) => onViewerModeChange(mode, e.target.checked)}
                              className="text-purple-500"
                            />
                            <span className="text-xs text-slate-300 capitalize">
                              {mode === 'selfPaced' ? 'Self Paced' : mode}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Saving...</span>
                </>
              ) : (
                <span className="text-sm">Save</span>
              )}
            </button>
          </div>
        </div>
        
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mt-3 p-2 bg-green-600 text-white text-sm text-center rounded">
            Project saved successfully!
          </div>
        )}
      </div>

      {/* Main Content Area - Always show the image with hotspots */}
      <div className="flex-1 relative bg-slate-800 min-h-0">
        {children}
      </div>

      {/* Timeline at the bottom */}
      <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700">
        {/* We'll implement a simplified mobile timeline here later */}
        <div className="p-2 text-center text-slate-400 text-sm">
          Timeline: Step {currentStep} • {timelineEvents.length} events
        </div>
      </div>
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
      <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-2xl max-h-[80vh] flex flex-col">
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

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsMenu && !(event.target as Element).closest('.settings-menu-container')) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettingsMenu]);

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
            height: `${viewport.availableHeight}px`,
            paddingBottom: `${viewport.safeAreaInsets.bottom}px`
          }}
        >
          {renderCompactLayout()}
          {showHotspotEditor && renderHotspotEditorModal()}
        </div>
      );
  }
};

export default MobileEditorLayout;