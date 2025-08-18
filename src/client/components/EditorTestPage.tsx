import React, { useState, useCallback } from 'react';
import { SlideDeck, ThemePreset, ElementInteraction } from '../../shared/slideTypes';
import { createTestDemoSlideDeck } from '../../shared/testDemoSlideDeck';
import { InteractiveModuleState } from '../../shared/types';
import { Z_INDEX } from '../utils/zIndexLevels';
import { SlideViewer } from './slides/SlideViewer';
import { UnifiedSlideEditor } from './slides/UnifiedSlideEditor';


/**
 * Editor Test Page Component
 * 
 * Bypasses Firebase to test editor and viewer interfaces across all devices
 * Uses mock data and local state for testing purposes
 * 
 * Phase 3 Enhancement: Renamed from MobileEditorTest to reflect unified nature
 */
export const EditorTestPage: React.FC = () => {
  const [mode, setMode] = useState<'editor' | 'viewer'>('editor');
  const [slideDeck, setSlideDeck] = useState<SlideDeck>(() => createTestDemoSlideDeck());
  const [debugInfo, setDebugInfo] = useState({
    viewport: `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
    touchSupport: 'ontouchstart' in window ? 'Yes' : 'No',
    userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
  });

  const [projectName, setProjectName] = useState('Mobile Editor Test');
  const [projectTheme, setProjectTheme] = useState<ThemePreset>('professional');

  // Mock project data for editor
  const mockProject = {
    id: 'mobile-test-project',
    title: 'Mobile Editor Test',
    description: 'Testing mobile editor interface',
    created: Date.now(),
    modified: Date.now(),
    thumbnailUrl: '',
    isPublished: false,
    slideDeck: slideDeck,
    data: {
      backgroundImage: '',
      backgroundType: 'image' as const,
      hotspots: [],
      timelineEvents: [],
      imageFitMode: 'contain' as const,
      viewerModes: {
        explore: true,
        selfPaced: true,
        timed: false,
      },
    } as InteractiveModuleState
  };

  const handleProjectNameChange = useCallback((newName: string) => {
    setProjectName(newName);
  }, []);

  const handleProjectThemeChange = useCallback((newTheme: ThemePreset) => {
    setProjectTheme(newTheme);
  }, []);

  const handleSlideDeckChange = useCallback((newSlideDeck: SlideDeck) => {
    setSlideDeck(newSlideDeck);
    console.warn('📱 Mobile Test: Slide deck updated', newSlideDeck);
  }, []);

  const handleSave = useCallback(async (currentSlideDeck: SlideDeck) => {
    console.warn('📱 Mobile Test: Save requested', currentSlideDeck);
    setSlideDeck(currentSlideDeck);
    // Mock save - no actual Firebase calls
    return Promise.resolve();
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    console.warn('📱 Mobile Test: Image upload requested', file.name);
    // Mock upload - return a placeholder URL
    return Promise.resolve();
  }, []);

  const handleSlideChange = useCallback((slideId: string, slideIndex: number) => {
    console.warn('📱 Mobile Test: Slide changed', { slideId, slideIndex });
  }, []);

  const handleInteraction = useCallback((interaction: ElementInteraction) => {
    console.warn('📱 Mobile Test: Interaction triggered', interaction);
    
    // Visual feedback
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(16, 185, 129, 0.95);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      z-index: ${Z_INDEX.TOAST};
      font-family: system-ui;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: calc(100vw - 40px);
      word-wrap: break-word;
    `;
    notification.textContent = `✅ ${interaction.trigger || 'Interaction'} (ID: ${interaction.id})`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }, []);

  const refreshDebugInfo = () => {
    setDebugInfo({
      viewport: `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
      touchSupport: 'ontouchstart' in window ? 'Yes' : 'No',
      userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
    });
  };

  // Update debug info on resize
  React.useEffect(() => {
    const handleResize = () => refreshDebugInfo();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="mobile-editor-test min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header with mode switching and debug info */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-purple-400">
            📱 Mobile Editor Test
          </h1>
          <button
            onClick={() => window.location.href = '/'}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors">
            ← Back to App
          </button>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex space-x-2 mb-3">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              mode === 'editor' ?
              'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' :
              'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setMode('editor')}>
            ✏️ Editor Mode
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              mode === 'viewer' ?
              'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg' :
              'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setMode('viewer')}>
            👁️ Viewer Mode
          </button>
        </div>

        {/* Debug Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700/50 p-2 rounded">
            <span className="text-slate-400">Viewport:</span> {debugInfo.viewport}
          </div>
          <div className="bg-slate-700/50 p-2 rounded">
            <span className="text-slate-400">Device:</span> 
            <span className="debug-device-type ml-1" />
          </div>
          <div className="bg-slate-700/50 p-2 rounded">
            <span className="text-slate-400">Touch:</span> {debugInfo.touchSupport}
          </div>
          <div className="bg-slate-700/50 p-2 rounded">
            <span className="text-slate-400">Mode:</span> 
            <span className="text-blue-400">Phase 3 Complete</span>
          </div>
        </div>
        
        {/* Phase 3: CSS-only device detection styles */}
        <style>{`
          .debug-device-type::after {
            content: 'Desktop';
            color: #60a5fa;
          }
          
          @media (max-width: 1023px) {
            .debug-device-type::after { 
              content: 'Tablet'; 
              color: #34d399;
            }
          }
          
          @media (max-width: 767px) {
            .debug-device-type::after { 
              content: 'Mobile'; 
              color: #f59e0b;
            }
          }
        `}</style>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {mode === 'editor' ? (
          <div className="h-full">
            <UnifiedSlideEditor
              slideDeck={slideDeck}
              projectName={projectName}
              projectTheme={projectTheme}
              projectId={mockProject.id}
              onSlideDeckChange={handleSlideDeckChange}
              onProjectNameChange={handleProjectNameChange}
              onProjectThemeChange={handleProjectThemeChange}
              onSave={handleSave}
              onImageUpload={handleImageUpload}
              onClose={() => setMode('viewer')}
              isPublished={false}
            />
          </div>
        ) : (
          <div className="h-full">
            <SlideViewer
              slideDeck={slideDeck}
              onSlideChange={handleSlideChange}
              onInteraction={handleInteraction}
              className="w-full h-full"
              showTimeline={true}
              timelineAutoPlay={false}
            />
          </div>
        )}
      </div>

      {/* Footer with test info */}
      <div className="bg-slate-800 border-t border-slate-700 p-3 flex-shrink-0 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Mode:</span>
            <span className="text-green-400 font-medium">{mode}</span>
            <span className="text-slate-400">Slides:</span>
            <span className="text-blue-400">{slideDeck?.slides?.length || 0}</span>
          </div>
          <button
            onClick={refreshDebugInfo}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors">
            🔄 Refresh
          </button>
        </div>
        <div className="mt-2 text-slate-400">
          <strong className="text-yellow-400">Test Purpose:</strong> Mobile UX evaluation for editor and viewer interfaces
        </div>
      </div>
    </div>
  );
};

export default EditorTestPage;