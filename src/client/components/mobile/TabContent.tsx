import React, { Suspense } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../../shared/types';

const MobileTextSettings = React.lazy(() => import('./MobileTextSettings'));
const MobileEventEditor = React.lazy(() => import('./MobileEventEditor'));
const MobileCameraCapture = React.lazy(() => import('./MobileCameraCapture'));
const MobileVoiceRecorder = React.lazy(() => import('./MobileVoiceRecorder'));

interface TabContentProps {
  activeTab: 'basic' | 'style' | 'timeline' | 'advanced';
  localHotspot: HotspotData;
  updateLocalHotspot: (updates: Partial<HotspotData>) => void;
  hotspotEvents: TimelineEventData[];
  editingEvent: TimelineEventData | null;
  setEditingEvent: (event: TimelineEventData | null) => void;
  onUpdateTimelineEvent: (event: TimelineEventData) => void;
  handleHotspotEventsChange: (updatedHotspotEvents: TimelineEventData[]) => void;
  setShowEventTypeSelector: (show: boolean) => void;
  handlePreviewEvent: (event: TimelineEventData) => void;
  setMediaFile: (file: File | null) => void;
  MOBILE_COLORS: { name: string; value: string; color: string }[];
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  localHotspot,
  updateLocalHotspot,
  hotspotEvents,
  editingEvent,
  setEditingEvent,
  onUpdateTimelineEvent,
  handleHotspotEventsChange,
  setShowEventTypeSelector,
  handlePreviewEvent,
  setMediaFile,
  MOBILE_COLORS,
}) => {
  if (!localHotspot) return null;

  if (activeTab === 'basic') {
    return (
      <div className="space-y-6 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Title
          </label>
          <input
            type="text"
            value={localHotspot.title}
            onChange={(e) => updateLocalHotspot({ title: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter hotspot title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Description
          </label>
          <textarea
            value={localHotspot.description}
            onChange={(e) => updateLocalHotspot({ description: e.target.value })}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Enter hotspot description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Media
          </label>
          <div className="space-y-4">
            <Suspense fallback={<div>Loading...</div>}>
              <MobileCameraCapture
                onCapture={(file) => {
                  setMediaFile(file);
                  // Here you would typically trigger an upload process
                  // For now, we'll just log it.
                  console.log('Captured file:', file);
                }}
              />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <MobileVoiceRecorder
                onRecord={(file) => {
                  setMediaFile(file);
                  // Here you would typically trigger an upload process
                  // For now, we'll just log it.
                  console.log('Recorded file:', file);
                }}
              />
            </Suspense>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Media URL (optional)
          </label>
          <input
            type="url"
            value={localHotspot.link || ''}
            onChange={(e) => updateLocalHotspot({ link: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'style') {
    return (
      <div className="space-y-6 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Background Color
          </label>
          <div className="grid grid-cols-4 gap-3">
            {MOBILE_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateLocalHotspot({ backgroundColor: color.value })}
                className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
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
  }

  if (activeTab === 'timeline') {
    if (editingEvent) {
      const handleBack = () => setEditingEvent(null);
      return (
        <div className="p-4">
          <button onClick={handleBack} className="text-purple-400 hover:text-purple-300 mb-4">
            &larr; Back to Events
          </button>
          {editingEvent.type === InteractionType.SHOW_TEXT && (
            <MobileTextSettings
              event={editingEvent}
              onUpdate={(updatedEvent) => {
                onUpdateTimelineEvent(updatedEvent);
                setEditingEvent(updatedEvent);
              }}
            />
          )}
          {/* Add other event settings components here */}
        </div>
      );
    }

    return (
      <MobileEventEditor
        events={hotspotEvents}
        onAddEvent={() => setShowEventTypeSelector(true)}
        onEventsChange={handleHotspotEventsChange}
        onSelectEvent={(event) => {
          if (event.type === InteractionType.SHOW_TEXT) {
            setEditingEvent(event);
          }
          // Add handlers for other event types here
        }}
        onPreviewEvent={handlePreviewEvent}
      />
    );
  }

  return null;
};

export default TabContent;
