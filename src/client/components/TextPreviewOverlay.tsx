import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TimelineEventData } from '../../shared/types';
import { Z_INDEX } from '../constants/interactionConstants';
import { throttle } from '../utils/asyncUtils';

interface TextPreviewOverlayProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  containerBounds: { width: number; height: number; left: number; top: number } | null;
}

const TextPreviewOverlay: React.FC<TextPreviewOverlayProps> = ({
  event,
  onUpdate,
  containerBounds
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempText, setTempText] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Get current text properties with defaults
  const textBox = {
    x: event.textX || 50,
    y: event.textY || 50,
    width: event.textWidth || 200,
    height: event.textHeight || 60,
    content: event.content || event.textContent || 'Enter your text here...'
  };

  useEffect(() => {
    setTempText(textBox.content);
  }, [textBox.content]);

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const throttledUpdate = useMemo(() => {
    return throttle((updatedEvent: unknown) => {
      onUpdate(updatedEvent as TimelineEventData);
    }, 50); // Throttle to 50ms
  }, [onUpdate]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerBounds || (!isDragging && !isResizing)) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (isDragging) {
      const percentX = (deltaX / containerBounds.width) * 100;
      const percentY = (deltaY / containerBounds.height) * 100;
      
      const textWidthPercent = (textBox.width / containerBounds.width) * 100;
      const textHeightPercent = (textBox.height / containerBounds.height) * 100;
      const maxX = Math.max(0, 100 - textWidthPercent);
      const maxY = Math.max(0, 100 - textHeightPercent);
      
      const newX = Math.max(0, Math.min(maxX, textBox.x + percentX));
      const newY = Math.max(0, Math.min(maxY, textBox.y + percentY));

      setDragStart({ x: e.clientX, y: e.clientY });

      throttledUpdate({
        ...event,
        textX: newX,
        textY: newY
      });
    } else if (isResizing) {
      const minWidth = Math.max(100, containerBounds.width * 0.1);
      const maxWidth = containerBounds.width * 0.8;
      const minHeight = Math.max(40, containerBounds.height * 0.05);
      const maxHeight = containerBounds.height * 0.6;
      
      const newWidth = Math.max(minWidth, Math.min(maxWidth, textBox.width + deltaX));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, textBox.height + deltaY));

      const textWidthPercent = (newWidth / containerBounds.width) * 100;
      const textHeightPercent = (newHeight / containerBounds.height) * 100;
      const adjustedX = Math.min(textBox.x, 100 - textWidthPercent);
      const adjustedY = Math.min(textBox.y, 100 - textHeightPercent);

      setDragStart({ x: e.clientX, y: e.clientY });

      throttledUpdate({
        ...event,
        textX: adjustedX,
        textY: adjustedY,
        textWidth: newWidth,
        textHeight: newHeight
      });
    }
  }, [isDragging, isResizing, dragStart, textBox, containerBounds, event, throttledUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleTextEdit = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.select();
    }, 0);
  }, []);

  const handleTextSave = useCallback(() => {
    setIsEditing(false);
    onUpdate({
      ...event,
      content: tempText,
      textContent: tempText
    });
  }, [event, tempText, onUpdate]);

  const handleTextCancel = useCallback(() => {
    setIsEditing(false);
    setTempText(textBox.content);
  }, [textBox.content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTextCancel();
    }
  }, [handleTextSave, handleTextCancel]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined; // Explicit return for else case
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (!containerBounds) return null;

  // Calculate position in pixels with bounds validation
  const leftPx = Math.max(0, Math.min(
    containerBounds.width - textBox.width, 
    (textBox.x / 100) * containerBounds.width
  ));
  const topPx = Math.max(0, Math.min(
    containerBounds.height - textBox.height, 
    (textBox.y / 100) * containerBounds.height
  ));

  return (
    <div
      ref={overlayRef}
      className="absolute border-2 border-green-500 bg-black/80 text-white rounded cursor-move"
      style={{
        left: leftPx,
        top: topPx,
        width: textBox.width,
        height: textBox.height,
        zIndex: Z_INDEX.PREVIEW_TEXT
      }}
      onMouseDown={(e) => !isEditing && handleMouseDown(e, 'drag')}
    >
      {/* Text type indicator */}
      <div className="absolute -top-8 left-0 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
        Text Overlay
      </div>
      
      {/* Text content area */}
      <div className="relative w-full h-full p-2 overflow-hidden">
        {isEditing ? (
          <textarea
            ref={textAreaRef}
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleTextSave}
            className="w-full h-full bg-transparent text-white resize-none border-none outline-none text-sm"
            placeholder="Enter your text here..."
            style={{ fontFamily: 'inherit' }}
          />
        ) : (
          <div
            className="w-full h-full text-sm leading-relaxed cursor-text overflow-auto"
            onClick={handleTextEdit}
            title="Double-click to edit text"
          >
            {textBox.content || 'Enter your text here...'}
          </div>
        )}
      </div>

      {/* Edit button */}
      {!isEditing && (
        <button
          className="absolute top-1 right-1 w-6 h-6 bg-green-500 text-white rounded text-xs hover:bg-green-400 transition-colors flex items-center justify-center"
          onClick={handleTextEdit}
          title="Edit text"
        >
          ✎
        </button>
      )}

      {/* Save/Cancel buttons when editing */}
      {isEditing && (
        <div className="absolute top-1 right-1 flex gap-1">
          <button
            className="w-6 h-6 bg-green-500 text-white rounded text-xs hover:bg-green-400 transition-colors flex items-center justify-center"
            onClick={handleTextSave}
            title="Save text (Enter)"
          >
            ✓
          </button>
          <button
            className="w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-400 transition-colors flex items-center justify-center"
            onClick={handleTextCancel}
            title="Cancel (Escape)"
          >
            ✕
          </button>
        </div>
      )}

      {/* Resize handle */}
      {!isEditing && (
        <div
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 border-2 border-white rounded cursor-nw-resize hover:bg-green-400 transition-colors"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
          title="Drag to resize text box"
        />
      )}
      
      {/* Corner indicators */}
      {!isEditing && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-500 border border-white rounded-full" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 border border-white rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-500 border border-white rounded-full" />
        </>
      )}
    </div>
  );
};

export default TextPreviewOverlay;