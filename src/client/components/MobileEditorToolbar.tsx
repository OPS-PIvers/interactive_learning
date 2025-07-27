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
    <div className="mobile-bottom-toolbar">
      <button 
        onClick={onUndo} 
        disabled={!canUndo}
        title="Undo last action"
      >
        Undo
      </button>
      <button 
        onClick={onRedo} 
        disabled={!canRedo}
        title="Redo last action"
      >
        Redo
      </button>
      <button 
        onClick={onAddHotspot} 
        disabled={isPlacingHotspot}
        title={isPlacingHotspot ? "Tap on image to place hotspot" : "Add new hotspot"}
      >
        {isPlacingHotspot ? 'Placing...' : 'Add'}
      </button>
      <button 
        onClick={onSave} 
        disabled={isSaving}
        title="Save project"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default MobileEditorToolbar;
