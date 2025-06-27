// src/client/components/MobileEditorLayout.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotspotData, TimelineEventData } from '../../shared/types';

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
  showSuccessMessage
}) => {
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
  const [activePanel, setActivePanel] = useState<'image' | 'properties' | 'timeline'>('image');
  
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
      
      // Get safe area insets
      const style = getComputedStyle(document.documentElement);
      const safeAreaTop = parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0');
      const safeAreaBottom = parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0');

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
      if (isKeyboardVisible) {
        setEditorMode('modal');
        setActivePanel('properties');
      } else if (visualViewportHeight < 600) {
        setEditorMode('fullscreen');
      } else {
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

  // Handle back gesture detection
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
            <h1 className="text-lg font-semibold text-white truncate max-w-48">
              {projectName}
            </h1>
          </div>
          
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isSaving
                ? 'text-slate-400 cursor-not-allowed'
                : showSuccessMessage
                ? 'text-green-400'
                : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            {isSaving ? 'Saving...' : showSuccessMessage ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Image Editing Area */}
        <div className="flex-1 relative bg-slate-800 min-h-0">
          {children}
        </div>

        {/* Bottom Panel Navigation */}
        <div className="flex-shrink-0 bg-slate-900 border-t border-slate-700">
          <div className="flex">
            {[
              { id: 'image', label: 'Image', icon: '🖼️' },
              { id: 'properties', label: 'Properties', icon: '⚙️' },
              { id: 'timeline', label: 'Timeline', icon: '📅' }
            ].map((panel) => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id as any)}
                className={`flex-1 py-3 px-2 text-center text-sm font-medium transition-colors ${
                  activePanel === panel.id
                    ? 'text-purple-400 bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{panel.icon}</span>
                  <span>{panel.label}</span>
                </div>
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
          <button
            onClick={onSave}
            className="text-purple-400 hover:text-purple-300"
          >
            Save
          </button>
        </div>
      </div>

      {/* Full-height content for comfortable editing */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          paddingBottom: `${viewport.keyboardHeight + viewport.safeAreaInsets.bottom}px` 
        }}
      >
        {/* Properties editing content would go here */}
        <div className="p-4">
          {/* This would contain the MobileHotspotEditor or similar */}
        </div>
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