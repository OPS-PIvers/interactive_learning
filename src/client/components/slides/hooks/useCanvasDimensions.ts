import { useState, useEffect, useMemo } from 'react';
import { calculateCanvasDimensions } from '../../../utils/aspectRatioUtils';
import { DeviceType } from '../../../../shared/slideTypes';

export const useCanvasDimensions = (
  slideAreaRef: React.RefObject<HTMLDivElement>,
  aspectRatio: string,
  deviceType: DeviceType
) => {
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateContainerDimensions = () => {
      if (slideAreaRef.current) {
        const rect = slideAreaRef.current.getBoundingClientRect();

        if (deviceType === 'mobile') {
          const safeWidth = Math.max(rect.width || 0, 320);
          const safeHeight = Math.max(rect.height || 0, 240);

          setContainerDimensions({
            width: safeWidth,
            height: safeHeight
          });
        } else {
          setContainerDimensions({
            width: rect.width || document.documentElement.clientWidth - 32,
            height: rect.height || document.documentElement.clientHeight - 160
          });
        }
      } else {
        const fallbackWidth = deviceType === 'mobile' ?
          Math.min(document.documentElement.clientWidth - 16, 768) :
          document.documentElement.clientWidth - 32;
        const fallbackHeight = deviceType === 'mobile' ?
          Math.min(document.documentElement.clientHeight - 100, 600) :
          document.documentElement.clientHeight - 160;

        setContainerDimensions({
          width: fallbackWidth,
          height: fallbackHeight
        });
      }
    };

    const initialTimeout = deviceType === 'mobile' ? 150 : 0;
    setTimeout(updateContainerDimensions, initialTimeout);

    const handleResize = () => {
      const delay = deviceType === 'mobile' ? 200 : 100;
      setTimeout(updateContainerDimensions, delay);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    if (deviceType === 'mobile') {
      window.addEventListener('visualViewportChange', handleResize);
      document.addEventListener('scroll', handleResize, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange',handleResize);
      if (deviceType === 'mobile') {
        window.removeEventListener('visualViewportChange', handleResize);
        document.removeEventListener('scroll', handleResize);
      }
    };
  }, [deviceType, slideAreaRef]);

  const canvasDimensions = useMemo(() => {
    if (!aspectRatio) return { width: 800, height: 450 };

    const containerWidth = containerDimensions.width > 0 ? containerDimensions.width : 800;
    const containerHeight = containerDimensions.height > 0 ? containerDimensions.height : 600;

    return calculateCanvasDimensions(
      aspectRatio,
      containerWidth,
      containerHeight,
      24,
      false
    );
  }, [aspectRatio, containerDimensions]);

  return canvasDimensions;
};
