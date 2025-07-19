import React, { useState } from 'react';
import { TimelineEventData } from '../../../shared/types';

interface TimelineTemplatesModalProps {
  onClose: () => void;
  onSaveTemplate: (name: string) => void;
  onApplyTemplate: (template: TimelineEventData[]) => void;
  templates: { name: string; events: TimelineEventData[] }[];
}

const TimelineTemplatesModal: React.FC<TimelineTemplatesModalProps> = ({
  onClose,
  onSaveTemplate,
  onApplyTemplate,
  templates,
}) => {
  const [templateName, setTemplateName] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-4 w-11/12 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Timeline Templates</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="mb-4">
          <h4 className="text-white mb-2">Save Current Timeline as Template</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name"
              className="w-full bg-slate-700 text-white p-2 rounded"
            />
            <button
              onClick={() => {
                onSaveTemplate(templateName);
                setTemplateName('');
              }}
              disabled={!templateName}
              className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-white mb-2">Apply a Template</h4>
          <div className="space-y-2">
            {templates.map((template, index) => (
              <div
                key={index}
                className="bg-slate-700 p-2 rounded flex justify-between items-center"
              >
                <span className="text-white">{template.name}</span>
                <button
                  onClick={() => onApplyTemplate(template.events)}
                  className="bg-purple-600 text-white px-4 py-2 rounded"
                >
                  Apply
                </button>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-slate-400">No saved templates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineTemplatesModal;
