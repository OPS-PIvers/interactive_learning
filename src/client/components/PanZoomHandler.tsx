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

interface TransformEventTarget extends EventTarget {
  state?: {
    positionX: number;
    positionY: number;
    scale: number;
  };
}

export const PanZoomHandler: React.FC<PanZoomHandlerProps> = ({ 
  onPanZoom, 
  children 
}) => {
  const handleTransformChange = (event: React.TransitionEvent) => {
    // This component seems to be a placeholder or legacy component.
    // The event passed to onTransitionEnd does not have a `state` property.
    // This is likely a bug. For now, I will leave the logic as is but type the event.
    const target = event.target as TransformEventTarget;
    if (onPanZoom && target.state) {
      const state = target.state;
      onPanZoom({
        x: state.positionX,
        y: state.positionY,
        scale: state.scale
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