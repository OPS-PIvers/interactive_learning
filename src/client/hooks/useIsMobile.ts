import { useState, useEffect } from 'react';
import { isMobileDevice } from '../utils/mobileUtils';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    // Debounce the resize handler to avoid performance issues from frequent re-renders.
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedCheckMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        checkMobile();
      }, 200); // 200ms debounce delay
    };

    window.addEventListener('resize', debouncedCheckMobile);
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  return isMobile;
};
