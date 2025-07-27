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
  onGenerateQrCode?: () => void;
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
  onGenerateQrCode,
  // Destructure viewerModes with a default value
  viewerModes = { explore: true, selfPaced: true, timed: true }
}) => {
  // ALL HOOKS MUST BE DECLARED HERE FIRST (if any exist)
  // Currently ViewerToolbar doesn't use hooks, but if it did:
  // const [state, setState] = useState();
  // useEffect(() => {}, []);

  // THEN do conditional rendering WITHOUT early returns
  const content = isMobile ? (
    // Mobile layout - matches SlideBasedEditor styling
    <div className="bg-slate-800 border-b border-slate-700 text-white shadow-2xl">
      {/* Top row: Back, Title, Mode Toggle */}
      <div className="px-3 py-2 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-700"
          aria-label="Back to projects"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 flex-1 justify-center">
          <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 truncate max-w-[150px]">
            {projectName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {hasContent && (
            <>
              {viewerModes.explore && (
                <button
                  onClick={onStartExploring}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                    moduleState === 'idle'
                      ? 'bg-sky-500 text-white hover:bg-sky-600'
                      : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                  }`}
                >
                  Explore
                </button>
              )}
              {(viewerModes.selfPaced || viewerModes.timed) && (
                <button
                  onClick={onStartLearning}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                    moduleState === 'learning'
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                  }`}
                >
                  Tour
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom row: Auth button */}
      <div className="px-3 py-2 flex items-center justify-end border-t border-slate-700">
        <AuthButton variant="compact" />
      </div>
    </div>
  ) : (
    // Desktop layout
    <div className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 z-50 h-16 shadow-lg" style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)', minHeight: 'calc(64px + env(safe-area-inset-top))' }}>
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
          
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 truncate max-w-md xl:max-w-lg">
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
              {onGenerateQrCode && (
                <button
                  onClick={onGenerateQrCode}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500"
                  aria-label="Continue on another device"
                >
                  Sync
                </button>
              )}
            </div>
          )}
          <AuthButton variant="toolbar" />
        </div>
      </div>
    </div>
  );

  return content;
};

export default ViewerToolbar;