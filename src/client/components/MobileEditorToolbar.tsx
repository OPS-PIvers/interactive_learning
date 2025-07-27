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
      <button onClick={onUndo} disabled={!canUndo}>Undo</button>
      <button onClick={onRedo} disabled={!canRedo}>Redo</button>
      <button onClick={onAddHotspot} disabled={isPlacingHotspot}>
        {isPlacingHotspot ? 'Placing...' : 'Add Hotspot'}
      </button>
      <button onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default MobileEditorToolbar;
