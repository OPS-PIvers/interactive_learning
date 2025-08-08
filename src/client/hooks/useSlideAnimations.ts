import { useAnimationControls, AnimationDefinition } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';

export interface AnimationSequence {
  id: string;
  elementId: string;
  variant: string;
  delay: number;
  duration: number;
}

export interface SlideAnimationState {
  isPlaying: boolean;
  currentSequence: AnimationSequence | null;
  progress: number;
  hasCompleted: boolean;
}

/**
 * useSlideAnimations - Hook for managing slide animation state and sequencing
 */
export const useSlideAnimations = () => {
  const [animationState, setAnimationState] = useState<SlideAnimationState>({
    isPlaying: false,
    currentSequence: null,
    progress: 0,
    hasCompleted: false
  });

  const animationControls = useAnimationControls();
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationSequenceRef = useRef<AnimationSequence[]>([]);

  // Play a sequence of animations
  const playAnimationSequence = useCallback(async (sequences: AnimationSequence[]) => {
    animationSequenceRef.current = sequences;
    setAnimationState(prev => ({
      ...prev,
      isPlaying: true,
      progress: 0,
      hasCompleted: false
    }));

    for (let i = 0; i < sequences.length; i++) {
      const sequence = sequences[i];
      if (!sequence) continue;
      
      setAnimationState(prev => ({
        ...prev,
        currentSequence: sequence,
        progress: (i / sequences.length) * 100
      }));

      // Wait for delay before starting animation
      if (sequence.delay > 0) {
        await new Promise(resolve => {
          sequenceTimeoutRef.current = setTimeout(resolve, sequence.delay);
        });
      }

      // Trigger animation for specific element
      await animationControls.start({
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        transition: {
          duration: sequence.duration / 1000,
          ease: "easeInOut"
        }
      });
    }

    setAnimationState(prev => ({
      ...prev,
      isPlaying: false,
      currentSequence: null,
      progress: 100,
      hasCompleted: true
    }));
  }, [animationControls]);

  // Stop animation sequence
  const stopAnimationSequence = useCallback(() => {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }

    animationControls.stop();
    setAnimationState(prev => ({
      ...prev,
      isPlaying: false,
      currentSequence: null
    }));
  }, [animationControls]);

  // Reset animation state
  const resetAnimations = useCallback(() => {
    stopAnimationSequence();
    setAnimationState({
      isPlaying: false,
      currentSequence: null,
      progress: 0,
      hasCompleted: false
    });
  }, [stopAnimationSequence]);

  // Play single animation
  const playAnimation = useCallback(async (
    variant: string,
    duration: number = 300,
    delay: number = 0
  ) => {
    const sequence: AnimationSequence = {
      id: `single-${Date.now()}`,
      elementId: 'single',
      variant,
      delay,
      duration
    };

    await playAnimationSequence([sequence]);
  }, [playAnimationSequence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    animationState,
    animationControls,
    playAnimationSequence,
    stopAnimationSequence,
    resetAnimations,
    playAnimation
  };
};

/**
 * useElementAnimation - Hook for individual element animations
 */
export const useElementAnimation = (elementId: string) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimationControls();

  const show = useCallback(async (variant: string = 'fade', duration: number = 300) => {
    setIsAnimating(true);
    setIsVisible(true);

    await controls.start({
      opacity: 1,
      scale: 1,
      transition: {
        duration: duration / 1000,
        ease: "easeOut"
      }
    });

    setIsAnimating(false);
  }, [controls]);

  const hide = useCallback(async (duration: number = 300) => {
    setIsAnimating(true);

    await controls.start({
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: duration / 1000,
        ease: "easeIn"
      }
    });

    setIsVisible(false);
    setIsAnimating(false);
  }, [controls]);

  const animate = useCallback(async (animation: AnimationDefinition) => {
    setIsAnimating(true);
    await controls.start(animation);
    setIsAnimating(false);
  }, [controls]);

  return {
    isVisible,
    isAnimating,
    controls,
    show,
    hide,
    animate
  };
};

/**
 * useSequencedAnimations - Hook for managing multiple element animations in sequence
 */
export const useSequencedAnimations = () => {
  const [activeElements, setActiveElements] = useState<Set<string>>(new Set());
  const [sequenceProgress, setSequenceProgress] = useState(0);

  const animateElementsInSequence = useCallback(async (
    elementIds: string[],
    staggerDelay: number = 100
  ) => {
    setSequenceProgress(0);
    
    for (let i = 0; i < elementIds.length; i++) {
      const elementId = elementIds[i];
      if (!elementId) continue;
      
      setActiveElements(prev => new Set([...prev, elementId]));
      setSequenceProgress(((i + 1) / elementIds.length) * 100);
      
      if (i < elementIds.length - 1) {
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), staggerDelay);
        });
      }
    }
  }, []);

  const resetSequence = useCallback(() => {
    setActiveElements(new Set());
    setSequenceProgress(0);
  }, []);

  return {
    activeElements,
    sequenceProgress,
    animateElementsInSequence,
    resetSequence
  };
};

export default useSlideAnimations;