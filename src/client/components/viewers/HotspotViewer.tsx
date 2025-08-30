import React, { useState, useCallback, useMemo } from 'react';
import { HotspotWalkthrough, WalkthroughHotspot } from '../../../shared/hotspotTypes';
import { EffectExecutor } from '../../utils/EffectExecutor';
import HotspotCanvas from '../hotspot/HotspotCanvas';

interface HotspotViewerProps {
  walkthrough: HotspotWalkthrough;
  effectExecutor: EffectExecutor;
  onComplete?: () => void;
  onStepChange?: (step: number) => void;
}

export default function HotspotViewer({
  walkthrough,
  effectExecutor,
  onComplete,
  onStepChange
}: HotspotViewerProps) {
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set<number>());
  
  const orderedHotspots = useMemo(() => {
    return walkthrough.sequence
      .map(id => walkthrough.hotspots.find(h => h.id === id))
      .filter(Boolean) as WalkthroughHotspot[];
  }, [walkthrough]);
  
  const currentHotspot = orderedHotspots[currentStep];
  const isLastStep = currentStep === orderedHotspots.length - 1;
  
  const handleHotspotClick = useCallback((hotspot: WalkthroughHotspot) => {
    // Only allow clicking the current step hotspot
    if (hotspot.sequenceIndex !== currentStep) return;
    
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    // Move to next step or complete
    if (isLastStep) {
      onComplete?.();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  }, [currentStep, isLastStep, onComplete, onStepChange]);
  
  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete?.();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  }, [currentStep, isLastStep, onComplete, onStepChange]);
  
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  }, [currentStep, onStepChange]);
  
  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    onStepChange?.(0);
  }, [onStepChange]);

  const handleStepJump = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  }, [onStepChange]);
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              {walkthrough.title}
            </h1>
            {walkthrough.description && (
              <p className="text-gray-600 mt-1 truncate">
                {walkthrough.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Step {currentStep + 1} of {orderedHotspots.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / orderedHotspots.length) * 100}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              title="Reset to beginning"
            >
              Reset
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Current Step Info */}
        {currentHotspot && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-blue-900 truncate">
                  {currentHotspot.content.title}
                </h2>
                {currentHotspot.content.description && (
                  <p className="text-blue-700 mt-1">
                    {currentHotspot.content.description}
                  </p>
                )}
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-blue-600">
                  Click the highlighted hotspot to continue
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Canvas */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <HotspotCanvas
              walkthrough={walkthrough}
              effectExecutor={effectExecutor}
              isEditorMode={false}
              currentStep={currentStep}
              onHotspotSelect={handleHotspotClick}
            />
          </div>
        </div>
      </div>
      
      {/* Footer Navigation */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-gray-800 transition-colors font-medium"
            title="Go to previous step"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <div className="flex space-x-1">
            {orderedHotspots.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepJump(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  completedSteps.has(index)
                    ? 'bg-green-500'
                    : index === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Go to step ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            title={isLastStep ? 'Complete walkthrough' : 'Go to next step'}
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && (
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}