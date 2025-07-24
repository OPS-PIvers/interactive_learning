import React, { useEffect } from 'react';
import { usePanZoom } from '../contexts/PanZoomProvider';

interface InteractiveViewerContentProps {
  imageContainerRef: React.RefObject<HTMLElement>;
  imageElementRef: React.RefObject<HTMLImageElement>;
  children: React.ReactNode;
  onTransformUpdate?: (transform: { scale: number; translateX: number; translateY: number }) => void;
}

/**
 * Wrapper component that sets up the PanZoom context with container and image elements
 */
export const InteractiveViewerContent: React.FC<InteractiveViewerContentProps> = ({
  imageContainerRef,
  imageElementRef,
  children,
  onTransformUpdate
}) => {
  const { setContainerElement, setImageElement, currentTransform } = usePanZoom();

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

  // Sync context transform changes to parent component
  useEffect(() => {
    if (onTransformUpdate && currentTransform) {
      onTransformUpdate(currentTransform);
    }
  }, [currentTransform, onTransformUpdate]);

  return <>{children}</>;
};