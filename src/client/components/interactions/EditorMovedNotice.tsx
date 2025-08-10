import React from 'react';

interface EditorMovedNoticeProps {
  interactionType: string;
  onGoBack: () => void;
}

const EditorMovedNotice: React.FC<EditorMovedNoticeProps> = ({
  interactionType,
  onGoBack,
}) => {
  return (
    <div className="text-center p-4 text-slate-400">
      <p className="font-bold">{interactionType} editing has moved!</p>
      <p className="text-sm mt-2">
        To edit {interactionType.toLowerCase()}, please use the &quot;Interactions&quot; section of the main properties panel for this element.
      </p>
      <button
        onClick={onGoBack}
        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
};

export default EditorMovedNotice;