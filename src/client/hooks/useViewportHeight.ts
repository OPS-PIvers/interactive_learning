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

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport.removeEventListener('resize', handleResize);
      };
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return height;
}
