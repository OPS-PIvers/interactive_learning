import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { MobileSlider } from './MobileSlider';

interface MobileTextSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
}

const MobileTextSettings: React.FC<MobileTextSettingsProps> = ({ event, onUpdate }) => {
  const [textContent, setTextContent] = useState(event.textContent || '');

  useEffect(() => {
    setTextContent(event.textContent || '');
  }, [event.textContent]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
  };

  const handleTextBlur = () => {
    onUpdate({ ...event, textContent });
  };

  const handleUpdate = useCallback((field: keyof TimelineEventData, value: any) => {
    onUpdate({ ...event, [field]: value });
  }, [event, onUpdate]);

  const toggleStyle = (style: 'bold' | 'italic') => {
    // This is a simplified implementation. A real rich text editor would be more complex.
    // For now, we'll just wrap the text in markdown-like tags.
    const startTag = style === 'bold' ? '**' : '_';
    const endTag = style === 'bold' ? '**' : '_';
    const newText = `${startTag}${textContent}${endTag}`;
    setTextContent(newText);
    onUpdate({ ...event, textContent: newText });
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Text Content
        </label>
        <div className="flex items-center space-x-2 mb-2">
          <button onClick={() => toggleStyle('bold')} className="px-3 py-1 bg-slate-600 rounded-md text-white font-bold">B</button>
          <button onClick={() => toggleStyle('italic')} className="px-3 py-1 bg-slate-600 rounded-md text-white italic">I</button>
        </div>
        <textarea
          value={textContent}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          className="w-full h-32 p-2 bg-slate-700 text-white rounded-md resize-none"
          placeholder="Enter your text..."
        />
      </div>

      <MobileSlider
        label="Font Size"
        min={10}
        max={48}
        value={event.textHeight || 16}
        onChange={(value) => handleUpdate('textHeight', value)}
        unit="px"
      />

      <MobileSlider
        label="Modal Width"
        min={100}
        max={500}
        value={event.textWidth || 250}
        onChange={(value) => handleUpdate('textWidth', value)}
        unit="px"
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Text Alignment
        </label>
        <div className="flex space-x-2">
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => handleUpdate('textPosition', align)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                event.textPosition === align
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-600 text-gray-300'
              }`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MobileTextSettings;
