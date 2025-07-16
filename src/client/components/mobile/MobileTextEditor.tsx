import React from 'react';

interface MobileTextEditorProps {
  title: string;
  description: string;
  onTitleChange: (newTitle: string) => void;
  onDescriptionChange: (newDescription: string) => void;
}

const MobileTextEditor: React.FC<MobileTextEditorProps> = ({ title, description, onTitleChange, onDescriptionChange }) => {
  return (
    <div className="mobile-text-editor">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Hotspot Title"
        aria-label="Hotspot Title"
      />
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Hotspot Description"
        aria-label="Hotspot Description"
      />
    </div>
  );
};

export default MobileTextEditor;
