import React, { useState, useCallback } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';

interface HotspotEditorPanelProps {
  hotspot: HotspotData;
  relatedEvents: TimelineEventData[];
  onUpdateHotspot: (updates: Partial<HotspotData>) => void;
  onEditHotspot: () => void; // For opening the full modal editor
  onDeleteHotspot: () => void;
  onAddEvent: () => void;
  onEditEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const HotspotEditorPanel: React.FC<HotspotEditorPanelProps> = ({
  hotspot,
  relatedEvents,
  onUpdateHotspot,
  onEditHotspot,
  onDeleteHotspot,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  const [title, setTitle] = useState(hotspot.title);
  const [description, setDescription] = useState(hotspot.description);
  const [size, setSize] = useState(hotspot.size);
  const [color, setColor] = useState(hotspot.color);
  const [pulse, setPulse] = useState(hotspot.pulse || false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value as HotspotData['size'];
    setSize(newSize);
    onUpdateHotspot({ size: newSize });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const handlePulseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPulse(e.target.checked);
    onUpdateHotspot({ pulse: e.target.checked });
  };

  const handleTitleBlur = () => {
    if (title.trim() === '') {
      setTitle(hotspot.title); // Reset if empty
      onUpdateHotspot({ title: hotspot.title }); // Also update parent state
    } else {
      onUpdateHotspot({ title });
    }
  };

  const handleDescriptionBlur = () => {
    onUpdateHotspot({ description });
  };

  const handleColorBlur = () => {
    onUpdateHotspot({ color });
  };

  // Debounce or throttle these if performance becomes an issue
  // For now, direct update on blur/change is fine for controlled inputs

  return (
    <div className="p-4 space-y-6 bg-slate-800 text-white rounded-lg shadow-xl">
      <div>
        <h3 className="text-xl font-semibold mb-3 text-sky-400">Edit Hotspot</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="hotspotTitle" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              id="hotspotTitle"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div>
            <label htmlFor="hotspotDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="hotspotDescription"
              value={description}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionBlur}
              rows={3}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hotspotSize" className="block text-sm font-medium text-slate-300 mb-1">Size</label>
              <select
                id="hotspotSize"
                value={size}
                onChange={handleSizeChange}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label htmlFor="hotspotColor" className="block text-sm font-medium text-slate-300 mb-1">Color</label>
              <input
                type="color"
                id="hotspotColor"
                value={color}
                onChange={handleColorChange}
                onBlur={handleColorBlur}
                className="w-full h-10 p-1 bg-slate-700 border border-slate-600 rounded-md" // Tailwind might not style type="color" padding well, check appearance
              />
            </div>
          </div>
           <div>
            <label htmlFor="hotspotPulse" className="flex items-center text-sm font-medium text-slate-300">
              <input
                type="checkbox"
                id="hotspotPulse"
                checked={pulse}
                onChange={handlePulseChange}
                className="mr-2 h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
              />
              Default Pulse Animation
            </label>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-3 text-sky-400">Timeline Events</h4>
        {relatedEvents.length === 0 ? (
          <p className="text-sm text-slate-400">No timeline events for this hotspot.</p>
        ) : (
          <ul className="space-y-2">
            {relatedEvents.map(event => (
              <li key={event.id} className="flex justify-between items-center p-2 bg-slate-700 rounded-md">
                <span className="text-sm">{event.name} (Step {event.step}) - {event.type}</span>
                <div className="space-x-2">
                  <button onClick={() => onEditEvent(event.id)} className="text-xs text-sky-400 hover:text-sky-300">Edit</button>
                  <button onClick={() => onDeleteEvent(event.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onAddEvent}
          className="mt-3 w-full p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium"
        >
          Add New Timeline Event
        </button>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-3 text-sky-400">Quick Actions</h4>
        <div className="space-y-2">
          <button
            onClick={onEditHotspot}
            className="w-full p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md text-sm"
          >
            Advanced Hotspot Settings
          </button>
          <button
            onClick={onDeleteHotspot}
            className="w-full p-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm"
          >
            Delete Hotspot
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotspotEditorPanel;
