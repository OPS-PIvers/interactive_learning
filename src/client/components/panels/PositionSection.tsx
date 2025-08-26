import React, { useState } from 'react';
import { SlideElement, ResponsivePosition } from '../../../shared/slideTypes';

const FORM_STYLES = {
  input: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  select: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white",
  label: "block text-sm font-medium mb-1 text-gray-400",
} as const;

interface PositionSectionProps {
  element: SlideElement;
  onUpdate: (updates: Partial<SlideElement>) => void;
}

const PositionSection: React.FC<PositionSectionProps> = ({
  element,
  onUpdate
}) => {
  const [activeBreakpoint, setActiveBreakpoint] = useState<keyof ResponsivePosition>('desktop');

  const handlePositionUpdate = (breakpoint: keyof ResponsivePosition, positionUpdates: Partial<ResponsivePosition[keyof ResponsivePosition]>) => {
    const currentPosition = element.position[breakpoint];
    
    onUpdate({
      position: {
        ...element.position,
        [breakpoint]: {
          ...currentPosition,
          ...positionUpdates
        }
      }
    });
  };

  const currentPosition = element.position[activeBreakpoint];

  return (
    <div className="properties-section">
      <div className="properties-section__header">
        <h4 className="text-md font-semibold text-gray-300 mb-4">Position & Size</h4>
      </div>
      
      <div className="space-y-4">
        {/* Breakpoint Selector */}
        <div>
          <label className={FORM_STYLES.label}>Device Breakpoint</label>
          <select
            value={activeBreakpoint}
            onChange={(e) => setActiveBreakpoint(e.target.value as keyof ResponsivePosition)}
            className={FORM_STYLES.select}
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        {/* Position Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={FORM_STYLES.label}>X Position</label>
            <input
              type="number"
              value={currentPosition?.x || 0}
              onChange={(e) => handlePositionUpdate(activeBreakpoint, { x: Number(e.target.value) })}
              className={FORM_STYLES.input}
              min="0"
              step="1"
            />
          </div>
          
          <div>
            <label className={FORM_STYLES.label}>Y Position</label>
            <input
              type="number"
              value={currentPosition?.y || 0}
              onChange={(e) => handlePositionUpdate(activeBreakpoint, { y: Number(e.target.value) })}
              className={FORM_STYLES.input}
              min="0"
              step="1"
            />
          </div>
        </div>

        {/* Size Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={FORM_STYLES.label}>Width</label>
            <input
              type="number"
              value={currentPosition?.width || 40}
              onChange={(e) => handlePositionUpdate(activeBreakpoint, { width: Number(e.target.value) })}
              className={FORM_STYLES.input}
              min="1"
              step="1"
            />
          </div>
          
          <div>
            <label className={FORM_STYLES.label}>Height</label>
            <input
              type="number"
              value={currentPosition?.height || 40}
              onChange={(e) => handlePositionUpdate(activeBreakpoint, { height: Number(e.target.value) })}
              className={FORM_STYLES.input}
              min="1"
              step="1"
            />
          </div>
        </div>

        {/* Position Summary */}
        <div className="bg-gray-700 p-3 rounded text-sm">
          <div className="text-gray-400 mb-2">Current Position ({activeBreakpoint}):</div>
          <div className="text-gray-300 space-y-1">
            <div>X: {currentPosition?.x || 0}px, Y: {currentPosition?.y || 0}px</div>
            <div>Size: {currentPosition?.width || 40}px × {currentPosition?.height || 40}px</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-400">Quick Actions:</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePositionUpdate(activeBreakpoint, { x: 50, y: 50 })}
              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            >
              Top Left
            </button>
            <button
              onClick={() => {
                const centerX = activeBreakpoint === 'mobile' ? 187 : activeBreakpoint === 'tablet' ? 300 : 400;
                const centerY = activeBreakpoint === 'mobile' ? 333 : activeBreakpoint === 'tablet' ? 225 : 300;
                handlePositionUpdate(activeBreakpoint, { x: centerX, y: centerY });
              }}
              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            >
              Center
            </button>
            <button
              onClick={() => {
                const maxX = activeBreakpoint === 'mobile' ? 325 : activeBreakpoint === 'tablet' ? 550 : 750;
                const maxY = activeBreakpoint === 'mobile' ? 617 : activeBreakpoint === 'tablet' ? 400 : 550;
                handlePositionUpdate(activeBreakpoint, { x: maxX, y: maxY });
              }}
              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            >
              Bottom Right
            </button>
          </div>
        </div>

        {/* Copy Position Between Breakpoints */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-400">Copy to Other Breakpoints:</div>
          <div className="flex flex-wrap gap-2">
            {(['desktop', 'tablet', 'mobile'] as const).filter(bp => bp !== activeBreakpoint).map(targetBreakpoint => (
              <button
                key={targetBreakpoint}
                onClick={() => {
                  handlePositionUpdate(targetBreakpoint, {
                    x: currentPosition?.x || 0,
                    y: currentPosition?.y || 0,
                    width: currentPosition?.width || 40,
                    height: currentPosition?.height || 40,
                  });
                }}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors capitalize"
              >
                Copy to {targetBreakpoint}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionSection;