import { useCallback, useEffect, useRef } from 'react';

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

// Use a module-level scope to ensure these are created only once.
let politeRegionSingleton: HTMLDivElement | null = null;
let assertiveRegionSingleton: HTMLDivElement | null = null;
let liveRegionContainerSingleton: HTMLDivElement | null = null;

const SR_CONTAINER_ID = 'screen-reader-announcements-container';
const SR_POLITE_REGION_ID = 'screen-reader-polite-region';
const SR_ASSERTIVE_REGION_ID = 'screen-reader-assertive-region';

const ensureLiveRegions = () => {
  if (!liveRegionContainerSingleton) {
    liveRegionContainerSingleton = document.getElementById(SR_CONTAINER_ID) as HTMLDivElement | null;
    if (!liveRegionContainerSingleton) {
      liveRegionContainerSingleton = document.createElement('div');
      liveRegionContainerSingleton.id = SR_CONTAINER_ID;
      // Visually hide the container
      liveRegionContainerSingleton.style.position = 'absolute';
      liveRegionContainerSingleton.style.width = '1px';
      liveRegionContainerSingleton.style.height = '1px';
      liveRegionContainerSingleton.style.margin = '-1px';
      liveRegionContainerSingleton.style.padding = '0';
      liveRegionContainerSingleton.style.overflow = 'hidden';
      liveRegionContainerSingleton.style.clip = 'rect(0, 0, 0, 0)';
      liveRegionContainerSingleton.style.border = '0';
      document.body.appendChild(liveRegionContainerSingleton);
    }
  }

  if (!politeRegionSingleton) {
    politeRegionSingleton = document.getElementById(SR_POLITE_REGION_ID) as HTMLDivElement | null;
    if (!politeRegionSingleton) {
      politeRegionSingleton = document.createElement('div');
      politeRegionSingleton.id = SR_POLITE_REGION_ID;
      politeRegionSingleton.setAttribute('role', 'status');
      politeRegionSingleton.setAttribute('aria-live', 'polite');
      politeRegionSingleton.setAttribute('aria-atomic', 'true');
      liveRegionContainerSingleton.appendChild(politeRegionSingleton);
    }
  }

  if (!assertiveRegionSingleton) {
    assertiveRegionSingleton = document.getElementById(SR_ASSERTIVE_REGION_ID) as HTMLDivElement | null;
    if (!assertiveRegionSingleton) {
      assertiveRegionSingleton = document.createElement('div');
      assertiveRegionSingleton.id = SR_ASSERTIVE_REGION_ID;
      assertiveRegionSingleton.setAttribute('role', 'alert');
      assertiveRegionSingleton.setAttribute('aria-live', 'assertive');
      assertiveRegionSingleton.setAttribute('aria-atomic', 'true');
      liveRegionContainerSingleton.appendChild(assertiveRegionSingleton);
    }
  }
};

const useScreenReaderAnnouncements = () => {
  // Refs for debounced functions to ensure they are stable across re-renders
  const announcePolitelyRef = useRef<(message: string) => void>();
  const announceAssertivelyRef = useRef<(message: string) => void>();

  useEffect(() => {
    // Ensure regions are present (e.g., if body was cleared or for SSR hydration)
    ensureLiveRegions();

    const updatePoliteRegion = (message: string) => {
      if (politeRegionSingleton) {
        // Hack to force re-announcement of the same message
        if (politeRegionSingleton.textContent === message) {
          politeRegionSingleton.textContent = '';
          // Delay needs to be long enough for screen reader to process the change
          const timeoutId = setTimeout(() => {
            if (politeRegionSingleton) politeRegionSingleton.textContent = message;
          }, 100);
          
          // Store timeout for potential cleanup
          return () => clearTimeout(timeoutId);
        } else {
          politeRegionSingleton.textContent = message;
        }
      }
      return null;
    };

    const updateAssertiveRegion = (message: string) => {
      if (assertiveRegionSingleton) {
        // Hack to force re-announcement
        if (assertiveRegionSingleton.textContent === message) {
          assertiveRegionSingleton.textContent = '';
          const timeoutId = setTimeout(() => {
            if (assertiveRegionSingleton) assertiveRegionSingleton.textContent = message;
          }, 100);
          
          // Store timeout for potential cleanup
          return () => clearTimeout(timeoutId);
        } else {
          assertiveRegionSingleton.textContent = message;
        }
      }
      return null;
    };

    announcePolitelyRef.current = debounce((message: string) => {
      // console.log(`Announcing politely: ${message}`);
      updatePoliteRegion(message);
    }, 200); // Debounce time for polite announcements

    announceAssertivelyRef.current = (message: string) => {
      // console.log(`Announcing assertively: ${message}`);
      updateAssertiveRegion(message);
    };

    // No cleanup needed for global singletons in this model.
    // If the hook were to manage its own instances, cleanup would be here.
  }, []); // Empty dependency array means this effect runs once per component instance

  const announce = useCallback((message: string, assertiveness: 'polite' | 'assertive' = 'polite') => {
    if (assertiveness === 'polite' && announcePolitelyRef.current) {
      announcePolitelyRef.current(message);
    } else if (assertiveness === 'assertive' && announceAssertivelyRef.current) {
      announceAssertivelyRef.current(message);
    }
  }, []); // useCallback dependencies are correct as refs don't change

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
