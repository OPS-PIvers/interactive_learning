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

// The ScreenReaderAnnouncer component and associated message array logic were not used
// by the final hook implementation and have been removed to avoid confusion.

let liveRegionContainer: HTMLDivElement | null = null;

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

// Unused variables related to a previous approach have been removed.
// let currentPoliteMessage = "";
// let currentAssertiveMessage = "";

const useScreenReaderAnnouncements = () => {
  // State updates are kept to ensure React re-renders the hook's context if necessary,
  // though direct DOM manipulation is primary here.
  const [, setPoliteUpdate] = useState(0); // Kept for potential future use or strict React patterns
  const [, setAssertiveUpdate] = useState(0); // Kept for potential future use or strict React patterns

  const announcePolitelyRef = useRef<(message: string) => void>();
  const announceAssertivelyRef = useRef<(message: string) => void>();


  useEffect(() => {
    // Ensure the container exists when the hook is first used
    ensureLiveRegionContainer();

    // Create a "polite" live region
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('role', 'status');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    liveRegionContainer?.appendChild(politeRegion);

    // Create an "assertive" live region
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('role', 'alert'); // role=alert implies aria-live=assertive
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    liveRegionContainer?.appendChild(assertiveRegion);

    const updatePoliteRegion = (message: string) => {
        if (politeRegion.textContent === message) {
            // Force update for screen readers if message is identical by briefly clearing
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
    }, 200); // Debounce polite announcements

    announceAssertivelyRef.current = (message: string) => {
        console.log(`Announcing assertively: ${message}`);
        updateAssertiveRegion(message);
    }; // Assertive announcements are immediate

    return () => {
      // Cleanup: The polite and assertive regions are children of liveRegionContainer.
      // We should remove these specific regions if the hook instance is cleaned up,
      // but not the liveRegionContainer itself, as it's shared.
      // However, for simplicity and robustness against multiple hook instances,
      // we will leave these regions. They are lightweight, and removing them
      // correctly without a ref-counting system for the container is complex.
      // The liveRegionContainer itself should persist for the application's lifetime.
      // politeRegion.remove();
      // assertiveRegion.remove();

      // Ensure liveRegionContainer is not removed.
      // if (liveRegionContainer && liveRegionContainer.innerHTML === '') {
      //   // Do not remove liveRegionContainer as it's a shared singleton.
      // }
    };
  }, []);

  const announce = useCallback((message: string, assertiveness: 'polite' | 'assertive' = 'polite') => {
    if (assertiveness === 'polite' && announcePolitelyRef.current) {
      announcePolitelyRef.current(message);
    } else if (assertiveness === 'assertive' && announceAssertivelyRef.current) {
      announceAssertivelyRef.current(message);
    }
  }, []);

  // Functions for specific announcements as per CLAUDE.md
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
    // The Announcer components are no longer needed here as we directly manipulate DOM
 };
};

export default useScreenReaderAnnouncements;
