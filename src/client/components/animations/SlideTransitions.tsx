import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animation presets for slide transitions
export const slideTransitionVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  },
  slideDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  },
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  },
  flip: {
    initial: { rotateY: -90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: 90, opacity: 0 }
  },
  bounce: {
    initial: { scale: 0.3, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100
      }
    },
    exit: { scale: 0.3, opacity: 0 }
  }
};

// Transition configurations with timing and easing
export const transitionConfig = {
  default: { duration: 0.3, ease: "easeInOut" as any },
  fast: { duration: 0.15, ease: "easeInOut" as any },
  slow: { duration: 0.6, ease: "easeInOut" as any },
  spring: { type: "spring" as any, damping: 20, stiffness: 100 },
  bouncy: { type: "spring" as any, damping: 10, stiffness: 200 }
};

interface SlideTransitionProps {
  children: React.ReactNode;
  variant?: keyof typeof slideTransitionVariants;
  transition?: keyof typeof transitionConfig;
  className?: string;
}

/**
 * SlideTransition - Wrapper component for slide transition animations
 */
export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  variant = 'fade',
  transition = 'default',
  className = ''
}) => {
  const variants = slideTransitionVariants[variant];
  const transitionProps = transitionConfig[transition];

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transitionProps}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedSlideContainerProps {
  children: React.ReactNode;
  slideId: string;
  variant?: keyof typeof slideTransitionVariants;
  transition?: keyof typeof transitionConfig;
  className?: string;
}

/**
 * AnimatedSlideContainer - Container for animated slide content with key-based re-rendering
 */
export const AnimatedSlideContainer: React.FC<AnimatedSlideContainerProps> = ({
  children,
  slideId,
  variant = 'fade',
  transition = 'default',
  className = ''
}) => {
  return (
    <AnimatePresence mode="wait">
      <SlideTransition
        key={slideId}
        variant={variant}
        transition={transition}
        className={className}
      >
        {children}
      </SlideTransition>
    </AnimatePresence>
  );
};

export default SlideTransition;