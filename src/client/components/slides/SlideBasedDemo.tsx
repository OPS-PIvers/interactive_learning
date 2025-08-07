import React, { useState } from 'react';
import { createDemoSlideDeck, convertAIStudioToSlides } from './DemoSlideDeck';
import { SlideViewer } from './SlideViewer';
import '../../styles/slide-components.css';
import { ElementInteraction } from '../../../shared/slideTypes';

/**
 * SlideBasedDemo - Demonstration of the new slide-based architecture
 * 
 * This shows how fixed positioning eliminates coordinate alignment issues
 */
export const SlideBasedDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<'basic' | 'ai-studio'>('basic');
  const [slideDeck, setSlideDeck] = useState(() => createDemoSlideDeck());

  const handleSwitchDemo = (demoType: 'basic' | 'ai-studio') => {
    setCurrentDemo(demoType);
    
    if (demoType === 'basic') {
      setSlideDeck(createDemoSlideDeck());
    } else {
      // For AI Studio demo, we'd use the actual image URL
      // For now, using a placeholder
      setSlideDeck(convertAIStudioToSlides('/api/placeholder-image'));
    }
  };

  const handleSlideChange = (slideId: string, slideIndex: number) => {
    console.log(`Changed to slide: ${slideId} (index: ${slideIndex})`);
  };

  const handleInteraction = (interaction: ElementInteraction) => {
    console.log('User interaction:', interaction);
  };

  return (
    <div className="slide-based-demo w-full h-full flex flex-col">
      {/* Demo Controls - Matches app header styling */}
      <div className="demo-controls bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between flex-shrink-0 shadow-lg">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Slide-Based Architecture Demo
          </h2>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                currentDemo === 'basic' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
              }`}
              onClick={() => handleSwitchDemo('basic')}
            >
              Basic Demo
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                currentDemo === 'ai-studio' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
              }`}
              onClick={() => handleSwitchDemo('ai-studio')}
            >
              AI Studio Demo
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-sm">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 rounded-lg font-semibold shadow-lg">
            ✓ Fixed Positioning
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 rounded-lg font-semibold shadow-lg">
            ✓ Perfect Alignment
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 rounded-lg font-semibold shadow-lg">
            ✓ No Coordinate Calculations
          </div>
        </div>
      </div>

      {/* Slide Viewer */}
      <div className="slide-viewer-container flex-1 bg-slate-900">
        <SlideViewer
          slideDeck={slideDeck}
          onSlideChange={handleSlideChange}
          onInteraction={handleInteraction}
          className="w-full h-full"
        />
      </div>

      {/* Demo Info - Matches app info panel styling */}
      <div className="demo-info bg-slate-800 border-t border-slate-700 p-4 text-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h3 className="font-semibold mb-3 text-white">How This Solves the Coordinate Problem:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-red-400 mb-2">Old System Issues:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Complex percentage to pixel calculations</li>
                <li>Multiple coordinate system conversions</li>
                <li>CSS transform order complications</li>
                <li>Inconsistent bounds calculations</li>
                <li>Mobile/desktop positioning differences</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">New System Benefits:</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                <li>Fixed pixel positions for all elements</li>
                <li>Responsive breakpoints defined explicitly</li>
                <li>No coordinate calculations during runtime</li>
                <li>Perfect alignment guaranteed</li>
                <li>Easier debugging and maintenance</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <p className="text-slate-200">
              <strong className="text-purple-400">Try the interactions:</strong> Click the blue hotspot for spotlight effect, 
              click the purple hotspot for zoom effect. Notice how they're perfectly aligned 
              with their targets - no more coordinate calculation issues!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideBasedDemo;