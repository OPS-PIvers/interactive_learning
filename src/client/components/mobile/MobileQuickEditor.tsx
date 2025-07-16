import React from 'react';
import { HotspotData } from '../../../shared/types';
import MobileTextEditor from './MobileTextEditor';
import MobileColorPicker from './MobileColorPicker';

interface MobileQuickEditorProps {
  hotspot: HotspotData;
  onHotspotChange: (newHotspot: HotspotData) => void;
  onClose: () => void;
}

const MobileQuickEditor: React.FC<MobileQuickEditorProps> = ({ hotspot, onHotspotChange, onClose }) => {
  return (
    <div className="mobile-quick-editor">
      <h2>Edit Hotspot</h2>
      <MobileTextEditor
        title={hotspot.title}
        description={hotspot.description}
        onTitleChange={(newTitle) => onHotspotChange({ ...hotspot, title: newTitle })}
        onDescriptionChange={(newDescription) => onHotspotChange({ ...hotspot, description: newDescription })}
      />
      <MobileColorPicker
        currentColor={hotspot.color}
        onColorChange={(newColor) => onHotspotChange({ ...hotspot, color: newColor })}
      />
      <button onClick={onClose}>Done</button>
    </div>
  );
};

export default MobileQuickEditor;
