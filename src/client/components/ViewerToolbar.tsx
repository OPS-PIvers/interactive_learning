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
  hasContent,
  isMobile
}) => {
  if (isMobile) {
    return (
      <div className="bg-slate-800 border-b border-slate-700 z-50 h-16 flex flex-col justify-center">
        <div className="flex items-center justify-between px-3 h-full">
          {/* Left Section - Back Button and Project Name */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 text-slate-300 hover:text-white transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Back"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-base font-medium text-white truncate">
              {projectName}
            </h1>
          </div>

          {/* Right Section - Mode Controls */}
          {hasContent && (
            <div className="flex items-center gap-2">
              <button
                onClick={onStartExploring}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  moduleState === 'idle'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white'
                }`}
              >
                Explore
              </button>
              <button
                onClick={onStartLearning}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  moduleState === 'learning'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white'
                }`}
              >
                Tour
              </button>
            </div>
          )}
        </div>
        {moduleState === 'learning' && (
           <div className="px-3 pb-1 pt-0.5 text-center">
            <p className="text-xs text-slate-400">Use timeline below to navigate steps</p>
          </div>
        )}
      </div>
    );
  }

  // Default Desktop Toolbar
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