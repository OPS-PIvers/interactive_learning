import React from 'react';
import { SlideElement, DeviceType } from '../../../shared/slideTypes';

interface MobilePropertiesPanelProps {
  selectedElement: SlideElement | null;
  deviceType: DeviceType;
  onDelete: () => void;
  onClose: () => void;
}

export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({
  selectedElement,
  deviceType,
  onDelete,
  onClose,
}) => {
  if (!selectedElement) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg shadow-lg p-4 w-11/12 max-w-md">
        <h3 className="text-white font-semibold mb-4">Properties</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Element Type
            </label>
            <div className="bg-slate-700 px-3 py-2 rounded-lg text-white capitalize">
              {selectedElement.type}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Position ({deviceType})
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">X:</span>
                <span className="text-white ml-1">{selectedElement.position[deviceType].x}px</span>
              </div>
              <div>
                <span className="text-slate-400">Y:</span>
                <span className="text-white ml-1">{selectedElement.position[deviceType].y}px</span>
              </div>
              <div>
                <span className="text-slate-400">W:</span>
                <span className="text-white ml-1">{selectedElement.position[deviceType].width}px</span>
              </div>
              <div>
                <span className="text-slate-400">H:</span>
                <span className="text-white ml-1">{selectedElement.position[deviceType].height}px</span>
              </div>
            </div>
          </div>
          <button
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors font-semibold"
            onClick={onDelete}
          >
            Delete Element
          </button>
          <button
            className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePropertiesPanel;
