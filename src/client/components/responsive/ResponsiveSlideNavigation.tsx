/**
 * Responsive Slide Navigation Component
 * 
 * Unified slide navigation panel that adapts between desktop sidebar
 * and mobile modal presentations. Provides slide management functionality
 * across all device types.
 */

import React, { useState, useCallback } from 'react';
import { InteractiveSlide } from '../../../shared/slideTypes';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import { PlusIcon } from '../icons/PlusIcon';

export interface ResponsiveSlideNavigationProps {
  slides: InteractiveSlide[];
  currentSlideIndex: number;
  isCollapsed: boolean;
  isVisible: boolean;
  onSlideSelect: (index: number) => void;
  onSlideAdd: (insertAfterIndex?: number) => void;
  onSlideDuplicate: (slideIndex: number) => void;
  onSlideDelete: (slideIndex: number) => void;
  onToggleCollapse: () => void;
  activeDropdownId: string | null;
  onDropdownToggle: (slideId: string | null) => void;
}

/**
 * ResponsiveSlideNavigation - Adaptive slide navigation panel
 */
export const ResponsiveSlideNavigation: React.FC<ResponsiveSlideNavigationProps> = ({
  slides,
  currentSlideIndex,
  isCollapsed,
  isVisible,
  onSlideSelect,
  onSlideAdd,
  onSlideDuplicate,
  onSlideDelete,
  onToggleCollapse,
  activeDropdownId,
  onDropdownToggle,
}) => {  
  // Handle dropdown toggle
  const handleDropdownToggle = useCallback((slideId: string) => {
    onDropdownToggle(activeDropdownId === slideId ? null : slideId);
  }, [activeDropdownId, onDropdownToggle]);
  
  if (!isVisible) return null;
  
  return (
    <div className={`${isCollapsed ? 'w-12' : 'w-64'} bg-slate-800/50 border-r border-slate-700 flex flex-col transition-all duration-300 relative`}>
      {/* Header with collapse toggle */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className={`text-white font-semibold transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
          Slides
        </h2>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <ChevronDownIcon 
            className={`w-4 h-4 transition-transform duration-300 ${
              isCollapsed ? 'rotate-90' : '-rotate-90'
            }`} 
          />
        </button>
      </div>
      
      {/* Add slide button */}
      {!isCollapsed && (
        <div className="p-3 border-b border-slate-700">
          <button
            onClick={() => onSlideAdd()}
            className="w-full flex items-center gap-2 p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>
      )}
      
      {/* Slides list */}
      <div className="flex-1 overflow-y-auto slide-list">
        {slides.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const isDropdownOpen = activeDropdownId === slide.id;
          
          return (
            <div key={slide.id} className="relative">
              {/* Slide item */}
              <div
                className={`
                  ${isCollapsed ? 'p-2' : 'p-3'} 
                  border-b border-slate-700/50 cursor-pointer transition-colors
                  ${isActive ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-700/30'}
                `}
                onClick={() => onSlideSelect(index)}
              >
                <div className="flex items-center justify-between">
                  {/* Slide preview/info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Slide thumbnail/number */}
                    <div className={`
                      ${isCollapsed ? 'w-6 h-6' : 'w-12 h-8'} 
                      bg-slate-700 rounded flex items-center justify-center text-xs font-medium text-slate-300 flex-shrink-0
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Slide info */}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">
                          Slide {index + 1}
                        </div>
                        <div className="text-xs text-slate-400">
                          {slide.elements?.length || 0} elements
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Three-dot menu */}
                  {!isCollapsed && (
                    <button
                      className="text-slate-400 hover:text-white p-1 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropdownToggle(slide.id);
                      }}
                      title="Slide options"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Dropdown menu */}
              {isDropdownOpen && !isCollapsed && (
                <div className="absolute right-3 top-full mt-1 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlideAdd(index);
                        onDropdownToggle(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                    >
                      Insert Slide After
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlideDuplicate(index);
                        onDropdownToggle(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                    >
                      Duplicate Slide
                    </button>
                    {slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlideDelete(index);
                          onDropdownToggle(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-600 transition-colors"
                      >
                        Delete Slide
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Footer info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-700 text-xs text-slate-400">
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default ResponsiveSlideNavigation;