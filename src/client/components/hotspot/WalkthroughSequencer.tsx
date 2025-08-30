import React, { useState } from 'react';
import { HotspotWalkthrough, WalkthroughHotspot } from '../../../shared/hotspotTypes';

interface WalkthroughSequencerProps {
  walkthrough: HotspotWalkthrough;
  selectedHotspot: WalkthroughHotspot | null;
  onSequenceChange: (newSequence: string[]) => void;
  onHotspotSelect: (hotspot: WalkthroughHotspot) => void;
}

export default function WalkthroughSequencer({
  walkthrough,
  selectedHotspot,
  onSequenceChange,
  onHotspotSelect
}: WalkthroughSequencerProps) {
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const orderedHotspots = walkthrough.sequence
    .map(id => walkthrough.hotspots.find(h => h.id === id))
    .filter(Boolean) as WalkthroughHotspot[];
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    
    const newSequence = [...walkthrough.sequence];
    const draggedId = newSequence[draggedIndex];
    
    if (!draggedId) return;
    
    // Remove dragged item
    newSequence.splice(draggedIndex, 1);
    
    // Insert at new position
    newSequence.splice(dropIndex, 0, draggedId);
    
    onSequenceChange(newSequence);
    setDraggedIndex(null);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  
  return (
    <div className="p-6 h-full overflow-y-auto bg-white border-r border-gray-200">
      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Step Sequence
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Drag to reorder steps
          </p>
        </div>
        
        <div className="space-y-2">
          {orderedHotspots.map((hotspot, index) => {
            const isSelected = selectedHotspot?.id === hotspot.id;
            const isDragging = draggedIndex === index;
            
            return (
              <div
                key={hotspot.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onHotspotSelect(hotspot)}
                className={`p-3 rounded-lg border cursor-pointer transition-all select-none ${
                  isSelected
                    ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-20'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                } ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  {/* Drag Handle */}
                  <div className="flex flex-col space-y-1 text-gray-400 cursor-grab active:cursor-grabbing">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                  </div>
                  
                  {/* Step Number */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: hotspot.style.color }}
                  >
                    {index + 1}
                  </div>
                  
                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {hotspot.content.title || `Step ${index + 1}`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {hotspot.interaction.effect.type}
                      </span>
                      {hotspot.style.pulseAnimation && (
                        <span className="text-xs text-blue-500">
                          ⚡ Animated
                        </span>
                      )}
                    </div>
                    {hotspot.content.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {hotspot.content.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {orderedHotspots.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm">No hotspots yet</p>
              <p className="text-xs text-gray-400 mt-1">Add hotspots on the canvas to see them here</p>
            </div>
          )}
        </div>
        
        {/* Summary */}
        {orderedHotspots.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p><strong>{orderedHotspots.length}</strong> steps total</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.from(new Set(orderedHotspots.map(h => h.interaction.effect.type))).map(type => (
                  <span key={type} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}