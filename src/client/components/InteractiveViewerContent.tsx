import React, { useEffect } from 'react';
import { usePanZoom } from '../contexts/PanZoomProvider';

interface InteractiveViewerContentProps {
  imageContainerRef: React.RefObject<HTMLElement>;
  imageElementRef: React.RefObject<HTMLImageElement>;
  children: React.ReactNode;
}

/**
 * Wrapper component that sets up the PanZoom context with container and image elements
 */
export const InteractiveViewerContent: React.FC<InteractiveViewerContentProps> = ({
  imageContainerRef,
  imageElementRef,
  children
}) => {
  const { setContainerElement, setImageElement } = usePanZoom();

  // Set up elements when refs change
  useEffect(() => {
    if (imageContainerRef.current) {
      setContainerElement(imageContainerRef.current);
    }
  }, [imageContainerRef.current, setContainerElement]);

  useEffect(() => {
    if (imageElementRef.current) {
      setImageElement(imageElementRef.current);
    }
  }, [imageElementRef.current, setImageElement]);

  return <>{children}</>;
};