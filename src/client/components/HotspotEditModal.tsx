import React, { useState, useEffect } from 'react';
import { HotspotData, HotspotSize, HOTSPOT_COLORS } from '../../shared/types';
import Modal from './Modal';
import CheckIcon from './icons/CheckIcon';
import SliderControl from './SliderControl';

interface HotspotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hotspot: HotspotData) => void;
  hotspot: HotspotData | null;
}

const HotspotEditModal: React.FC<HotspotEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  hotspot
}) => {
  const [editingHotspot, setEditingHotspot] = useState<HotspotData | null>(null);

  const sizeToSliderValue: Record<HotspotSize, number> = {
    small: 0,
    medium: 1,
    large: 2,
  };

  const sliderValueToSize: Record<number, HotspotSize> = {
    0: 'small',
    1: 'medium',
    2: 'large',
  };

  useEffect(() => {
    if (hotspot) {
      setEditingHotspot({
        ...hotspot,
        size: hotspot.size || 'medium',
        color: hotspot.color || HOTSPOT_COLORS[0],
      });
    }
  }, [hotspot]);

  const handleSave = () => {
    if (editingHotspot) {
      onSave(editingHotspot);
      onClose();
    }
  };

  if (!editingHotspot) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Hotspot"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Hotspot Title
          </label>
          <input
            type="text"
            value={editingHotspot.title}
            onChange={(e) => setEditingHotspot(prev => prev ? { ...prev, title: e.target.value } : null)}
            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
            placeholder="Enter hotspot title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Description
          </label>
          <textarea
            value={editingHotspot.description}
            onChange={(e) => setEditingHotspot(prev => prev ? { ...prev, description: e.target.value } : null)}
            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white h-24"
            placeholder="Enter hotspot description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Hotspot Color
          </label>
          <div className="flex space-x-2">
            {HOTSPOT_COLORS.map(color => (
              <div
                key={color}
                className={`w-6 h-6 rounded cursor-pointer flex items-center justify-center ${color} ${editingHotspot.color === color ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : ''}`}
                onClick={() => setEditingHotspot(prev => prev ? { ...prev, color } : null)}
              >
                {editingHotspot.color === color && <CheckIcon className="w-4 h-4 text-white" />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <SliderControl
            label="Marker Size"
            min={0}
            max={2}
            step={1}
            value={editingHotspot.size ? sizeToSliderValue[editingHotspot.size] : 1}
            onChange={(value) => {
              setEditingHotspot(prev => prev ? { ...prev, size: sliderValueToSize[value] } : null);
            }}
            valueLabelMap={['Small', 'Medium', 'Large']}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Save Hotspot
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default HotspotEditModal;