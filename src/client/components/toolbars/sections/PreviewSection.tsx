import React from 'react';
import ToolbarButton from '../shared/ToolbarButton';

interface PreviewSectionProps {
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({
  onSave,
  isSaving,
  showSuccessMessage,
}) => {
  return (
    <div className="flex items-center gap-3">
      <ToolbarButton
        onClick={onSave}
        disabled={isSaving}
        className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-all duration-200 ${
          isSaving
            ? 'bg-green-500 cursor-not-allowed'
            : showSuccessMessage
              ? 'bg-green-500'
              : 'bg-purple-600 hover:bg-purple-700'
        } text-white`}
      >
        {isSaving ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Saving...
          </>
        ) : showSuccessMessage ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Saved!
          </>
        ) : (
          'Save Changes'
        )}
      </ToolbarButton>
    </div>
  );
};

export default PreviewSection;
