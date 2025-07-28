import React from 'react';

interface MobileEditorToolbarProps {
  onAddHotspot: () => void;
  isPlacingHotspot: boolean;
  onSave: () => void;
  isSaving: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
}) => {
  return (
    <div 
      className="mobile-bottom-toolbar"
      style={{
        /* Ensure fixed positioning over content */
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        /* Background and styling */
        background: '#1e293b',
        borderTop: '1px solid #334155',
        /* Responsive padding with safe area awareness */
        padding: '8px 16px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        /* Layout */
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: '12px',
        /* Height management */
        height: 'var(--mobile-bottom-toolbar-height, 56px)',
        minHeight: 'var(--mobile-bottom-toolbar-height, 56px)',
        boxSizing: 'border-box'
      }}
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
