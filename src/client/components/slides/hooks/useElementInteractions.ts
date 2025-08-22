import { useState, useCallback } from 'react';
import { SlideDeck, SlideElement } from '../../../../shared/slideTypes';

const DOUBLE_CLICK_DELAY = 300;

export const useElementInteractions = (
  slideDeck: SlideDeck,
  currentSlideIndex: number,
  onSlideDeckChange: (slideDeck: SlideDeck) => void,
  propSelectedElementId?: string | null,
  onElementSelect?: (elementId: string | null) => void,
  onElementUpdate?: (elementId: string, updates: Partial<SlideElement>) => void,
  onHotspotDoubleClick?: (elementId: string) => void,
  isEditable?: boolean
) => {
  const [internalSelectedElementId, setInternalSelectedElementId] = useState<string | null>(null);
  const selectedElementId = propSelectedElementId ?? internalSelectedElementId;

  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedElementId, setLastClickedElementId] = useState<string | null>(null);

  const handleElementSelect = useCallback((elementId: string | null) => {
    if (onElementSelect) {
      onElementSelect(elementId);
    } else {
      setInternalSelectedElementId(elementId);
    }
  }, [onElementSelect]);

  const handleHotspotClick = useCallback((elementId: string, element: SlideElement) => {
    if (!isEditable || element.type !== 'hotspot') return;

    const now = Date.now();
    const timeDiff = now - lastClickTime;

    if (timeDiff < DOUBLE_CLICK_DELAY && lastClickedElementId === elementId) {
      if (onHotspotDoubleClick) {
        onHotspotDoubleClick(elementId);
      }
      setLastClickTime(0);
      setLastClickedElementId(null);
    } else {
      handleElementSelect(elementId);
      setLastClickTime(now);
      setLastClickedElementId(elementId);
    }
  }, [isEditable, lastClickTime, lastClickedElementId, onHotspotDoubleClick, handleElementSelect]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (onElementUpdate) {
      onElementUpdate(elementId, updates);
      return;
    }

    const updatedSlideDeck = {
      ...slideDeck,
      slides: slideDeck.slides.map((slide, index) => {
        if (index !== currentSlideIndex) return slide;
        return {
          ...slide,
          elements: slide.elements?.map((element) =>
            element.id === elementId ? { ...element, ...updates } : element
          ) || [],
        };
      }),
    };
    onSlideDeckChange(updatedSlideDeck);
  }, [onElementUpdate, slideDeck, currentSlideIndex, onSlideDeckChange]);

  return {
    selectedElementId,
    handleElementSelect,
    handleHotspotClick,
    handleElementUpdate,
  };
};
