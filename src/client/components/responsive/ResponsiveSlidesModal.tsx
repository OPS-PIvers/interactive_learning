/**
 * Responsive Slides Modal Component
 * 
 * Unified modal for slide management that adapts to all screen sizes.
 * Progressive enhancement from mobile-first foundation to desktop features.
 */

import React from 'react';
import { InteractiveSlide } from '../../../shared/slideTypes';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { ResponsiveModal } from './ResponsiveModal';

interface ResponsiveSlidesModalProps {
  slides: InteractiveSlide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideAdd: () => void;
  onSlideDelete: (index: number) => void;
  onSlideDuplicate: (index: number) => void;
  onClose: () => void;
}

/**
 * ResponsiveSlidesModal - Unified modal for slide management
 */
export const ResponsiveSlidesModal: React.FC<ResponsiveSlidesModalProps> = ({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onSlideAdd,
  onSlideDelete,
  onSlideDuplicate,
  onClose
}) => {
  const handleSlideSelect = (index: number) => {
    onSlideSelect(index);
    onClose();
  };

  const handleSlideDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return; // Don't delete last slide
    
    if (window.confirm('Delete this slide?')) {
      onSlideDelete(index);
      // Don't close modal so user can see updated list
    }
  };

  const handleSlideDuplicate = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onSlideDuplicate(index);
    // Don't close modal so user can see new slide
  };

  return (
    <ResponsiveModal
      type="slides"
      isOpen={true}
      onClose={onClose}
      title="Slides"
    >
      <div className="p-4 sm:p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Slides
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add slide button */}
        <button
          onClick={() => {
            onSlideAdd();
            onClose();
          }}
          className="w-full mb-4 sm:mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          Add New Slide
        </button>

        {/* Slides list */}
        <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
                index === currentSlideIndex
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => handleSlideSelect(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {index + 1}.
                    </span>
                    <span className="font-medium truncate text-sm sm:text-base">
                      {slide.title || `Slide ${index + 1}`}
                    </span>
                    {index === currentSlideIndex && (
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {slide.elements?.length || 0} element{(slide.elements?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 ml-3">
                  {/* Duplicate button */}
                  <button
                    onClick={(e) => handleSlideDuplicate(index, e)}
                    className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Duplicate slide"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* Delete button */}
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => handleSlideDelete(index, e)}
                      className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete slide"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slide count info */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
          {slides.length} slide{slides.length !== 1 ? 's' : ''} total
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ResponsiveSlidesModal;