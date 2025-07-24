import React, { useState } from 'react';
import { SlideEditor } from './slides/SlideEditor';
import { createDemoSlideDeck } from './slides/DemoSlideDeck';
import { SlideDeck } from '../../shared/slideTypes';

/**
 * SlideEditorTestPage - Test page for the slide editor interface
 * 
 * Demonstrates the visual drag-and-drop editing capabilities
 */
export const SlideEditorTestPage: React.FC = () => {
  const [slideDeck, setSlideDeck] = useState<SlideDeck>(() => createDemoSlideDeck());
  const [showEditor, setShowEditor] = useState(true);

  const handleSlideDeckChange = (newSlideDeck: SlideDeck) => {
    setSlideDeck(newSlideDeck);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  const handleOpenEditor = () => {
    setShowEditor(true);
  };

  if (!showEditor) {
    return (
      <div className="slide-editor-test-page w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Header */}
        <div className="test-header bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Slide Editor Test - Closed
            </h1>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
              EDITOR SAVED
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              className="slide-nav-button slide-nav-button-primary"
              onClick={handleOpenEditor}
            >
              Reopen Editor
            </button>
            
            <button
              className="slide-nav-button slide-nav-button-secondary"
              onClick={() => window.location.href = '/'}
            >
              Back to App
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Slide Editor Closed
            </h2>
            <p className="text-slate-300 mb-6">
              The slide editor has been closed. Your changes have been saved to the slide deck.
              You can reopen the editor to continue editing or return to the main app.
            </p>
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Slide Deck Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{slideDeck.slides.length}</div>
                  <div className="text-slate-400">Total Slides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {slideDeck.slides.reduce((total, slide) => total + slide.elements.length, 0)}
                  </div>
                  <div className="text-slate-400">Total Elements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {slideDeck.slides.reduce((total, slide) => 
                      total + slide.elements.reduce((elemTotal, elem) => elemTotal + elem.interactions.length, 0), 0
                    )}
                  </div>
                  <div className="text-slate-400">Total Interactions</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                className="slide-nav-button slide-nav-button-primary px-6 py-3"
                onClick={handleOpenEditor}
              >
                Continue Editing
              </button>
              <button
                className="slide-nav-button slide-nav-button-secondary px-6 py-3"
                onClick={() => window.location.href = '/slide-test'}
              >
                Test Slide Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-editor-test-page w-screen h-screen">
      <SlideEditor
        slideDeck={slideDeck}
        onSlideDeckChange={handleSlideDeckChange}
        onClose={handleCloseEditor}
        className="w-full h-full"
      />
    </div>
  );
};

export default SlideEditorTestPage;