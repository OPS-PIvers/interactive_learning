/**
 * Slide Editor Actions Hook
 * 
 * Extracted from UnifiedSlideEditor to improve maintainability and testability.
 * Contains all action handlers for slide editing operations.
 */

import { useCallback } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement } from '../../shared/slideTypes';

interface UseSlideEditorActionsProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
}

export const useSlideEditorActions = ({
  slideDeck,
  currentSlideIndex,
  onSlideDeckChange
}: UseSlideEditorActionsProps) => {
  
  // Handle element updates - Optimized to minimize object recreation
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!slideDeck) return;
    
    const slides = slideDeck.slides.map((slide: InteractiveSlide, index: number) => {
      if (index !== currentSlideIndex) return slide;
      
      const elements = slide.elements?.map((element: SlideElement) => 
        element.id === elementId ? { ...element, ...updates } : element
      ) || [];
      
      return { ...slide, elements };
    });
    
    const updatedSlideDeck = { ...slideDeck, slides };
    onSlideDeckChange(updatedSlideDeck);
  }, [slideDeck, currentSlideIndex, onSlideDeckChange]);

  // Handle slide updates - Optimized to minimize dependency array
  const handleSlideUpdate = useCallback((slideUpdates: Partial<InteractiveSlide>, propertiesToRemove: (keyof InteractiveSlide)[] = []) => {
    if (!slideDeck) return;
    
    const slides = slideDeck.slides.map((slide: InteractiveSlide, index: number) => {
      if (index !== currentSlideIndex) return slide;

      const updatedSlide = { ...slide, ...slideUpdates };
      for (const prop of propertiesToRemove) {
        delete (updatedSlide as any)[prop];
      }
      return updatedSlide;
    });
    
    const updatedSlideDeck = { ...slideDeck, slides };
    onSlideDeckChange(updatedSlideDeck);
  }, [slideDeck, currentSlideIndex, onSlideDeckChange]);

  // Handle slide deck updates - Direct functional update
  const handleSlideDeckUpdate = useCallback((updatedSlideDeck: SlideDeck) => {
    onSlideDeckChange(updatedSlideDeck);
  }, [onSlideDeckChange]);

  return {
    handleElementUpdate,
    handleSlideUpdate,
    handleSlideDeckUpdate
  };
};