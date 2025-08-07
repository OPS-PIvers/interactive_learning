import React, { useState } from 'react';
import { SlideBasedDemo } from './slides/SlideBasedDemo';

/**
 * SlideBasedTestPage - Test page for the new slide-based architecture
 * 
 * This can be accessed via a special route to test the new system
 * alongside the existing one for comparison
 */
export const SlideBasedTestPage: React.FC = () => {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="slide-based-test-page w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header - Matches app header styling */}
      <div className="test-header bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between flex-shrink-0 shadow-2xl">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Slide-Based Architecture Test
          </h1>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
            EXPERIMENTAL
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            className="slide-nav-button slide-nav-button-primary"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? 'Hide' : 'Show'} Comparison
          </button>
          
          <button
            className="slide-nav-button slide-nav-button-secondary"
            onClick={() => window.location.href = '/'}
          >
            Back to App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="test-content flex-1 flex">
        {/* Slide Demo */}
        <div className={`slide-demo-panel ${showComparison ? 'w-1/2' : 'w-full'} h-full`}>
          <SlideBasedDemo />
        </div>

        {/* Comparison Panel - Matches app modal styling */}
        {showComparison && (
          <div className="comparison-panel w-1/2 h-full bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl">
            <div className="comparison-header bg-slate-700 p-4 border-b border-slate-600">
              <h3 className="font-semibold text-red-400">Current System Issues</h3>
              <p className="text-sm text-slate-300 mt-1">
                Screenshots showing coordinate alignment problems
              </p>
            </div>
            
            <div className="comparison-content flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Problem Screenshots - Matches app card styling */}
              <div className="problem-example">
                <h4 className="font-semibold mb-2 text-white">Spotlight Misalignment</h4>
                <div className="bg-slate-700 p-4 rounded-xl border border-red-500 border-opacity-50">
                  <p className="text-sm text-slate-300 mb-2">
                    Old system: Spotlight appears offset from hotspot position
                  </p>
                  <div className="relative bg-slate-600 h-32 rounded-lg">
                    <div className="absolute top-4 left-4 w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
                    <div className="absolute top-8 left-12 w-16 h-16 bg-red-400 bg-opacity-30 rounded-full border-2 border-red-500" />
                    <span className="absolute top-20 left-16 text-xs text-red-400 font-semibold">❌ Misaligned</span>
                  </div>
                </div>
              </div>
              
              <div className="problem-example">
                <h4 className="font-semibold mb-2 text-white">Pan/Zoom Off-Center</h4>
                <div className="bg-slate-700 p-4 rounded-xl border border-red-500 border-opacity-50">
                  <p className="text-sm text-slate-300 mb-2">
                    Old system: Hotspot appears in corner instead of center
                  </p>
                  <div className="relative bg-slate-600 h-32 rounded-lg">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-purple-500 rounded-full shadow-lg" />
                    <span className="absolute top-8 left-2 text-xs text-red-400 font-semibold">❌ Wrong position</span>
                    <div className="absolute bottom-4 right-4 text-xs text-slate-400">Should be centered</div>
                  </div>
                </div>
              </div>

              <div className="solution-example">
                <h4 className="font-semibold mb-2 text-green-400">Slide-Based Solution</h4>
                <div className="bg-slate-700 p-4 rounded-xl border border-green-500 border-opacity-50">
                  <p className="text-sm text-slate-300 mb-2">
                    New system: Perfect alignment with fixed positioning
                  </p>
                  <div className="relative bg-slate-600 h-32 rounded-lg">
                    <div className="absolute top-8 left-8 w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
                    <div className="absolute top-4 left-4 w-8 h-8 bg-green-400 bg-opacity-30 rounded-full border-2 border-green-500" />
                    <span className="absolute top-16 left-12 text-xs text-green-400 font-semibold">✅ Perfect alignment</span>
                  </div>
                </div>
              </div>

              <div className="technical-details mt-6">
                <h4 className="font-semibold mb-2 text-white">Technical Improvements</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span className="text-slate-300">Fixed pixel positions eliminate calculation errors</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span className="text-slate-300">Responsive breakpoints defined explicitly</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span className="text-slate-300">No CSS transform order complications</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span className="text-slate-300">Consistent behavior across all devices</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 font-bold">✓</span>
                    <span className="text-slate-300">Easier debugging and maintenance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Matches app footer styling */}
      <div className="test-footer bg-slate-800 border-t border-slate-700 text-slate-400 p-3 text-xs text-center flex-shrink-0">
        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold">
          Slide-Based Architecture
        </span>
        <span className="mx-2">•</span>
        Fixed Positioning
        <span className="mx-2">•</span>
        No Coordinate Calculations
        <span className="mx-2">•</span>
        Perfect Alignment
      </div>
    </div>
  );
};

export default SlideBasedTestPage;