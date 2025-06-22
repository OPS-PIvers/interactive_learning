import React from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

interface ViewerToolbarProps {
  projectName: string;
  onBack: () => void;
  moduleState: 'idle' | 'learning';
  onStartLearning: () => void;
  onStartExploring: () => void;
  hasContent: boolean;
  isMobile?: boolean;
}

const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  projectName,
  onBack,
  moduleState,
  onStartLearning,
  onStartExploring,
  hasContent
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50 h-14">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="h-6 w-px bg-slate-600" />
          
          <h1 className="text-lg font-semibold text-white truncate max-w-96">
            {projectName}
          </h1>
        </div>

        {/* Right Section - Mode Controls */}
        {hasContent && (
          <div className="flex items-center gap-3">
            <button
              onClick={onStartExploring}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                moduleState === 'idle' 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white'
              }`}
            >
              Explore Mode
            </button>
            <button
              onClick={onStartLearning}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                moduleState === 'learning' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white'
              }`}
            >
              Guided Tour
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerToolbar;