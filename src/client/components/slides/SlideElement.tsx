import React, { useCallback } from 'react';
import { SlideElement as SlideElementType, DeviceType, ViewportInfo, FixedPosition, ElementAnimation } from '../../../shared/slideTypes';
import { getResponsivePosition } from '../../hooks/useDeviceDetection';
import { TOUCH_TARGET } from '../../utils/styleConstants';
import { handleTouchInteraction, isMobileViewport } from '../../utils/touchFeedback';

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

  // Unified interaction handler - replaces double-click with single tap/click
  const handleInteraction = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    console.log('🖱️ ELEMENT CLICKED:', { 
      elementId: element.id, 
      elementType: element.type, 
      hasInteractions: element.interactions?.length || 0,
      isEditMode: !!onEdit 
    });
    
    // Provide touch feedback on mobile viewports
    if (e.currentTarget instanceof HTMLElement) {
      handleTouchInteraction(e.currentTarget, e, 'light');
    }

    // Handle edit mode (for editor)
    if (onEdit) {
      console.log('📝 Opening element for editing');
      onEdit(element);
      return;
    }

    // Handle viewer interactions
    const clickInteraction = element.interactions?.find(
      (interaction) => interaction.trigger === 'click'
    );

    if (clickInteraction) {
      console.log('▶️ Calling onInteraction with:', element.id, clickInteraction.id);
      onInteraction(element.id, clickInteraction.id);
    } else {
      console.log('❌ No click interaction found for element:', element.id);
    }
  }, [element, onInteraction, onEdit]);

  const handleHover = useCallback(() => {
    const hoverInteraction = element.interactions?.find(
      (interaction) => interaction.trigger === 'hover'
    );
    if (hoverInteraction) {
      onInteraction(element.id, hoverInteraction.id);
    }
  }, [element.id, element.interactions, onInteraction]);

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
    zIndex: style.zIndex ?? 10,
    cursor: (element.interactions?.length || 0) > 0 || onEdit ? 'pointer' : 'default',
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
                className={`hotspot-dot ${
                  // Mobile-first touch target classes - fix from improvement plan
                  isMobileViewport() 
                    ? TOUCH_TARGET.MOBILE_HOTSPOT // 48px mobile (meets 44px requirement)
                    : TOUCH_TARGET.DESKTOP_HOTSPOT // 20px desktop for precision
                }`}
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
      className={`slide-element ${isInteractive ? 'transform-gpu' : ''} min-w-11 min-h-11 sm:min-w-0 sm:min-h-0`}
      style={elementStyle}
      onClick={handleInteraction}
      onTouchEnd={handleInteraction}
      onMouseEnter={handleHover}
      data-element-id={element.id}
      data-element-type={element.type}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={element.content.title || `${element.type} element`}
      aria-roledescription={isInteractive ? `Interactive ${element.type}` : undefined}
      aria-describedby={element.type === 'hotspot' && element.interactions?.some((i) => i.trigger === 'hover') ? `${element.id}-tooltip` : element.content.description ? `${element.id}-desc` : undefined}>

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