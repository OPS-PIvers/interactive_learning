import React from 'react';

interface PendingHotspotInfo {
  viewXPercent: number;
  viewYPercent: number;
  imageXPercent: number;
  imageYPercent: number;
}

interface PendingHotspotConfirmationProps {
  pendingHotspot: PendingHotspotInfo;
  onConfirm: (imageXPercent: number, imageYPercent: number) => void;
  onCancel: () => void;
  // zIndex can be passed if needed, defaults are usually fine for modals/overlays
}

const PendingHotspotConfirmation: React.FC<PendingHotspotConfirmationProps> = ({
  pendingHotspot,
  onConfirm,
  onCancel,
}) => {
  if (!pendingHotspot) return null;

  return (
    // This was originally positioned absolute top-4 right-4 with Z_INDEX.MODAL
    // The positioning might be better handled by the parent that uses this component.
    // For now, let's keep it simple and assume parent handles positioning.
    // Or, provide basic absolute positioning that can be overridden.
    <div className="absolute top-4 right-4 z-50"> {/* Default positioning, can be overridden by parent if needed */}
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-600">
        <h4 className="text-md font-semibold mb-2 text-slate-200">Confirm New Hotspot</h4>
        <p className="text-sm text-slate-300 mb-3">
          Position: {pendingHotspot.imageXPercent.toFixed(1)}%, {pendingHotspot.imageYPercent.toFixed(1)}%
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(pendingHotspot.imageXPercent, pendingHotspot.imageYPercent)}
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded"
          >
            Add Hotspot
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingHotspotConfirmation;
