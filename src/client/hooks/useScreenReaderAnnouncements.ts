import { useEffect, useCallback, useRef } from 'react';

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  height: '1px',
  width: '1px',
  margin: '-1px',
  padding: '0',
  border: '0',
};

let liveRegionContainer: HTMLDivElement | null = null;

function getLiveRegionContainer(): HTMLDivElement {
  if (!liveRegionContainer) {
    liveRegionContainer = document.createElement('div');
    liveRegionContainer.id = 'screen-reader-announcements-container';
    document.body.appendChild(liveRegionContainer);
  }
  return liveRegionContainer;
}

interface ScreenReaderAnnouncer {
  (message: string, politeness?: 'polite' | 'assertive'): void;
}

/**
 * Custom hook to provide screen reader announcements.
 * Creates and manages a visually hidden ARIA live region.
 *
 * @returns A function to make announcements.
 */
function useScreenReaderAnnouncements(): ScreenReaderAnnouncer {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = getLiveRegionContainer();
    const announcerDiv = document.createElement('div');
    announcerDiv.id = `sr-announcer-${Math.random().toString(36).substr(2, 9)}`;
    Object.assign(announcerDiv.style, visuallyHiddenStyle);
    // Default to assertive, can be changed by the announce function
    announcerDiv.setAttribute('aria-live', 'assertive');
    announcerDiv.setAttribute('aria-atomic', 'true');
    container.appendChild(announcerDiv);
    announcerRef.current = announcerDiv;

    return () => {
      if (announcerDiv) {
        container.removeChild(announcerDiv);
      }
      // If this is the last announcer, remove the container
      if (container.childElementCount === 0) {
        document.body.removeChild(container);
        liveRegionContainer = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'assertive') => {
    if (announcerRef.current) {
      // Update politeness if specified
      if (announcerRef.current.getAttribute('aria-live') !== politeness) {
        announcerRef.current.setAttribute('aria-live', politeness);
      }
      // Set text content to trigger announcement
      // Using textContent is generally safer and more performant for text-only updates.
      announcerRef.current.textContent = message;

      // Optional: Clear after a short delay if messages might be similar and not re-announced.
      // However, modern screen readers are usually good about re-announcing the same message
      // if the content of an assertive live region is set again.
      // setTimeout(() => {
      //   if(announcerRef.current) {
      //     announcerRef.current.textContent = '';
      //   }
      // }, 100); // Adjust delay as needed
    }
  }, []);

  return announce;
}

export default useScreenReaderAnnouncements;
