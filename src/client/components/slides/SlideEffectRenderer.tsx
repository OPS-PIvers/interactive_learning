import React, { useEffect, useRef, useState } from 'react';
import { SlideEffect, DeviceType, SpotlightParameters, ZoomParameters } from '../../../shared/slideTypes';

interface SlideEffectRendererProps {
  effect: SlideEffect;
  containerRef: React.RefObject<HTMLDivElement>;
  deviceType: DeviceType;
  onComplete: () => void;
}

/**
 * SlideEffectRenderer - Renders slide effects with fixed positioning
 * 
 * This eliminates coordinate calculation issues by using exact positions
 */
export const SlideEffectRenderer: React.FC<SlideEffectRendererProps> = ({
  effect,
  containerRef,
  deviceType,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (effect.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300); // Fade out time
      }, effect.duration);

      return () => clearTimeout(timer);
    }
  }, [effect.duration, onComplete]);

  // Render spotlight effect
  const renderSpotlightEffect = () => {
    if (effect.type !== 'spotlight') return null;

    const params = effect.parameters as SpotlightParameters;
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return null;

    // Set canvas size to match container
    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dimmed background
    const intensity = params.intensity / 100;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * intensity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create spotlight cutout using exact position
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    const centerX = params.position.x + params.position.width / 2;
    const centerY = params.position.y + params.position.height / 2;

    if (params.shape === 'circle') {
      const radius = Math.max(params.position.width, params.position.height) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else if (params.shape === 'oval') {
      const radiusX = params.position.width / 2;
      const radiusY = params.position.height / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Rectangle
      ctx.fillRect(
        params.position.x,
        params.position.y,
        params.position.width,
        params.position.height
      );
    }

    // Add soft edges if requested
    if (params.fadeEdges) {
      ctx.globalCompositeOperation = 'source-over';
      const gradient = ctx.createRadialGradient(
        centerX, centerY, Math.min(params.position.width, params.position.height) / 4,
        centerX, centerY, Math.max(params.position.width, params.position.height) / 2
      );
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, `rgba(0, 0, 0, ${0.3 * intensity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();

    return (
      <div className="spotlight-effect fixed inset-0 z-50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
        
        {/* Message overlay */}
        {params.message && (
          <div 
            className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
            style={{
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-center">
              {params.message}
            </div>
          </div>
        )}

        {/* Click to continue */}
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onComplete, 300);
          }}
        />
      </div>
    );
  };

  // Render zoom effect
  const renderZoomEffect = () => {
    if (effect.type !== 'zoom') return null;

    const params = effect.parameters as ZoomParameters;

    const zoomStyle: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      zIndex: 40,
      overflow: 'hidden',
      backgroundColor: 'rgba(0, 0, 0, 0.1)'
    };

    const contentStyle: React.CSSProperties = {
      position: 'absolute',
      transformOrigin: 'center center',
      transform: `scale(${params.zoomLevel})`,
      transition: `transform ${effect.duration}ms ${effect.easing || 'ease-in-out'}`,
      left: params.centerOnTarget ? 
        `${50 - ((params.targetPosition.x + params.targetPosition.width / 2) / (containerRef.current?.clientWidth || 1)) * 100}%` : 
        0,
      top: params.centerOnTarget ? 
        `${50 - ((params.targetPosition.y + params.targetPosition.height / 2) / (containerRef.current?.clientHeight || 1)) * 100}%` : 
        0,
      width: '100%',
      height: '100%'
    };

    return (
      <div 
        className="zoom-effect"
        style={zoomStyle}
      >
        <div style={contentStyle}>
          {/* Zoom target indicator */}
          <div
            style={{
              position: 'absolute',
              left: params.targetPosition.x,
              top: params.targetPosition.y,
              width: params.targetPosition.width,
              height: params.targetPosition.height,
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              zIndex: 10
            }}
          />
        </div>
      </div>
    );
  };

  // Render text effect
  const renderShowTextEffect = () => {
    if (effect.type !== 'show_text') return null;

    const params = effect.parameters as any;

    return (
      <div
        className="text-effect absolute z-30"
        style={{
          left: params.position.x,
          top: params.position.y,
          width: params.position.width,
          height: params.position.height,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      >
        <div
          style={{
            ...params.style,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: params.style.padding || 16,
            borderRadius: params.style.borderRadius || 8
          }}
        >
          {params.text}
        </div>
      </div>
    );
  };

  // Main render logic
  useEffect(() => {
    if (effect.type === 'spotlight') {
      renderSpotlightEffect();
    }
  }, [effect, isVisible]);

  switch (effect.type) {
    case 'spotlight':
      return renderSpotlightEffect() || <div />;
    case 'zoom':
      return renderZoomEffect() || <div />;
    case 'show_text':
      return renderShowTextEffect() || <div />;
    default:
      return null;
  }
};

export default SlideEffectRenderer;