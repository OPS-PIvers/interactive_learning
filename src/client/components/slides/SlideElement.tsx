import React, { useCallback, useRef, useState, useEffect } from 'react';
import { SlideElement as SlideElementType, DeviceType, ViewportInfo, FixedPosition, ElementAnimation } from '../../../shared/slideTypes';
import { getResponsivePosition } from '../../hooks/useDeviceDetection';
import { handleTouchInteraction } from '../../utils/touchFeedback';
import { Z_INDEX } from '../../utils/zIndexLevels';

interface SlideElementProps {
  element: SlideElementType;
  deviceType: DeviceType;
  viewportInfo: ViewportInfo;
  onInteraction: (elementId: string, interactionId: string) => void;
  onEdit?: (element: SlideElementType) => void; // Optional edit handler for editor mode
}

/**
 * SlideElement - Individual interactive element within a slide
 * 
 * Uses fixed positioning instead of percentage calculations
 */
export const SlideElement: React.FC<SlideElementProps> = ({
  element,
  deviceType,
  viewportInfo,
  onInteraction,
  onEdit
}) => {
  // Get position for current device
  const position: FixedPosition = getResponsivePosition(element.position, deviceType);

  // Interaction state management
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const hasInteractedRef = useRef(false);

  // Clear long press timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  // Unified click handler - handles all click-based interactions
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ ELEMENT CLICKED:', { 
      elementId: element.id, 
      elementType: element.type, 
      hasInteractions: element.interactions?.length || 0,
      isEditMode: !!onEdit 
    });

    hasInteractedRef.current = true;
    
    // Handle edit mode (for editor)
    if (onEdit) {
      console.log('📝 Opening element for editing');
      onEdit(element);
      return;
    }

    // Check for double-click
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    const isDoubleClick = timeSinceLastClick < 500; // 500ms double-click threshold
    lastClickTimeRef.current = now;

    // Find appropriate interaction
    const doubleClickInteraction = element.interactions?.find(i => i.trigger === 'double-click');
    const clickInteraction = element.interactions?.find(i => i.trigger === 'click');
    
    const targetInteraction = (isDoubleClick && doubleClickInteraction) ? doubleClickInteraction : clickInteraction;

    if (targetInteraction) {
      console.log('▶️ Triggering interaction:', targetInteraction.trigger, 'ID:', targetInteraction.id);
      onInteraction(element.id, targetInteraction.id);
    } else {
      console.log('❌ No suitable interaction found for click/double-click');
    }
  }, [element, onInteraction, onEdit]);

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(true);
    touchStartTimeRef.current = Date.now();
    hasInteractedRef.current = false;
    
    // Provide haptic feedback
    if (e.currentTarget instanceof HTMLElement) {
      handleTouchInteraction(e.currentTarget, e, 'light');
    }

    // Handle touch-start interaction
    const touchStartInteraction = element.interactions?.find(i => i.trigger === 'touch-start');
    if (touchStartInteraction && !onEdit) {
      console.log('▶️ Triggering touch-start interaction:', touchStartInteraction.id);
      onInteraction(element.id, touchStartInteraction.id);
      hasInteractedRef.current = true;
    }

    // Set up long press timer
    longPressTimeoutRef.current = setTimeout(() => {
      const longPressInteraction = element.interactions?.find(i => i.trigger === 'long-press');
      if (longPressInteraction && !onEdit && !hasInteractedRef.current) {
        console.log('▶️ Triggering long-press interaction:', longPressInteraction.id);
        onInteraction(element.id, longPressInteraction.id);
        hasInteractedRef.current = true;
      }
    }, 800); // 800ms for long press
  }, [element, onInteraction, onEdit]);

  // Touch end handler
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    // Handle touch-end interaction
    const touchEndInteraction = element.interactions?.find(i => i.trigger === 'touch-end');
    if (touchEndInteraction && !onEdit && !hasInteractedRef.current) {
      console.log('▶️ Triggering touch-end interaction:', touchEndInteraction.id);
      onInteraction(element.id, touchEndInteraction.id);
      hasInteractedRef.current = true;
      return;
    }

    // Handle tap (short touch) if no other interaction has fired
    if (touchDuration < 800 && !hasInteractedRef.current) {
      // Handle edit mode (for editor)
      if (onEdit) {
        console.log('📝 Opening element for editing');
        onEdit(element);
        return;
      }

      // Check for double-tap
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;
      const isDoubleTap = timeSinceLastClick < 500;
      lastClickTimeRef.current = now;

      const doubleClickInteraction = element.interactions?.find(i => i.trigger === 'double-click');
      const clickInteraction = element.interactions?.find(i => i.trigger === 'click');
      
      const targetInteraction = (isDoubleTap && doubleClickInteraction) ? doubleClickInteraction : clickInteraction;

      if (targetInteraction) {
        console.log('▶️ Triggering tap interaction:', targetInteraction.trigger, 'ID:', targetInteraction.id);
        onInteraction(element.id, targetInteraction.id);
      } else {
        console.log('❌ No suitable interaction found for tap');
      }
    }
  }, [element, onInteraction, onEdit]);

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    if (onEdit) return; // Don't trigger hover in edit mode
    
    const hoverInteraction = element.interactions?.find(i => i.trigger === 'hover');
    if (hoverInteraction) {
      console.log('▶️ Triggering hover interaction:', hoverInteraction.id);
      onInteraction(element.id, hoverInteraction.id);
    }
  }, [element, onInteraction, onEdit]);

  const handleMouseLeave = useCallback(() => {
    // Reset pressed state on mouse leave
    setIsPressed(false);
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  // Build element style with null checks
  const style = element.style || {};
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: position.width,
    height: element.type === 'hotspot' ? position.width : position.height,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderStyle: style.borderWidth ? 'solid' : 'none',
    borderRadius: style.borderRadius,
    opacity: style.opacity ?? 1,
    zIndex: style.zIndex ?? Z_INDEX.SLIDE_ELEMENT,
    cursor: (element.interactions?.length || 0) > 0 || onEdit ? 'pointer' : 'default',
    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
  };

  // Add animation classes
  const animationClasses = getAnimationClasses(style.animation);

  // Render different element types
  const renderElementContent = () => {
    switch (element.type) {
      case 'hotspot':
        return (
          <div className={`slide-hotspot ${animationClasses}`}>
            <div className="hotspot-indicator">
              <div
                className="hotspot-dot w-12 h-12 min-w-[44px] min-h-[44px] md:w-5 md:h-5"
                style={{
                  backgroundColor: style.backgroundColor || '#3b82f6',
                  borderColor: style.borderColor || style.backgroundColor || '#3b82f6',
                  borderWidth: style.borderWidth || 2,
                  opacity: style.opacity || 1,
                  borderRadius: '50%',
                  border: '2px solid',
                  transition: 'all 0.2s ease-in-out',
                }} />

              {element.interactions?.some((i) => i.trigger === 'hover') &&
              <div className="hotspot-tooltip" id={`${element.id}-tooltip`} role="tooltip">
                  <h4>{element.content.title}</h4>
                  {element.content.description &&
                <p>{element.content.description}</p>
                }
                </div>
              }
            </div>
          </div>);


      case 'text':
        return (
          <div className={`slide-text ${animationClasses}`}>
            {element.content.title &&
            <h3 className="text-title">{element.content.title}</h3>
            }
            {element.content.description &&
            <p className="text-description" id={`${element.id}-desc`}>{element.content.description}</p>
            }
          </div>);


      case 'media':
        return (
          <div className={`slide-media ${animationClasses}`}>
            {element.content.mediaType === 'image' && element.content.mediaUrl &&
            <img
              src={element.content.mediaUrl}
              alt={element.content.title || 'Media content'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

            }
            {element.content.mediaType === 'video' && element.content.mediaUrl &&
            <video
              src={element.content.mediaUrl}
              style={{ width: '100%', height: '100%' }}
              controls />

            }
            {element.content.mediaType === 'audio' && element.content.mediaUrl &&
            <audio
              src={element.content.mediaUrl}
              controls
              style={{ width: '100%' }} />

            }
          </div>);


      case 'shape':
        return (
          <div className={`slide-shape ${animationClasses}`} />);


      default:
        return (
          <div className={`slide-element-unknown ${animationClasses}`}>
            Unknown element type: {element.type}
          </div>);

    }
  };

  const isInteractive = (element.interactions?.length || 0) > 0 || onEdit;

  return (
    <div
      className={`slide-element ${isInteractive ? 'transform-gpu select-none' : ''} min-w-11 min-h-11 sm:min-w-0 sm:min-h-0`}
      style={elementStyle}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-element-id={element.id}
      data-element-type={element.type}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={element.content.title || `${element.type} element`}
      aria-roledescription={isInteractive ? `Interactive ${element.type}` : undefined}
      aria-describedby={element.type === 'hotspot' && element.interactions?.some((i) => i.trigger === 'hover') ? `${element.id}-tooltip` : element.content.description ? `${element.id}-desc` : undefined}
      aria-pressed={isPressed ? 'true' : 'false'}>

      {renderElementContent()}
    </div>);

};

/**
 * Get CSS animation classes based on animation configuration
 */
function getAnimationClasses(animation?: ElementAnimation): string {
  if (!animation || animation.type === 'none') {
    return '';
  }

  const classes = [`animate-${animation.type}`];

  if (animation.iterationCount === 'infinite') {
    classes.push('animate-infinite');
  }

  return classes.join(' ');
}

export default SlideElement;