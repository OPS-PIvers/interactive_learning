import React, { useState, useCallback } from 'react';
import { InteractionType } from '../../shared/InteractionPresets';
import { migrateProjectToSlides, validateMigration, MigrationResult } from '../../shared/migrationUtils';
import { InteractiveModuleState, HotspotData, TimelineEventData } from '../../shared/types';
import { SlideViewer } from './slides/SlideViewer';

/**
 * MigrationTestPage - Test page for demonstrating project migration from hotspot to slide format
 * 
 * Shows before/after comparison and validates migration results
 */
export const MigrationTestPage: React.FC = () => {
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Create sample hotspot-based project for testing
  const createSampleProject = useCallback((): InteractiveModuleState => {
    const hotspots: HotspotData[] = [
    {
      id: 'hotspot_1',
      x: 25,
      y: 30,
      title: 'Sample Hotspot 1',
      description: 'This hotspot demonstrates spotlight functionality',
      color: 'bg-blue-500',
      size: 'medium'
    },
    {
      id: 'hotspot_2',
      x: 70,
      y: 60,
      title: 'Sample Hotspot 2',
      description: 'This hotspot demonstrates pan/zoom functionality',
      color: 'bg-purple-500',
      size: 'large'
    },
    {
      id: 'hotspot_3',
      x: 50,
      y: 80,
      title: 'Sample Hotspot 3',
      description: 'This hotspot demonstrates text display',
      color: 'bg-green-500',
      size: 'small'
    }];


    const timelineEvents: TimelineEventData[] = [
    {
      id: 'event_1',
      step: 1,
      name: 'Spotlight Demo',
      type: InteractionType.SPOTLIGHT,
      targetId: 'hotspot_1',
      duration: 3000,
      spotlightShape: 'circle',
      spotlightWidth: 120,
      spotlightHeight: 120,
      backgroundDimPercentage: 75
    },
    {
      id: 'event_2',
      step: 2,
      name: 'Pan Zoom Demo',
      type: InteractionType.PAN_ZOOM,
      targetId: 'hotspot_2',
      duration: 2500,
      zoomLevel: 2.5,
      smooth: true
    },
    {
      id: 'event_3',
      step: 3,
      name: 'Text Display Demo',
      type: InteractionType.SHOW_TEXT,
      targetId: 'hotspot_3',
      duration: 4000,
      textContent: 'This is a sample text overlay that demonstrates how text events are migrated to the new slide format.',
      textPosition: 'center'
    }];


    return {
      backgroundImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      hotspots,
      timelineEvents,
      imageFitMode: 'cover',
      viewerModes: {
        explore: true,
        selfPaced: true,
        timed: false
      }
    };
  }, []);

  // Perform migration
  const handleMigration = useCallback(() => {
    const sampleProject = createSampleProject();
    const result = migrateProjectToSlides(
      sampleProject,
      'Sample Migration Test Project',
      {
        preserveHotspotIds: true,
        canvasWidth: 1200,
        canvasHeight: 800,
        defaultSlideTitle: 'Migrated Interactive Slide'
      }
    );

    setMigrationResult(result);

  }, [createSampleProject]);

  // Clear migration and start over
  const handleReset = useCallback(() => {
    setMigrationResult(null);
    setShowViewer(false);
  }, []);

  // Show slide viewer with migrated content
  const handleShowViewer = useCallback(() => {
    setShowViewer(true);
  }, []);

  const validation = migrationResult ? validateMigration(migrationResult) : null;

  return (
    <div className="migration-test-page w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="test-header bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Migration Test - Hotspot to Slide Conversion
          </h1>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
            MIGRATION TOOL
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            className="slide-nav-button slide-nav-button-secondary"
            onClick={() => window.location.href = '/'}>

            Back to App
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6">
        {!migrationResult ? (
        /* Migration Setup */
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                Project Migration Tool
              </h2>
              <p className="text-slate-300 mb-8">
                This tool demonstrates how existing hotspot-based projects can be automatically
                converted to the new slide-based architecture. Click below to migrate a sample
                project and see the results.
              </p>
              
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Sample Project Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">3</div>
                    <div className="text-slate-400">Hotspots</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">3</div>
                    <div className="text-slate-400">Timeline Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">1</div>
                    <div className="text-slate-400">Background Image</div>
                  </div>
                </div>
              </div>
              
              <button
              className="slide-nav-button slide-nav-button-primary px-8 py-4 text-lg"
              onClick={handleMigration}>

                Start Migration
              </button>
            </div>
          </div>) : (

        /* Migration Results */
        <div className="flex-1 flex flex-col space-y-6">
            {/* Results Header */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Migration Results</h2>
                <div className="flex space-x-3">
                  <button
                  className="slide-nav-button slide-nav-button-primary"
                  onClick={handleShowViewer}
                  disabled={showViewer}>

                    {showViewer ? 'Viewing Slide' : 'View Migrated Slide'}
                  </button>
                  <button
                  className="slide-nav-button slide-nav-button-secondary"
                  onClick={handleReset}>

                    Reset
                  </button>
                </div>
              </div>
              
              {/* Migration Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{migrationResult?.slideDeck?.slides?.length}</div>
                  <div className="text-slate-400 text-sm">Slides Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{migrationResult?.elementsConverted}</div>
                  <div className="text-slate-400 text-sm">Elements Converted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{migrationResult?.interactionsConverted}</div>
                  <div className="text-slate-400 text-sm">Interactions Converted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{migrationResult?.warnings?.length}</div>
                  <div className="text-slate-400 text-sm">Warnings</div>
                </div>
              </div>

              {/* Validation Status */}
              {validation &&
            <div className={`p-4 rounded-lg ${validation.isValid ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className={`font-semibold mb-2 ${validation.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {validation.isValid ? '✅ Migration Successful' : '❌ Migration Issues Found'}
                  </div>
                  
                  {validation.errors.length > 0 &&
              <div className="mb-2">
                      <div className="text-red-400 font-medium text-sm mb-1">Errors:</div>
                      <ul className="text-red-300 text-sm space-y-1">
                        {validation.errors.map((error, index) =>
                  <li key={`error-${index}`}>• {error}</li>
                  )}
                      </ul>
                    </div>
              }
                  
                  {validation.recommendations.length > 0 &&
              <div>
                      <div className="text-yellow-400 font-medium text-sm mb-1">Recommendations:</div>
                      <ul className="text-yellow-300 text-sm space-y-1">
                        {validation.recommendations.map((rec, index) =>
                  <li key={`rec-${index}`}>• {rec}</li>
                  )}
                      </ul>
                    </div>
              }
                </div>
            }
            </div>

            {/* Warnings */}
            {migrationResult.warnings.length > 0 &&
          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">Migration Warnings</h3>
                <ul className="text-slate-300 space-y-2">
                  {migrationResult.warnings.map((warning, index) =>
              <li key={`warning-${index}`} className="flex items-start space-x-2">
                      <span className="text-yellow-400 font-bold">⚠</span>
                      <span className="text-sm">{warning}</span>
                    </li>
              )}
                </ul>
              </div>
          }

            {/* Slide Viewer */}
            {showViewer &&
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <SlideViewer
              slideDeck={migrationResult.slideDeck}
              onSlideChange={(_slideId, _slideIndex) => {

              }}
              onInteraction={(_interaction) => {

              }}
              className="w-full h-full" />

              </div>
          }
          </div>)
        }
      </div>

      {/* Footer */}
      <div className="test-footer bg-slate-800 border-t border-slate-700 text-slate-400 p-3 text-xs text-center">
        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold">
          Migration Tool
        </span>
        <span className="mx-2">•</span>
        Hotspot to Slide Conversion
        <span className="mx-2">•</span>
        Preserves All Interactions
        <span className="mx-2">•</span>
        Perfect Positioning
      </div>
    </div>);

};

export default MigrationTestPage;