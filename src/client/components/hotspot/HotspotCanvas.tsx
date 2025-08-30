import React, { useRef, useState, useCallback } from 'react';
import { HotspotWalkthrough, WalkthroughHotspot } from '../../../shared/hotspotTypes';
import { createDefaultHotspot, validateHotspotPosition, createResponsivePosition } from '../../utils/hotspotUtils';
import HotspotElement from './HotspotElement';
import { EffectExecutor } from '../../utils/EffectExecutor';

interface HotspotCanvasProps {
  walkthrough: HotspotWalkthrough;
  effectExecutor: EffectExecutor;
  isEditorMode: boolean;
  onHotspotAdd?: (hotspot: WalkthroughHotspot) => void;
  onHotspotUpdate?: (hotspot: WalkthroughHotspot) => void;
  onHotspotSelect?: (hotspot: WalkthroughHotspot) => void;
  currentStep?: number;
}

export default function HotspotCanvas({
  walkthrough,
  effectExecutor,
  isEditorMode,
  onHotspotAdd,
  onHotspotUpdate,
  onHotspotSelect,
  currentStep = 0
}: HotspotCanvasProps) {
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!isEditorMode || !onHotspotAdd) return;
    
    // Don't create hotspot if clicking on an existing hotspot
    if ((e.target as HTMLElement).closest('[role="button"]')) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create responsive position
    const position = createResponsivePosition(x, y, 'medium');
    
    // Validate position
    if (!validateHotspotPosition(position, canvas.offsetWidth, canvas.offsetHeight)) {
      return;
    }
    
    // Create new hotspot
    const newHotspot = createDefaultHotspot(position, walkthrough.hotspots.length);
    onHotspotAdd(newHotspot);
  }, [isEditorMode, onHotspotAdd, walkthrough.hotspots.length]);
  
  const handleHotspotClick = useCallback((hotspot: WalkthroughHotspot) => {
    if (isEditorMode) {
      setSelectedHotspot(hotspot.id);
      onHotspotSelect?.(hotspot);
    } else {
      // In viewer mode, this handles step progression
      onHotspotSelect?.(hotspot);
    }
  }, [isEditorMode, onHotspotSelect]);
  
  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-gray-100 min-h-96 border border-gray-200 rounded-lg"
      onClick={handleCanvasClick}
      role={isEditorMode ? "button" : undefined}
      aria-label={isEditorMode ? "Click to add hotspot" : undefined}
    >
      {/* Background image */}
      {walkthrough.backgroundMedia?.url && (
        <img
          src={walkthrough.backgroundMedia.url}
          alt="Walkthrough background"
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      )}
      
      {/* Background placeholder when no image */}
      {!walkthrough.backgroundMedia?.url && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm">Add a background image to get started</p>
          </div>
        </div>
      )}
      
      {/* Hotspots */}
      {walkthrough.hotspots.map((hotspot) => {
        const isActive = isEditorMode || currentStep === hotspot.sequenceIndex;
        const isCompleted = !isEditorMode && currentStep > hotspot.sequenceIndex;
        
        return (
          <HotspotElement
            key={hotspot.id}
            hotspot={hotspot}
            effectExecutor={effectExecutor}
            isActive={isActive}
            isCompleted={isCompleted}
            onClick={handleHotspotClick}
            {...(onHotspotSelect && { onEdit: onHotspotSelect })}
            isEditorMode={isEditorMode}
          />
        );
      })}
      
      {/* Editor mode instructions */}
      {isEditorMode && walkthrough.hotspots.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center max-w-sm">
            <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white text-xl">+</span>
            </div>
            <h3 className="text-blue-800 font-semibold mb-2">Add Your First Hotspot</h3>
            <p className="text-blue-600 text-sm">Click anywhere to place a hotspot and start building your walkthrough</p>
          </div>
        </div>
      )}
      
      {/* Active step indicator for viewer mode */}
      {!isEditorMode && walkthrough.hotspots.length > 0 && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-medium">
          Step {currentStep + 1} of {walkthrough.hotspots.length}
        </div>
      )}
    </div>
  );
}