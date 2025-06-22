import { useState, useEffect } from 'react';
import { isMobileDevice } from '../utils/mobileUtils';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
