import { useState, useEffect } from 'react';

// Define the hook's interface
interface MobileLearningFlowProps {
  module: any; // Replace 'any' with a proper module type
  autoAdvance?: boolean;
}

export const useMobileLearningFlow = ({ module, autoAdvance = false }: MobileLearningFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const totalSteps = module?.timeline?.length || 0;

  useEffect(() => {
    if (autoAdvance) {
      const timer = setInterval(() => {
        if (currentStep < totalSteps - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsComplete(true);
        }
      }, 5000); // Auto-advance every 5 seconds

      return () => clearInterval(timer);
    }
  }, [autoAdvance, currentStep, totalSteps]);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return {
    currentStep,
    isComplete,
    nextStep,
    prevStep,
    progress: totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0,
  };
};
