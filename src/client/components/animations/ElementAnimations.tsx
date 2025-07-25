import React from 'react';
import { motion, Variants } from 'framer-motion';

// Animation variants for slide elements
export const elementAnimationVariants: Record<string, Variants> = {
  spotlight: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  },
  zoom: {
    initial: { scale: 1, opacity: 0 },
    animate: { 
      scale: [1, 1.05, 1], 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    },
    exit: { 
      scale: 0.95, 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  },
  textReveal: {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    },
    exit: { 
      y: -20, 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  },
  slideIn: {
    initial: { x: -100, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 120
      }
    },
    exit: { 
      x: 100, 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  },
  popup: {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 150
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  glow: {
    animate: {
      boxShadow: [
        "0 0 0px rgba(59, 130, 246, 0)",
        "0 0 20px rgba(59, 130, 246, 0.6)",
        "0 0 0px rgba(59, 130, 246, 0)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

// Micro-interaction variants for element hover states
export const microInteractionVariants: Record<string, Variants> = {
  hover: {
    initial: { scale: 1 },
    whileHover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    whileTap: { scale: 0.95 }
  },
  subtle: {
    initial: { scale: 1, filter: "brightness(1)" },
    whileHover: { 
      scale: 1.02,
      filter: "brightness(1.1)",
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    whileTap: { scale: 0.98 }
  },
  lift: {
    initial: { y: 0, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
    whileHover: { 
      y: -2,
      boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    whileTap: { y: 0, scale: 0.98 }
  }
};

interface AnimatedElementProps {
  children: React.ReactNode;
  variant?: keyof typeof elementAnimationVariants;
  microInteraction?: keyof typeof microInteractionVariants;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  isVisible?: boolean;
}

/**
 * AnimatedElement - Wrapper for slide elements with advanced animations
 */
export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  variant = 'textReveal',
  microInteraction = 'hover',
  className = '',
  style = {},
  onClick,
  isVisible = true
}) => {
  const animationVariants = elementAnimationVariants[variant];
  const interactionVariants = microInteractionVariants[microInteraction];

  // Combine variants for comprehensive animation control
  const combinedVariants = {
    ...animationVariants,
    ...interactionVariants
  };

  return (
    <motion.div
      className={className}
      style={style}
      variants={combinedVariants}
      initial="initial"
      animate={isVisible ? "animate" : "initial"}
      exit="exit"
      whileHover="whileHover"
      whileTap="whileTap"
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

interface StaggeredAnimationProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  variant?: keyof typeof elementAnimationVariants;
  className?: string;
}

/**
 * StaggeredAnimation - Container for staggered element animations
 */
export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  staggerDelay = 0.1,
  variant = 'textReveal',
  className = ''
}) => {
  const containerVariants: Variants = {
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  const itemVariants = elementAnimationVariants[variant];

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedElement;