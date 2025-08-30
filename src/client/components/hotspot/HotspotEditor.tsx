import React, { useState, useCallback, useMemo } from 'react';
import { HotspotWalkthrough, WalkthroughHotspot } from '../../../shared/hotspotTypes';
import { EffectExecutor } from '../../utils/EffectExecutor';
import { reorderHotspots } from '../../utils/hotspotUtils';
import HotspotCanvas from './HotspotCanvas';
import HotspotPropertiesPanel from './HotspotPropertiesPanel';
import WalkthroughSequencer from './WalkthroughSequencer';

interface HotspotEditorProps {
  walkthrough: HotspotWalkthrough;
  onChange: (walkthrough: HotspotWalkthrough) => void;
  onSave: () => void;
  onPreview: () => void;
  effectExecutor: EffectExecutor;
}

export default function HotspotEditor({
  walkthrough,
  onChange,
  onSave,
  onPreview,
  effectExecutor
}: HotspotEditorProps) {
  
  const [selectedHotspot, setSelectedHotspot] = useState<WalkthroughHotspot | null>(null);
  const [showSequencer, setShowSequencer] = useState(false);
  
  const handleHotspotAdd = useCallback((hotspot: WalkthroughHotspot) => {
    const updated: HotspotWalkthrough = {
      ...walkthrough,
      hotspots: [...walkthrough.hotspots, hotspot],
      sequence: [...walkthrough.sequence, hotspot.id],
      updatedAt: Date.now()
    };
    onChange(updated);
    setSelectedHotspot(hotspot);
  }, [walkthrough, onChange]);
  
  const handleHotspotUpdate = useCallback((updatedHotspot: WalkthroughHotspot) => {
    const updated: HotspotWalkthrough = {
      ...walkthrough,
      hotspots: walkthrough.hotspots.map(h => 
        h.id === updatedHotspot.id ? updatedHotspot : h
      ),
      updatedAt: Date.now()
    };
    onChange(updated);
    setSelectedHotspot(updatedHotspot);
  }, [walkthrough, onChange]);
  
  const handleHotspotDelete = useCallback((hotspotId: string) => {
    const updated: HotspotWalkthrough = {
      ...walkthrough,
      hotspots: walkthrough.hotspots.filter(h => h.id !== hotspotId),
      sequence: walkthrough.sequence.filter(id => id !== hotspotId),
      updatedAt: Date.now()
    };
    onChange(updated);
    setSelectedHotspot(null);
  }, [walkthrough, onChange]);
  
  const handleSequenceChange = useCallback((newSequence: string[]) => {
    const updated = reorderHotspots(walkthrough, newSequence);
    onChange(updated);
  }, [walkthrough, onChange]);
  
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = {
      ...walkthrough,
      title: e.target.value,
      updatedAt: Date.now()
    };
    onChange(updated);
  }, [walkthrough, onChange]);
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <input
              type="text"
              value={walkthrough.title}
              onChange={handleTitleChange}
              className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:bg-gray-50 rounded px-2 py-1 min-w-0 flex-1"
              placeholder="Untitled Walkthrough"
            />
            <span className="text-sm text-gray-500 flex-shrink-0">
              {walkthrough.hotspots.length} hotspots
            </span>
          </div>
          
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => setShowSequencer(!showSequencer)}
              className={`px-4 py-2 rounded-md transition-colors font-medium ${
                showSequencer
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle sequence panel"
            >
              <span className="hidden sm:inline">Sequence</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            
            <button
              onClick={onPreview}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              disabled={walkthrough.hotspots.length === 0}
              title="Preview walkthrough"
            >
              <span className="hidden sm:inline">Preview</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              title="Save walkthrough"
            >
              <span className="hidden sm:inline">Save</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sequencer Panel (collapsible) */}
        {showSequencer && (
          <div className="w-80 flex-shrink-0">
            <WalkthroughSequencer
              walkthrough={walkthrough}
              selectedHotspot={selectedHotspot}
              onSequenceChange={handleSequenceChange}
              onHotspotSelect={setSelectedHotspot}
            />
          </div>
        )}
        
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
              <HotspotCanvas
                walkthrough={walkthrough}
                effectExecutor={effectExecutor}
                isEditorMode={true}
                onHotspotAdd={handleHotspotAdd}
                onHotspotUpdate={handleHotspotUpdate}
                onHotspotSelect={setSelectedHotspot}
              />
            </div>
          </div>
        </div>
        
        {/* Properties Panel */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <HotspotPropertiesPanel
            hotspot={selectedHotspot}
            onUpdate={handleHotspotUpdate}
            onDelete={handleHotspotDelete}
          />
        </div>
      </div>
      
      {/* Mobile Properties Modal */}
      {selectedHotspot && (
        <div className="lg:hidden">
          {/* Mobile overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div className="bg-white rounded-t-xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Edit Hotspot</h3>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4">
                <HotspotPropertiesPanel
                  hotspot={selectedHotspot}
                  onUpdate={handleHotspotUpdate}
                  onDelete={handleHotspotDelete}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}