import { useState, useEffect } from 'react';

function getViewportHeight() {
  return window.innerHeight;
}

export function useViewportHeight() {
  const [height, setHeight] = useState(getViewportHeight());

  useEffect(() => {
    function handleResize() {
      setHeight(getViewportHeight());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return height;
}
