import { useCallback, useRef } from 'react';

/**
 * Hook for making screen reader announcements
 * Creates a live region for announcing dynamic content changes
 */
export const useScreenReaderAnnouncements = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  /**
   * Create or get the live region element
   */
  const getLiveRegion = useCallback(() => {
    if (!liveRegionRef.current) {
      // Check if live region already exists in the document
      const existing = document.getElementById('screen-reader-announcements');
      if (existing) {
        liveRegionRef.current = existing as HTMLDivElement;
        return liveRegionRef.current;
      }

      // Create new live region
      const liveRegion = document.createElement('div');
      liveRegion.id = 'screen-reader-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }
    
    return liveRegionRef.current;
  }, []);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = getLiveRegion();
    
    // Update aria-live attribute if priority changed
    if (liveRegion.getAttribute('aria-live') !== priority) {
      liveRegion.setAttribute('aria-live', priority);
    }
    
    // Clear and set new message
    liveRegion.textContent = '';
    
    // Use a small delay to ensure screen readers pick up the change
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
    
    console.log(`[ScreenReader] Announced (${priority}): ${message}`);
  }, [getLiveRegion]);

  /**
   * Announce drag state changes
   */
  const announceDragState = useCallback((hotspotTitle: string, isDragging: boolean) => {
    if (isDragging) {
      announce(`Started dragging ${hotspotTitle}`, 'assertive');
    } else {
      announce(`Stopped dragging ${hotspotTitle}`, 'polite');
    }
  }, [announce]);

  /**
   * Announce position changes during drag
   */
  const announceDragPosition = useCallback((hotspotTitle: string, x: number, y: number) => {
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    announce(`${hotspotTitle} moved to position ${roundedX}%, ${roundedY}%`, 'polite');
  }, [announce]);

  /**
   * Announce hotspot focus
   */
  const announceFocus = useCallback((hotspotTitle: string) => {
    announce(`Focused on ${hotspotTitle}`, 'polite');
  }, [announce]);

  /**
   * Announce editing mode changes
   */
  const announceEditMode = useCallback((hotspotTitle: string, isEditing: boolean) => {
    if (isEditing) {
      announce(`Entered edit mode for ${hotspotTitle}`, 'assertive');
    } else {
      announce(`Exited edit mode for ${hotspotTitle}`, 'polite');
    }
  }, [announce]);

  return {
    announce,
    announceDragState,
    announceDragPosition,
    announceFocus,
    announceEditMode,
  };
};