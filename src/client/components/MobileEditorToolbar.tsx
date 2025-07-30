import React from 'react';
import { useMobileToolbar } from '../hooks/useMobileToolbar'; // Corrected import path

// Define a type for the component's props, including toolbar styling
interface MobileEditorToolbarProps {
  onAddHotspot: () => void;
  isPlacingHotspot: boolean;
  onSave: () => void;
  isSaving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isTimelineVisible?: boolean; // Make timeline visibility optional
}

const MobileEditorToolbar: React.FC<MobileEditorToolbarProps> = ({
  onAddHotspot,
  isPlacingHotspot,
  onSave,
  isSaving,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isTimelineVisible = false, // Default to false if not provided
}) => {
  // Use the centralized hook to get dynamic toolbar properties
  const { dimensions, positioning, isReady } = useMobileToolbar(isTimelineVisible);

  // Combine styles from the hook with base styles
  const toolbarStyle: React.CSSProperties = {
    ...positioning, // Apply dynamic positioning
    height: `${dimensions.toolbarHeight}px`,
    minHeight: `${dimensions.toolbarHeight}px`,
    background: '#1e293b',
    borderTop: '1px solid #334155',
    padding: '8px 16px',
    paddingBottom: positioning.paddingBottom,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: '12px',
    boxSizing: 'border-box',
    position: 'fixed',
    left: 0,
    right: 0,
    transition: 'transform 0.3s ease-out, height 0.3s ease-out, bottom 0.3s ease-out',
    opacity: isReady ? 1 : 0, // Prevent flash of unstyled content
  };

  return (
    <div 
      className="mobile-bottom-toolbar"
      style={toolbarStyle}
    >
      <button 
        onClick={onUndo} 
        disabled={!canUndo}
        title="Undo last action"
        className="mobile-toolbar-button"
        style={{
          background: '#334155',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
          minHeight: '36px',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: canUndo ? 1 : 0.5
        }}
      >
        Undo
      </button>
      <button 
        onClick={onRedo} 
        disabled={!canRedo}
        title="Redo last action"
        className="mobile-toolbar-button"
        style={{
          background: '#334155',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
          minHeight: '36px',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: canRedo ? 1 : 0.5
        }}
      >
        Redo
      </button>
      <button 
        onClick={onAddHotspot} 
        disabled={isPlacingHotspot}
        title={isPlacingHotspot ? "Tap on image to place hotspot" : "Add new hotspot"}
        className="mobile-toolbar-button"
        style={{
          background: isPlacingHotspot ? '#8b5cf6' : '#334155',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          cursor: isPlacingHotspot ? 'default' : 'pointer',
          transition: 'background-color 0.2s',
          minHeight: '36px',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: isPlacingHotspot ? 0.8 : 1
        }}
      >
        {isPlacingHotspot ? 'Placing...' : 'Add'}
      </button>
      <button 
        onClick={onSave} 
        disabled={isSaving}
        title="Save project"
        className="mobile-toolbar-button"
        style={{
          background: isSaving ? '#10b981' : '#334155',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          cursor: isSaving ? 'default' : 'pointer',
          transition: 'background-color 0.2s',
          minHeight: '36px',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: isSaving ? 0.8 : 1
        }}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default MobileEditorToolbar;
