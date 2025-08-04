import React from 'react';

export interface PanZoomEvent {
  x: number;
  y: number;
  scale: number;
}

export interface PanZoomHandlerProps {
  onPanZoom?: (event: PanZoomEvent) => void;
  children: React.ReactNode;
}

export const PanZoomHandler: React.FC<PanZoomHandlerProps> = ({ 
  onPanZoom, 
  children 
}) => {
  const handleTransformChange = (event: any) => {
    if (onPanZoom) {
      onPanZoom({
        x: event.state.positionX,
        y: event.state.positionY,
        scale: event.state.scale
      });
    }
  };

  return (
    <div onTransitionEnd={handleTransformChange}>
      {children}
    </div>
  );
};

export default PanZoomHandler;