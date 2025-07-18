import { useState, useEffect } from 'react';

function getViewportHeight() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}

export function useViewportHeight() {
  const [height, setHeight] = useState(getViewportHeight());

  useEffect(() => {
    function handleResize() {
      setHeight(getViewportHeight());
    }

    let cleanup: (() => void) | null = null;

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      cleanup = () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      cleanup = () => window.removeEventListener('resize', handleResize);
    }

    return cleanup;
  }, []);

  return height;
}
