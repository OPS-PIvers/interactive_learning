import { motion, AnimatePresence, Easing, MotionStyle } from 'framer-motion';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SlideEffect, DeviceType, SpotlightParameters, ZoomParameters, PanZoomParameters, AnimateParameters, PlayMediaParameters, QuizParameters, ShowTextParameters } from '../../../shared/slideTypes';
import { Z_INDEX, Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import { AnimatedElement } from '../animations/ElementAnimations';

interface SlideEffectRendererProps {
  effect: SlideEffect;
  containerRef: React.RefObject<HTMLDivElement>;
  deviceType: DeviceType;
  canvasDimensions?: {width: number;height: number;scale: number;};
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
  canvasDimensions,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Quiz effect state - moved to component level to follow Rules of Hooks
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);





  // Calculate slide canvas positioning for proper effect alignment
  const slideCanvasInfo = React.useMemo(() => {
    if (!containerRef.current) return null;

    const container = containerRef.current;
    const slideCanvas = container.querySelector('.slide-canvas') as HTMLElement;
    const canvasRect = slideCanvas ? slideCanvas.getBoundingClientRect() : container.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scale = canvasDimensions?.scale || 1;

    return {
      slideCanvas,
      canvasRect,
      containerRect,
      offsetX: slideCanvas ? canvasRect.left - containerRect.left : 0,
      offsetY: slideCanvas ? canvasRect.top - containerRect.top : 0,
      scale,
      scaledWidth: canvasRect.width,
      scaledHeight: canvasRect.height
    };
  }, [containerRef, canvasDimensions]);

  // Render spotlight effect
  const renderSpotlightEffect = useCallback(() => {
    if (effect.type !== 'spotlight' || !slideCanvasInfo) return null;

    const params = effect.parameters as SpotlightParameters;
    const canvas = canvasRef.current;

    if (!canvas) return null;

    // Set canvas size to match the slide canvas, not the full container
    canvas.width = slideCanvasInfo.canvasRect.width;
    canvas.height = slideCanvasInfo.canvasRect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dimmed background
    const intensity = params.intensity / 100;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * intensity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create spotlight cutout using exact position with scaling applied
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    // Apply scaling to position coordinates
    const scaledX = params.position.x * slideCanvasInfo.scale;
    const scaledY = params.position.y * slideCanvasInfo.scale;
    const scaledWidth = params.position.width * slideCanvasInfo.scale;
    const scaledHeight = params.position.height * slideCanvasInfo.scale;

    const centerX = scaledX + scaledWidth / 2;
    const centerY = scaledY + scaledHeight / 2;

    if (params.shape === 'circle') {
      const radius = Math.max(scaledWidth, scaledHeight) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else if (params.shape === 'oval') {
      const radiusX = scaledWidth / 2;
      const radiusY = scaledHeight / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Rectangle
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
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
      <AnimatePresence>
        {isVisible && (
        <AnimatedElement
          variant="spotlight"
          microInteraction="subtle"
          className={`spotlight-effect fixed inset-0 ${Z_INDEX_TAILWIND.OVERLAY_CONTENT}`}
          isVisible={isVisible}>

            <motion.canvas
            ref={canvasRef}
            className="absolute"
            style={{
              left: slideCanvasInfo?.offsetX || 0,
              top: slideCanvasInfo?.offsetY || 0,
              width: slideCanvasInfo?.canvasRect.width || '100%',
              height: slideCanvasInfo?.canvasRect.height || '100%'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }} />

            
            {/* Message overlay */}
            {params.message && (
          <motion.div
            className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 ${Z_INDEX_TAILWIND.SLIDE_CONTENT} pointer-events-none`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}>

                <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-center">
                  {params.message}
                </div>
              </motion.div>
            )}

            {/* Click to continue */}
            <motion.div
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onComplete, 300);
            }}
            whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }} />

          </AnimatedElement>
        )}
      </AnimatePresence>
    );
  }, [effect, slideCanvasInfo, isVisible, onComplete]);

  useEffect(() => {
    if (effect.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300); // Fade out time
      }, effect.duration);

      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for else case
  }, [effect.duration, onComplete]);

  // Render zoom effect
  const renderZoomEffect = () => {
    if (effect.type !== 'pan_zoom') return null;

    const params = effect.parameters as ZoomParameters;

    const zoomStyle: MotionStyle = {
      position: 'fixed',
      inset: 0,
      zIndex: Z_INDEX.SELECTED_ELEMENTS,
      overflow: 'hidden',
      backgroundColor: 'rgba(0, 0, 0, 0.1)'
    };

    const contentStyle: MotionStyle = {
      position: 'absolute',
      transformOrigin: 'center center',
      transform: `scale(${params.zoomLevel})`,
      transition: `transform ${effect.duration}ms ${effect.easing || 'ease-in-out'}`,
      left: params.centerOnTarget ?
      `${50 - (params.targetPosition.x + params.targetPosition.width / 2) / (containerRef.current?.clientWidth || 1) * 100}%` :
      0,
      top: params.centerOnTarget ?
      `${50 - (params.targetPosition.y + params.targetPosition.height / 2) / (containerRef.current?.clientHeight || 1) * 100}%` :
      0,
      width: '100%',
      height: '100%'
    };

    return (
      <AnimatePresence>
        {isVisible &&
        <AnimatedElement
          variant="zoom"
          className="zoom-effect"
          style={zoomStyle}
          isVisible={isVisible}>

            <motion.div
            style={{
              position: 'absolute',
              transformOrigin: 'center center',
              width: '100%',
              height: '100%'
            }}
            initial={{
              scale: 1,
              x: 0,
              y: 0
            }}
            animate={{
              scale: params.zoomLevel,
              x: params.centerOnTarget ?
              `${50 - (params.targetPosition.x + params.targetPosition.width / 2) / (containerRef.current?.clientWidth || 1) * 100}%` :
              0,
              y: params.centerOnTarget ?
              `${50 - (params.targetPosition.y + params.targetPosition.height / 2) / (containerRef.current?.clientHeight || 1) * 100}%` :
              0
            }}
            transition={{
              duration: effect.duration / 1000,
              ease: effect.easing as Easing || "easeInOut",
              type: "spring",
              damping: 20,
              stiffness: 100
            }}>

              {/* Zoom target indicator */}
              <motion.div
              style={{
                position: 'absolute',
                left: params.targetPosition.x,
                top: params.targetPosition.y,
                width: params.targetPosition.width,
                height: params.targetPosition.height,
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                zIndex: Z_INDEX.SLIDE_CONTENT
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }} />

            </motion.div>
          </AnimatedElement>
        }
      </AnimatePresence>);

  };

  // Render text effect
  const renderShowTextEffect = () => {
    if (effect.type !== 'text' || !slideCanvasInfo) return null;

    const params = effect.parameters as ShowTextParameters;

    return (
      <AnimatePresence>
        {isVisible &&
        <AnimatedElement
          variant="textReveal"
          microInteraction="subtle"
          className={`text-effect absolute ${Z_INDEX_TAILWIND.SLIDE_ELEMENTS}`}
          style={{
            left: slideCanvasInfo.offsetX + params.position.x * slideCanvasInfo.scale,
            top: slideCanvasInfo.offsetY + params.position.y * slideCanvasInfo.scale,
            width: params.position.width * slideCanvasInfo.scale,
            height: params.position.height * slideCanvasInfo.scale
          }}
          isVisible={isVisible}>

            <motion.div
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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 100,
              duration: 0.4
            }}>

              {params.text}
            </motion.div>
          </AnimatedElement>
        }
      </AnimatePresence>);

  };

  // Render pan and zoom effect
  const renderPanZoomEffect = () => {
    if (effect.type !== 'pan_zoom' || !slideCanvasInfo) return null;

    const params = effect.parameters as PanZoomParameters;

    return (
      <AnimatePresence>
        {isVisible &&
        <motion.div
          className={`absolute ${Z_INDEX_TAILWIND.SELECTED_ELEMENTS} overflow-hidden`}
          style={{
            left: slideCanvasInfo.offsetX,
            top: slideCanvasInfo.offsetY,
            width: slideCanvasInfo.canvasRect.width,
            height: slideCanvasInfo.canvasRect.height
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>

            <motion.div
            className="w-full h-full"
            initial={{
              scale: 1,
              x: 0,
              y: 0
            }}
            animate={{
              scale: params.zoomLevel || 1.5,
              x: params.targetPosition ? `-${(params.targetPosition.x + params.targetPosition.width / 2) * slideCanvasInfo.scale}px` : 0,
              y: params.targetPosition ? `-${(params.targetPosition.y + params.targetPosition.height / 2) * slideCanvasInfo.scale}px` : 0
            }}
            transition={{
              duration: effect.duration / 1000,
              ease: params.easing as Easing || "easeInOut",
              type: "spring",
              damping: 20,
              stiffness: 100
            }}>

              {/* Pan/Zoom target indicator */}
              {params.targetPosition &&
            <motion.div
              className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"
              style={{
                left: (params.targetPosition.x + params.targetPosition.width / 2) * slideCanvasInfo.scale - 8,
                top: (params.targetPosition.y + params.targetPosition.height / 2) * slideCanvasInfo.scale - 8,
                zIndex: Z_INDEX.SLIDE_CONTENT
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }} />

            }
            </motion.div>
            
            {/* Click overlay to complete */}
            <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onComplete, 300);
            }} />

          </motion.div>
        }
      </AnimatePresence>);

  };


  // Render media playback effect
  const renderPlayMediaEffect = () => {
    if (effect.type !== 'video' && effect.type !== 'audio') return null;

    const params = effect.parameters as PlayMediaParameters;

    return (
      <AnimatePresence>
        {isVisible &&
        <motion.div
          className={`fixed inset-0 ${Z_INDEX_TAILWIND.MODAL_CONTENT} bg-black/50 flex items-center justify-center`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>

            <motion.div
            className="bg-black/90 rounded-lg p-6 max-w-2xl w-full mx-4"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}>

              {params.mediaType === 'video' &&
            <video
              src={params.mediaUrl}
              controls={params.controls}
              autoPlay={params.autoplay}
              className="w-full rounded"
              style={{ maxHeight: '70vh' }}
              onEnded={() => {
                setIsVisible(false);
                setTimeout(onComplete, 300);
              }} />

            }
              
              {params.mediaType === 'audio' &&
            <div className="text-center">
                  <div className="text-white mb-4">
                    <div className="text-lg font-semibold mb-2">🎵 Playing Audio</div>
                    <div className="text-sm text-gray-300">Audio is now playing...</div>
                  </div>
                  <audio
                src={params.mediaUrl}
                controls={params.controls}
                autoPlay={params.autoplay}
                className="w-full"
                onEnded={() => {
                  setIsVisible(false);
                  setTimeout(onComplete, 300);
                }} />

                </div>
            }
              
              {/* Close button */}
              <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onComplete, 300);
              }}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold">

                ×
              </button>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>);

  };

  // Render quiz effect
  const renderQuizEffect = () => {
    if (effect.type !== 'quiz') return null;

    const params = effect.parameters as QuizParameters;

    const handleAnswerSelect = (answer: string) => {
      setSelectedAnswer(answer);
      setShowResult(true);

      // Auto-close after showing result
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
      }, 2000);
    };

    return (
      <AnimatePresence>
        {isVisible &&
        <motion.div
          className={`fixed inset-0 ${Z_INDEX_TAILWIND.MODAL_CONTENT} bg-black/50 flex items-center justify-center p-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>

            <motion.div
            className="bg-white rounded-lg p-6 max-w-lg w-full"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}>

              {!showResult ?
            <>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{params.question}</h3>
                  <div className="space-y-3">
                    {params.choices?.map((choice, index) =>
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(choice)}
                  className="w-full text-left p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors">

                        {choice}
                      </button>
                )}
                  </div>
                </> :

            <div className="text-center">
                  <div className={`text-2xl mb-4 ${
              selectedAnswer === params.correctAnswer ? 'text-green-600' : 'text-red-600'}`
              }>
                    {selectedAnswer === params.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                  </div>
                  <div className="text-gray-700 mb-4">
                    {selectedAnswer === params.correctAnswer ?
                'Well done!' :
                `The correct answer was: ${params.correctAnswer}`
                }
                  </div>
                  {params.explanation &&
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {params.explanation}
                    </div>
              }
                </div>
            }
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>);

  };

  // Main render logic
  useEffect(() => {
    if (effect.type === 'spotlight') {
      renderSpotlightEffect();
    }
  }, [effect, isVisible, renderSpotlightEffect]);

  switch (effect.type) {
    case 'spotlight':
      return renderSpotlightEffect() || <div />;
    case 'pan_zoom':
      return renderZoomEffect() || <div />;
    case 'text':
      return renderShowTextEffect() || <div />;
    case 'video':
    case 'audio':
      return renderPlayMediaEffect() || <div />;
    case 'quiz':
      return renderQuizEffect() || <div />;
    default:
      return null;
  }
};

export default SlideEffectRenderer;