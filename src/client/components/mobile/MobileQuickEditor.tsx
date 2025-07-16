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
  const [editedHotspot, setEditedHotspot] = React.useState(hotspot);

  // Sync with external changes to the hotspot prop
  React.useEffect(() => {
    setEditedHotspot(hotspot);
  }, [hotspot]);

  const handlePropertyChange = (updates: Partial<HotspotData>) => {
    setEditedHotspot(prev => ({ ...prev, ...updates }));
  };

  const handleDone = () => {
    onHotspotChange(editedHotspot);
    onClose();
  };

  return (
    <div className="mobile-quick-editor">
      <h2>Edit Hotspot</h2>
      <MobileTextEditor
        title={editedHotspot.title}
        description={editedHotspot.description}
        onTitleChange={(newTitle) => handlePropertyChange({ title: newTitle })}
        onDescriptionChange={(newDescription) => handlePropertyChange({ description: newDescription })}
      />
      <MobileColorPicker
        currentColor={editedHotspot.color}
        onColorChange={(newColor) => handlePropertyChange({ color: newColor })}
      />
      <button onClick={handleDone}>Done</button>
    </div>
  );
};

export default MobileQuickEditor;
