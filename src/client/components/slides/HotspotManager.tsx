import React, { useState } from 'react';
import { SlideElement } from '../../../shared/slideTypes';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';

interface RelativePosition {
  x: number; // 0-1 (percentage of canvas width)
  y: number; // 0-1 (percentage of canvas height)
  width: number; // 0-1 (percentage of canvas width)
  height: number; // 0-1 (percentage of canvas height)
}

interface Hotspot {
  id: string;
  relativePosition: RelativePosition;
  element: SlideElement;
}

interface HotspotManagerProps {
  hotspots: Hotspot[];
  selectedHotspotId: string | undefined;
  onHotspotAdd: (relativePosition: RelativePosition) => void;
  onHotspotSelect: (hotspotId: string) => void;
  onHotspotDelete: (hotspotId: string) => void;
  onHotspotDuplicate: (hotspotId: string) => void;
  className?: string;
}

/**
 * HotspotManager - Manage hotspots on a slide
 * 
 * Features:
 * - Add new hotspots
 * - List all hotspots
 * - Select/delete/duplicate hotspots
 * - Hotspot visibility toggle
 */
export const HotspotManager: React.FC<HotspotManagerProps> = ({
  hotspots,
  selectedHotspotId,
  onHotspotAdd,
  onHotspotSelect,
  onHotspotDelete,
  onHotspotDuplicate,
  className = ''
}) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{hotspotId: string, title: string} | null>(null);

  // Handle add hotspot button
  const handleAddHotspot = () => {
    setIsAddMode(true);
    // Add hotspot at center of canvas
    onHotspotAdd({
      x: 0.5,
      y: 0.5,
      width: 0.05,
      height: 0.05
    });
    setIsAddMode(false);
  };

  // Handle hotspot selection
  const handleHotspotClick = (hotspotId: string) => {
    onHotspotSelect(hotspotId);
  };

  // Handle hotspot deletion with confirmation
  const handleDelete = (hotspotId: string, hotspotTitle: string) => {
    setDeleteConfirmation({ hotspotId, title: hotspotTitle });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onHotspotDelete(deleteConfirmation.hotspotId);
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className={`hotspot-manager ${className || ''}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Hotspots</h3>
          <div className="text-sm text-gray-500">
            {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Add hotspot button */}
        <button
          onClick={handleAddHotspot}
          disabled={isAddMode}
          className="w-full mb-4 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <span className="text-lg">+</span>
          {isAddMode ? 'Adding Hotspot...' : 'Add Hotspot'}
        </button>

        {/* Hotspots list */}
        <div className="space-y-2">
          {hotspots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-sm">No hotspots yet</div>
              <div className="text-xs">Click "Add Hotspot" to get started</div>
            </div>
          ) : (
            hotspots.map((hotspot) => {
              const isSelected = selectedHotspotId === hotspot.id;
              const title = hotspot.element?.content?.title || `Hotspot ${hotspot.id.slice(-4)}`;
              const hasInteractions = (hotspot.element?.interactions?.length || 0) > 0;
              
              return (
                <div
                  key={hotspot.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleHotspotClick(hotspot.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Hotspot color indicator */}
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                          backgroundColor: hotspot.element.style?.backgroundColor || '#3b82f6',
                          borderColor: hotspot.element.style?.borderColor || '#1e40af',
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${
                          isSelected ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {title}
                        </div>
                        <div className="text-xs text-gray-500">
                          Position: {Math.round(hotspot.relativePosition.x * 100)}%, {Math.round(hotspot.relativePosition.y * 100)}%
                          {hasInteractions && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                              {hotspot.element.interactions?.length} interaction{(hotspot.element.interactions?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onHotspotDuplicate(hotspot.id);
                        }}
                        className="p-2 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Duplicate hotspot"
                        aria-label="Duplicate hotspot"
                      >
                        📄
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(hotspot.id, title);
                        }}
                        className="p-2 hover:bg-red-100 rounded text-gray-500 hover:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Delete hotspot"
                        aria-label="Delete hotspot"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Description if available */}
                  {hotspot.element.content?.description && (
                    <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {hotspot.element.content.description}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick stats */}
        {hotspots.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                Interactive: {hotspots.filter(h => (h.element && h.element.interactions?.length || 0) > 0).length} of {hotspots.length}
              </div>
              <div>
                Total interactions: {hotspots.reduce((sum, h) => sum + (h.element && h.element.interactions?.length || 0), 0)}
              </div>
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600">
            <strong>💡 Tips:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Click canvas to add hotspots at specific positions</li>
              <li>Drag hotspots to reposition them</li>
              <li>Click hotspots to edit their interactions</li>
              <li>Hotspots maintain relative position across devices</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${Z_INDEX_TAILWIND.MODAL_BACKDROP}`}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Hotspot</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete "{deleteConfirmation.title}"? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors min-h-[44px] font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotManager;