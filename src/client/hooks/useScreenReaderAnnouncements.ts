import { useState, useCallback, useEffect, useRef } from 'react';

// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}

let liveRegionContainer: HTMLDivElement | null = null;
let currentPoliteMessage = "";
let currentAssertiveMessage = "";

const ensureLiveRegionContainer = () => {
  if (!document.getElementById('screen-reader-announcements-container')) {
    liveRegionContainer = document.createElement('div');
    liveRegionContainer.id = 'screen-reader-announcements-container';
    // Optional: Some styling to hide it visually but keep it accessible
    liveRegionContainer.style.position = 'absolute';
    liveRegionContainer.style.width = '1px';
    liveRegionContainer.style.height = '1px';
    liveRegionContainer.style.margin = '-1px';
    liveRegionContainer.style.padding = '0';
    liveRegionContainer.style.overflow = 'hidden';
    liveRegionContainer.style.clip = 'rect(0, 0, 0, 0)';
    liveRegionContainer.style.border = '0';
    document.body.appendChild(liveRegionContainer);
  } else {
    liveRegionContainer = document.getElementById('screen-reader-announcements-container') as HTMLDivElement;
  }
  return liveRegionContainer;
};

const useScreenReaderAnnouncements = () => {
  const [, setPoliteUpdate] = useState(0);
  const [, setAssertiveUpdate] = useState(0);

  const announcePolitelyRef = useRef<(message: string) => void>();
  const announceAssertivelyRef = useRef<(message: string) => void>();

  useEffect(() => {
    ensureLiveRegionContainer();

    // Create a "polite" live region
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('role', 'status');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    liveRegionContainer?.appendChild(politeRegion);

    // Create an "assertive" live region
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('role', 'alert');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    liveRegionContainer?.appendChild(assertiveRegion);

    const updatePoliteRegion = (message: string) => {
        if (politeRegion.textContent === message) {
            politeRegion.textContent = '';
            setTimeout(() => { politeRegion.textContent = message; }, 50);
        } else {
            politeRegion.textContent = message;
        }
        currentPoliteMessage = message;
        setPoliteUpdate(c => c + 1);
    };

    const updateAssertiveRegion = (message: string) => {
        if (assertiveRegion.textContent === message) {
            assertiveRegion.textContent = '';
            setTimeout(() => { assertiveRegion.textContent = message; }, 50);
        } else {
            assertiveRegion.textContent = message;
        }
        currentAssertiveMessage = message;
        setAssertiveUpdate(c => c + 1);
    };

    announcePolitelyRef.current = debounce((message: string) => {
        console.log(`Announcing politely: ${message}`);
        updatePoliteRegion(message);
    }, 200);

    announceAssertivelyRef.current = (message: string) => {
        console.log(`Announcing assertively: ${message}`);
        updateAssertiveRegion(message);
    };

    return () => {
      // Cleanup handled by shared container pattern
    };
  }, []);

  const announce = useCallback((message: string, assertiveness: 'polite' | 'assertive' = 'polite') => {
    if (assertiveness === 'polite' && announcePolitelyRef.current) {
      announcePolitelyRef.current(message);
    } else if (assertiveness === 'assertive' && announceAssertivelyRef.current) {
      announceAssertivelyRef.current(message);
    }
  }, []);

  // Functions for specific announcements
  const announceDragStart = useCallback(() => {
    announce('Drag started.', 'polite');
  }, [announce]);

  const announceDragStop = useCallback((targetDescription?: string) => {
    announce(targetDescription ? `Drag stopped. Dropped on ${targetDescription}.` : 'Drag stopped.', 'polite');
  }, [announce]);

  const announceFocusChange = useCallback((focusedElementLabel: string) => {
    announce(`${focusedElementLabel} focused.`, 'polite');
  }, [announce]);

  const announceModeChange = useCallback((modeName: string) => {
    announce(`Switched to ${modeName} mode.`, 'polite');
  }, [announce]);

  return {
    announce,
    announceDragStart,
    announceDragStop,
    announceFocusChange,
    announceModeChange,
  };
};

export default useScreenReaderAnnouncements;
