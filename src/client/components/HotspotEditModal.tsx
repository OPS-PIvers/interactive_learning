import React, { useState, useEffect } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';
import Modal from './Modal';

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

  useEffect(() => {
    if (hotspot) {
      setEditingHotspot({ ...hotspot });
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
            Marker Size
          </label>
          <select
            value={editingHotspot.size || 'medium'}
            onChange={(e) => setEditingHotspot(prev => prev ? { ...prev, size: e.target.value as HotspotSize } : null)}
            className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
          >
            <option value="small">Small</option>
            <option value="medium">Medium (Default)</option>
            <option value="large">Large</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Choose the size of the hotspot marker. Medium is recommended for most use cases.
          </p>
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