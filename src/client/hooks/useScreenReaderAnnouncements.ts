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

interface ScreenReaderAnnouncerProps {
  message: string;
  assertiveness?: 'assertive' | 'polite';
}

const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({ message, assertiveness = 'polite' }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live={assertiveness}
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        margin: '-1px',
        padding: '0',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: '0',
      }}
    >
      {message}
    </div>
  );
};

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


// Store messages and their assertiveness levels
const messages: Array<{ id: number; text: string; assertiveness: 'polite' | 'assertive' }> = [];
let messageIdCounter = 0;
let currentPoliteMessage = "";
let currentAssertiveMessage = "";

const useScreenReaderAnnouncements = () => {
  // These states are used to trigger re-renders of the Announcer components
  const [, setPoliteUpdate] = useState(0);
  const [, setAssertiveUpdate] = useState(0);

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
      // Cleanup: remove the regions when the last component using the hook unmounts
      // This is tricky to get right if multiple components use the hook.
      // For simplicity, we'll leave them, but in a real app, you might ref-count.
      // politeRegion.remove();
      // assertiveRegion.remove();
      // if (liveRegionContainer && liveRegionContainer.children.length === 0) {
      //   liveRegionContainer.remove();
      //   liveRegionContainer = null;
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
