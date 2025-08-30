import React, { useCallback } from 'react';
import { WalkthroughHotspot } from '../../../shared/hotspotTypes';
import { executeHotspotEffect } from '../../utils/hotspotUtils';
import { EffectExecutor } from '../../utils/EffectExecutor';

interface HotspotElementProps {
  hotspot: WalkthroughHotspot;
  effectExecutor: EffectExecutor;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: (hotspot: WalkthroughHotspot) => void;
  onEdit?: (hotspot: WalkthroughHotspot) => void;
  isEditorMode?: boolean;
}

export default function HotspotElement({
  hotspot,
  effectExecutor,
  isActive,
  isCompleted,
  onClick,
  onEdit,
  isEditorMode = false
}: HotspotElementProps) {
  
  const handleClick = useCallback(async () => {
    if (isEditorMode && onEdit) {
      onEdit(hotspot);
      return;
    }
    
    if (!isActive && !isEditorMode) return;
    
    try {
      await executeHotspotEffect(hotspot, effectExecutor);
      onClick?.(hotspot);
    } catch (error) {
      console.error('Failed to execute hotspot effect:', error);
    }
  }, [hotspot, effectExecutor, isActive, onClick, onEdit, isEditorMode]);

  const position = hotspot.position.desktop;
  const style = hotspot.style;
  
  // OPS styling classes
  const baseClasses = "absolute rounded-full border-2 cursor-pointer transition-all duration-300 flex items-center justify-center font-bold text-white";
  const sizeClasses = {
    small: "w-8 h-8 text-xs",
    medium: "w-12 h-12 text-sm", 
    large: "w-16 h-16 text-base"
  };
  
  const getStateStyles = () => {
    if (isCompleted) {
      return {
        classes: "bg-green-500 border-green-600 shadow-lg",
        backgroundColor: '#2e8540' // OPS Success Green
      };
    }
    
    if (isActive) {
      const pulseClass = style.pulseAnimation ? 'animate-pulse' : '';
      return {
        classes: `border-blue-600 shadow-lg ${pulseClass}`,
        backgroundColor: style.color
      };
    }
    
    if (isEditorMode) {
      return {
        classes: "border-gray-400 hover:border-blue-500 shadow-md",
        backgroundColor: style.color
      };
    }
    
    return {
      classes: "bg-gray-300 border-gray-400 opacity-50",
      backgroundColor: '#6b7280'
    };
  };

  const stateStyles = getStateStyles();

  return (
    <div
      className={`${baseClasses} ${sizeClasses[style.size]} ${stateStyles.classes}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: stateStyles.backgroundColor,
        borderColor: isCompleted ? '#16a34a' : style.color,
        zIndex: 20 // Z_INDEX.HOTSPOTS
      }}
      onClick={handleClick}
      title={hotspot.content.title}
      role="button"
      tabIndex={0}
      aria-label={`Hotspot: ${hotspot.content.title}`}
      onKeyPress={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Sequence number indicator */}
      <span>
        {isCompleted ? '✓' : hotspot.sequenceIndex + 1}
      </span>
      
      {/* Active indicator ring for current step */}
      {isActive && !isCompleted && !isEditorMode && (
        <div
          className="absolute inset-0 rounded-full border-2 border-white animate-ping"
          style={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
        />
      )}
    </div>
  );
}