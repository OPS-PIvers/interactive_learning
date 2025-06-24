import React, { useState, useCallback, useEffect } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import EventTypeToggle from './EventTypeToggle';
import PanZoomSettings from './PanZoomSettings';
import SpotlightSettings from './SpotlightSettings';
import EnhancedHotspotPreview from './EnhancedHotspotPreview';

interface EnhancedHotspotEditorModalProps {
  isOpen: boolean;
  selectedHotspot: HotspotData | null;
  relatedEvents: TimelineEventData[];
  currentStep: number;
  backgroundImage: string;
  onUpdateHotspot: (hotspot: HotspotData) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  onAddEvent: (event: TimelineEventData) => void;
  onUpdateEvent: (event: TimelineEventData) => void;
  onDeleteEvent: (eventId: string) => void;
  onClose: () => void;
}

const EnhancedHotspotEditorModal: React.FC<EnhancedHotspotEditorModalProps> = ({
  isOpen,
  selectedHotspot,
  relatedEvents,
  currentStep,
  backgroundImage,
  onUpdateHotspot,
  onDeleteHotspot,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onClose
}) => {
  // State for selected event types
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<InteractionType>>(new Set());
  
  // State for event settings
  const [zoomLevel, setZoomLevel] = useState(2.5);
  const [spotlightShape, setSpotlightShape] = useState<'circle' | 'rectangle' | 'oval'>('circle');
  const [dimPercentage, setDimPercentage] = useState(70);
  const [textContent, setTextContent] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'bottom' | 'left' | 'right' | 'center'>('center');

  // Position states for preview
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 35, y: 30, width: 120, height: 120 });
  const [textBoxPosition, setTextBoxPosition] = useState({ x: 50, y: 20, width: 200, height: 60 });

  // Initialize state from existing events
  useEffect(() => {
    if (!selectedHotspot) return;

    const eventTypes = new Set<InteractionType>();
    relatedEvents.forEach(event => {
      eventTypes.add(event.type);
      
      // Load existing settings
      if (event.type === InteractionType.PAN_ZOOM_TO_HOTSPOT && event.zoomFactor) {
        setZoomLevel(event.zoomFactor);
      }
      if (event.type === InteractionType.HIGHLIGHT_HOTSPOT) {
        if (event.highlightShape) setSpotlightShape(event.highlightShape);
        if (event.dimPercentage) setDimPercentage(event.dimPercentage);
        // Load spotlight position data
        if (event.spotlightX !== undefined && event.spotlightY !== undefined) {
          setSpotlightPosition({
            x: event.spotlightX,
            y: event.spotlightY,
            width: event.spotlightWidth || 120,
            height: event.spotlightHeight || 120
          });
        }
      }
      if (event.type === InteractionType.SHOW_TEXT && event.textContent) {
        setTextContent(event.textContent);
        if (event.textPosition) setTextPosition(event.textPosition);
      }
    });
    
    setSelectedEventTypes(eventTypes);
  }, [selectedHotspot, relatedEvents]);

  const handleEventTypeToggle = useCallback((type: InteractionType) => {
    setSelectedEventTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedHotspot) return;

    // Delete existing events for this hotspot at current step
    relatedEvents.forEach(event => {
      if (event.step === currentStep) {
        onDeleteEvent(event.id);
      }
    });

    // Create new events based on selected types
    selectedEventTypes.forEach(type => {
      const baseEvent: TimelineEventData = {
        id: `event_${type}_${Date.now()}_${Math.random()}`,
        step: currentStep,
        name: `${type} ${selectedHotspot.title}`,
        type,
        targetId: selectedHotspot.id,
        message: '' // Explicitly set to empty string to prevent undefined Firebase errors
      };

      // Add type-specific properties with positioning
      switch (type) {
        case InteractionType.PAN_ZOOM_TO_HOTSPOT:
          baseEvent.zoomFactor = zoomLevel;
          break;
        case InteractionType.HIGHLIGHT_HOTSPOT:
          baseEvent.highlightShape = spotlightShape;
          baseEvent.dimPercentage = dimPercentage;
          baseEvent.spotlightX = spotlightPosition.x;
          baseEvent.spotlightY = spotlightPosition.y;
          baseEvent.spotlightWidth = spotlightPosition.width;
          baseEvent.spotlightHeight = spotlightPosition.height;
          break;
        case InteractionType.SHOW_TEXT:
          baseEvent.textContent = textContent;
          baseEvent.textPosition = textPosition;
          baseEvent.textX = textBoxPosition.x;
          baseEvent.textY = textBoxPosition.y;
          baseEvent.textWidth = textBoxPosition.width;
          baseEvent.textHeight = textBoxPosition.height;
          break;
        case InteractionType.PULSE_HOTSPOT:
          baseEvent.duration = 3000; // Default duration
          break;
      }

      onAddEvent(baseEvent);
    });

    onClose();
  }, [
    selectedHotspot,
    relatedEvents,
    currentStep,
    selectedEventTypes,
    zoomLevel,
    spotlightShape,
    dimPercentage,
    textContent,
    textPosition,
    spotlightPosition,
    textBoxPosition,
    onDeleteEvent,
    onAddEvent,
    onClose
  ]);

  if (!isOpen || !selectedHotspot) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-2 transition-opacity duration-300 ease-in-out">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] flex overflow-hidden border border-slate-700">
        
        {/* Left Panel - Event Configuration */}
        <div className="w-1/2 p-4 sm:p-6 border-r border-slate-700 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center border-b border-slate-700 bg-slate-800/50 pb-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Edit Hotspot</h2>
              <p className="text-sm text-slate-400">Configure interactions and behavior</p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700" 
              aria-label="Close modal"
            >
              <XMarkIcon className="w-7 h-7" />
            </button>
          </header>

          {/* Event Type Selection */}
          <EventTypeToggle 
            selectedTypes={selectedEventTypes}
            onToggle={handleEventTypeToggle}
          />

          {/* Dynamic Settings Panels */}
          {selectedEventTypes.has(InteractionType.PAN_ZOOM_TO_HOTSPOT) && (
            <PanZoomSettings 
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
            />
          )}

          {selectedEventTypes.has(InteractionType.HIGHLIGHT_HOTSPOT) && (
            <SpotlightSettings
              shape={spotlightShape}
              dimPercentage={dimPercentage}
              onShapeChange={setSpotlightShape}
              onDimPercentageChange={setDimPercentage}
            />
          )}

          {selectedEventTypes.has(InteractionType.SHOW_TEXT) && (
            <div className="mb-6 bg-slate-700 rounded-lg p-4">
              <h4 className="text-md font-medium text-white mb-4 flex items-center">
                <span className="text-xl mr-2">💬</span>
                Text Settings
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                  <textarea 
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white resize-none" 
                    rows={3} 
                    placeholder="Enter your message..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                  <select 
                    value={textPosition}
                    onChange={(e) => setTextPosition(e.target.value as any)}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Right Panel - Enhanced Preview */}
        <div className="w-1/2 p-4 sm:p-6 bg-slate-800">
          <EnhancedHotspotPreview
            backgroundImage={backgroundImage}
            hotspot={selectedHotspot}
            selectedEventTypes={selectedEventTypes}
            zoomLevel={zoomLevel}
            spotlightShape={spotlightShape}
            dimPercentage={dimPercentage}
            textContent={textContent}
            textPosition={textPosition}
            onSpotlightPositionChange={setSpotlightPosition}
            onTextPositionChange={setTextBoxPosition}
          />
          
          {/* Event Sequence List - Enhanced */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Event Sequence</h4>
            <div className="space-y-2">
              {Array.from(selectedEventTypes).map((type, index) => {
                const getEventDisplay = () => {
                  switch (type) {
                    case InteractionType.PAN_ZOOM_TO_HOTSPOT:
                      return `${index + 1}. Pan & Zoom (${zoomLevel.toFixed(1)}x)`;
                    case InteractionType.HIGHLIGHT_HOTSPOT:
                      return `${index + 1}. Spotlight (${spotlightShape}, ${dimPercentage}% dim)`;
                    case InteractionType.SHOW_TEXT:
                      return `${index + 1}. Show Text: "${textContent.substring(0, 20)}${textContent.length > 20 ? '...' : ''}"`;
                    case InteractionType.PULSE_HOTSPOT:
                      return `${index + 1}. Pulse Animation`;
                    default:
                      return `${index + 1}. ${type.replace('_', ' ')}`;
                  }
                };

                return (
                  <div key={type} className="flex items-center space-x-2 text-sm text-slate-300">
                    <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {index + 1}
                    </span>
                    <span>{getEventDisplay()}</span>
                  </div>
                );
              })}
              {selectedEventTypes.size === 0 && (
                <p className="text-sm text-slate-400">No events selected</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHotspotEditorModal;