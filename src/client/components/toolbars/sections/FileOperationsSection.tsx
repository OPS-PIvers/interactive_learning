import React from 'react';
import { Icon } from '../../Icon';
import ToolbarButton from '../shared/ToolbarButton';
import ToolbarSeparator from '../shared/ToolbarSeparator';

interface FileOperationsSectionProps {
  projectName: string;
  onBack: () => void;
  onLivePreview: () => void;
}

const FileOperationsSection: React.FC<FileOperationsSectionProps> = ({
  projectName,
  onBack,
  onLivePreview,
}) => {
  return (
    <div className="flex items-center gap-2 md:gap-4 min-w-0">
      <ToolbarButton
        onClick={onLivePreview}
        aria-label="Open live preview of project"
      >
        <span className="text-sm md:text-base font-medium">Preview</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={onBack}
        aria-label="Go back to editing mode"
      >
        <Icon name="ChevronLeft" className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden md:inline text-sm md:text-base font-medium">Back</span>
      </ToolbarButton>

      <ToolbarSeparator />

      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-semibold text-white truncate">
          Editor Settings
        </h1>
        <p className="text-xs md:text-sm text-slate-300 truncate">
          {projectName}
        </p>
      </div>
    </div>
  );
};

export default FileOperationsSection;
