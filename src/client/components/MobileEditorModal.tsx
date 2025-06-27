// src/client/components/MobileEditorModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';

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
  { value: InteractionType.SHOW_HOTSPOT, label: 'Show Hotspot', icon: '👁️' },
  { value: InteractionType.PULSE_HOTSPOT, label: 'Pulse Hotspot', icon: '💓' },
  { value: InteractionType.HIGHLIGHT_HOTSPOT, label: 'Highlight Area', icon: '🔍' },
  { value: InteractionType.PAN_ZOOM_TO_HOTSPOT, label: 'Zoom to Hotspot', icon: '🔍' },
  { value: InteractionType.SHOW_TEXT, label: 'Show Text', icon: '📝' },
  { value: InteractionType.PLAY_VIDEO, label: 'Play Video', icon: '🎥' },
  { value: InteractionType.PLAY_AUDIO, label: 'Play Audio', icon: '🔊' },
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
      const windowHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || windowHeight;
      const keyboardHeight = Math.max(0, windowHeight - visualViewportHeight);
      const isKeyboardVisible = keyboardHeight > 100;

      setKeyboard(prev => ({
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        animating: prev.isVisible !== isKeyboardVisible
      }));

      // Adjust tab switching ability when keyboard is open
      setTabState(prev => ({
        ...prev,
        canSwitchTabs: !isKeyboardVisible
      }));

      // Auto-scroll to focused input when keyboard opens
      if (isKeyboardVisible && document.activeElement) {
        setTimeout(() => {
          document.activeElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    };

    detectKeyboard();

    window.addEventListener('resize', detectKeyboard);
    window.visualViewport?.addEventListener('resize', detectKeyboard);

    return () => {
      window.removeEventListener('resize', detectKeyboard);
      window.visualViewport?.removeEventListener('resize', detectKeyboard);
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

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Timeline Events</h3>
          <button
            onClick={() => {
              // Add new event logic
              const newEvent: TimelineEventData = {
                id: `event_${Date.now()}`,
                type: InteractionType.SHOW_HOTSPOT,
                targetId: hotspot?.id || '',
                step: currentStep,
                duration: 2000
              };
              onAddTimelineEvent(newEvent);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Add Event
          </button>
        </div>

        <div className="space-y-3">
          {hotspotEvents.map((event) => (
            <div
              key={event.id}
              className="bg-slate-700 rounded-lg p-4 border border-slate-600"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {INTERACTION_TYPES.find(t => t.value === event.type)?.icon || '⚡'}
                  </span>
                  <span className="text-white font-medium">
                    {INTERACTION_TYPES.find(t => t.value === event.type)?.label || 'Unknown'}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTimelineEvent(event.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-300">
                Step {event.step} • Duration: {event.duration}ms
              </div>
            </div>
          ))}

          {hotspotEvents.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📅</div>
              <p>No timeline events yet</p>
              <p className="text-sm">Add events to make this hotspot interactive</p>
            </div>
          )}
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
                { id: 'basic', label: 'Basic', icon: '📝' },
                { id: 'style', label: 'Style', icon: '🎨' },
                { id: 'timeline', label: 'Timeline', icon: '📅' }
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
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </div>
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