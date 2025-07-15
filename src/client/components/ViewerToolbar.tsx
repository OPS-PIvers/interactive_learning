import React from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import AuthButton from './AuthButton';

interface ViewerToolbarProps {
  projectName: string;
  onBack: () => void;
  moduleState: 'idle' | 'learning';
  onStartLearning: () => void;
  onStartExploring: () => void;
  hasContent: boolean;
  isMobile?: boolean;
  viewerModes?: { // Added viewerModes
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
}

const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  projectName,
  onBack,
  moduleState,
  onStartLearning,
  onStartExploring,
  hasContent,
  isMobile,
  // Destructure viewerModes with a default value
  viewerModes = { explore: true, selfPaced: true, timed: true }
}) => {
  if (isMobile) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700 z-50 flex flex-col justify-center shadow-md sticky top-0">
        {/* Main Toolbar Row */}
        <div className="flex items-center justify-between px-2 h-12"> {/* Reduced height and padding for mobile */}
          {/* Left Section - Back Button and Project Name */}
          <div className="flex items-center gap-1 overflow-hidden"> {/* Reduced gap */}
            <button
              onClick={onBack}
              className="p-2 text-slate-200 hover:text-white active:bg-slate-700 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Back to projects"
            >
              <ChevronLeftIcon className="w-5 h-5 flex-shrink-0" /> {/* Slightly smaller icon */}
            </button>
            <h1 className="text-sm font-semibold text-slate-100 truncate pr-1"> {/* Smaller text, pr for spacing from buttons */}
              {projectName}
            </h1>
          </div>

          {/* Right Section - Mode Controls & Auth */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasContent && (
              <div className="flex items-center gap-1.5"> {/* Reduced gap */}
                {viewerModes.explore && (
                  <button
                    onClick={onStartExploring}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-slate-800 focus:ring-sky-400 whitespace-nowrap ${
                      moduleState === 'idle'
                        ? 'bg-sky-500 text-white shadow-sm hover:bg-sky-400 active:bg-sky-600'
                        : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white active:bg-slate-500'
                    }`}
                  >
                    Explore
                  </button>
                )}
                {(viewerModes.selfPaced || viewerModes.timed) && (
                  <button
                    onClick={onStartLearning}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-slate-800 focus:ring-purple-400 whitespace-nowrap ${
                      moduleState === 'learning'
                        ? 'bg-purple-500 text-white shadow-sm hover:bg-purple-400 active:bg-purple-600'
                        : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white active:bg-slate-500'
                    }`}
                  >
                    Tour
                  </button>
                )}
              </div>
            )}
            <AuthButton variant="compact" />
          </div>
        </div>
        {/* Conditional Message for Learning Mode */}
        {moduleState === 'learning' && (
           <div className="px-3 pb-2 text-center bg-slate-700/30"> {/* Adjusted padding and added subtle background */}
             <p className="text-xs text-sky-300">Using timeline to navigate tour steps.</p> {/* More prominent text color */}
          </div>
        )}
      </div>
    );
  }

  // Default Desktop Toolbar
  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 z-50 h-16 shadow-lg">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md px-2 py-1 -ml-2"
            aria-label="Back to projects"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          
          <div className="h-6 w-px bg-slate-600" />
          
          <h1 className="text-xl font-semibold text-slate-100 truncate max-w-md xl:max-w-lg">
            {projectName}
          </h1>
        </div>

        {/* Right Section - Mode Controls & Auth */}
        <div className="flex items-center gap-3">
          {hasContent && (
            <div className="flex items-center gap-3">
              {viewerModes.explore && (
                <button
                  onClick={onStartExploring}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 ${
                    moduleState === 'idle' 
                      ? 'bg-sky-500 text-white shadow-md hover:bg-sky-400'
                      : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white'
                  }`}
                >
                  Explore Mode
                </button>
              )}
              {(viewerModes.selfPaced || viewerModes.timed) && (
                <button
                  onClick={onStartLearning}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${
                    moduleState === 'learning' 
                      ? 'bg-purple-500 text-white shadow-md hover:bg-purple-400'
                      : 'bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white'
                  }`}
                >
                  Guided Tour
                </button>
              )}
            </div>
          )}
          <AuthButton variant="toolbar" />
        </div>
      </div>
    </div>
  );
};

export default ViewerToolbar;