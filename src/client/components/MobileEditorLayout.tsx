// src/client/components/MobileEditorLayout.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotspotData, TimelineEventData, Project } from '../../shared/types';
import MobileEditorToolbar from './MobileEditorToolbar';
import MobileHotspotEditor from './MobileHotspotEditor';
import MobileNavigationBar from './mobile/MobileNavigationBar';
import { useMobileKeyboard } from '../hooks/useMobileKeyboard';
import { useMobileToolbar, useToolbarSpacing, useContentAreaHeight } from '../hooks/useMobileToolbar';

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
  onDeleteHotspot?: (hotspotId: string) => void;
  activePanelOverride?: 'image' | 'properties' | 'timeline' | 'background';
  onActivePanelChange?: (panel: 'image' | 'properties' | 'timeline' | 'background') => void;
  onAddTimelineEvent: (event: TimelineEventData) => void;
  onUpdateTimelineEvent: (event: TimelineEventData) => void;
  onDeleteTimelineEvent: (eventId: string) => void;
  previewingEvents?: TimelineEventData[];
  onPreviewEvent?: (event: TimelineEventData) => void;
  onStopPreview?: () => void;
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4';
  onReplaceImage?: (file: File) => void;
  onBackgroundImageChange?: (url: string) => void;
  onBackgroundTypeChange?: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange?: (type: 'youtube' | 'mp4') => void;
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

const MobileEditorLayout: React.FC<MobileEditorLayoutProps> = (props) => {
  const {
    project,
    children,
    onBack,
    onSave,
    isSaving,
    showSuccessMessage,
    onAddHotspot,
    isPlacingHotspot,
    selectedHotspot,
    onUpdateHotspot,
    onDeleteHotspot,
    activePanelOverride,
    onActivePanelChange,
    hotspots,
    timelineEvents,
    currentStep,
    onAddTimelineEvent,
    onUpdateTimelineEvent,
    onDeleteTimelineEvent,
    currentZoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    backgroundType,
    onBackgroundTypeChange,
    onReplaceImage,
    viewerModes,
    onViewerModeChange,
  } = props;

  const [activePanel, setActivePanel] = useState<'image' | 'properties' | 'timeline' | 'background'>(activePanelOverride || 'image');
  const [showHotspotEditor, setShowHotspotEditor] = useState(false);

  const isTimelineVisible = activePanel === 'timeline';
  const { cssVariables } = useMobileToolbar(isTimelineVisible);
  const { marginBottom, maxHeight, paddingBottom } = useToolbarSpacing(isTimelineVisible);
  const keyboardInfo = useMobileKeyboard();

  useEffect(() => {
    if (activePanelOverride && activePanelOverride !== activePanel) {
      const timeout = setTimeout(() => setActivePanel(activePanelOverride), 0);
      return () => clearTimeout(timeout);
    }
  }, [activePanelOverride, activePanel]);

  useEffect(() => {
    setShowHotspotEditor(!!selectedHotspot);
  }, [selectedHotspot]);

  // Edge-swipe back gesture functionality
  const handleBackGesture = useCallback((e: TouchEvent) => {
    // Implement edge swipe detection for back navigation
    if (e.touches[0]?.clientX < 20 && !keyboardInfo.isVisible) {
      onBack();
    }
  }, [onBack, keyboardInfo.isVisible]);

  useEffect(() => {
    document.addEventListener('touchstart', handleBackGesture);
    return () => document.removeEventListener('touchstart', handleBackGesture);
  }, [handleBackGesture]);

  const layoutRef = useRef<HTMLDivElement>(null);

  const mainContentStyle: React.CSSProperties = {
    minHeight: 0,
    marginBottom,
    maxHeight,
    overflow: 'hidden',
    position: 'relative',
    flex: 1,
  };

  const renderCompactLayout = () => (
    <div
      className="flex flex-col h-full"
      style={{
        height: '100%', // Fill parent
        minHeight: '-webkit-fill-available',
      }}
    >
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
      <div className="flex-1 relative bg-slate-800 min-h-0 flex items-center justify-center" style={mainContentStyle}>
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {children}
        </div>
      </div>
      <MobileEditorToolbar
        onAddHotspot={onAddHotspot}
        isPlacingHotspot={isPlacingHotspot}
        onSave={onSave}
        isSaving={isSaving}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
        isTimelineVisible={isTimelineVisible}
      />
    </div>
  );

  const renderHotspotEditorModal = () => (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => {
          setShowHotspotEditor(false);
          onActivePanelChange?.('image');
        }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-2xl flex flex-col"
        style={{
          maxHeight: 'min(80dvh, calc(100vh - env(safe-area-inset-top, 44px) - 32px))',
          maxHeight: '80vh',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: 150,
        }}
      >
        <div className="flex-shrink-0 bg-slate-800 rounded-t-2xl border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Edit Hotspot</h3>
            <button
              onClick={() => {
                setShowHotspotEditor(false);
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
        <div
          className="flex-1 overflow-y-auto"
          style={{
            paddingBottom: `calc(${keyboardInfo.height}px + ${paddingBottom})`,
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

  return (
    <div
      ref={layoutRef}
      className={`h-full w-full bg-slate-900 relative overflow-hidden keyboard-aware-container ${keyboardInfo.isVisible ? 'keyboard-open' : ''}`}
      style={{
        ...cssVariables,
        height: 'var(--mobile-viewport-height, 100dvh)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {renderCompactLayout()}
      {showHotspotEditor && renderHotspotEditorModal()}
    </div>
  );
};

export default MobileEditorLayout;