import React, { useEffect, useRef } from 'react';
import { motion, Variants, usePresence } from 'framer-motion';
import styles from './Letter.module.css';

/**
 * Animation state types for the Letter component
 * - normal: Default state
 * - deletion: Letter is being removed (red)
 * - insertion: Letter is being added (green)
 * - movement: Letter is changing position (yellow)
 */
export type LetterAnimationState = 'normal' | 'deletion' | 'insertion' | 'movement';

/**
 * Props interface for the Letter component
 */
export interface LetterProps {
  /** The character to display */
  character: string;
  /** The current animation state of the letter */
  animationState: LetterAnimationState;
  /** Optional callback function triggered when animation completes */
  onAnimationComplete?: () => void;
  /** Optional initial index for position tracking in animations */
  initialIndex?: number;
  /** Optional CSS class name to add to the component */
  className?: string;
  /** Optional tabIndex for keyboard navigation */
  tabIndex?: number;
  /** Optional performance optimization flag */
  disableLayoutAnimation?: boolean;
}

// Animation durations - use 0 in test environment to speed up tests
const getDuration = (baseValue: number) => 
  process.env.NODE_ENV === 'test' ? 0 : baseValue;

/**
 * Animation variants for different letter states
 * Each variant defines the appearance and transition for a specific state
 */
const letterVariants: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: getDuration(0.3),
      ease: "easeInOut"
    }
  },
  deletion: {
    opacity: 0,
    scale: 0.8,
    y: 10,
    transition: {
      duration: getDuration(0.4),
      ease: "easeOut"
    }
  },
  insertion: {
    opacity: [0, 1, 1],
    scale: [1.3, 1.1, 1],
    y: [0, -5, 0],
    transition: {
      duration: getDuration(0.5),
      ease: "easeOut",
      times: [0, 0.6, 1]
    }
  },
  movement: {
    scale: [1, 1.1, 1],
    transition: {
      duration: getDuration(0.8),
      ease: [0.1, 2, 0.3, 1], // Matches the exaggerated cubic-bezier in CSS
      times: [0, 0.3, 1]
    }
  }
};

/**
 * Get the appropriate ARIA label for the current animation state
 * 
 * @param character - The character being displayed
 * @param state - The current animation state
 * @returns A descriptive label for screen readers
 */
const getAriaLabel = (character: string, state: LetterAnimationState): string => {
  switch (state) {
    case 'deletion':
      return `Letter ${character} being deleted`;
    case 'insertion':
      return `Letter ${character} being inserted`;
    case 'movement':
      return `Letter ${character} moving to new position`;
    default:
      return `Letter ${character}`;
  }
};

/**
 * Get ARIA live property based on animation state
 * 
 * @param state - The current animation state
 * @returns 'polite' for states that should be announced, 'off' for normal state
 */
const getAriaLive = (state: LetterAnimationState): 'off' | 'polite' => {
  // Use polite for state changes, off for normal state
  return state !== 'normal' ? 'polite' : 'off';
};

/**
 * A performance-optimized component that renders a single character with animations and accessibility features.
 * 
 * The Letter component handles animations for spelling visualization, including:
 * - Character additions (insertions)
 * - Character removals (deletions)
 * - Character movements
 * 
 * Features:
 * - Smooth Framer Motion animations with customizable durations
 * - Full ARIA support for screen readers
 * - Keyboard navigation with appropriate focus states
 * - Color-coding based on animation type (red/green/yellow)
 * - Support for reduced motion preferences
 * - Performance optimizations via memoization and cleanup
 * 
 * @example
 * // Basic usage
 * <Letter character="a" animationState="normal" />
 * 
 * @example
 * // Animating a deletion with callback
 * <Letter 
 *   character="b" 
 *   animationState="deletion"
 *   onAnimationComplete={() => console.log('Animation completed')}
 * />
 */
const Letter: React.FC<LetterProps> = ({
  character,
  animationState = 'normal',
  onAnimationComplete,
  initialIndex,
  className = '',
  tabIndex = 0,
  disableLayoutAnimation = false,
}) => {
  // Track component mount/unmount status for cleanup
  const [isPresent, safeToRemove] = usePresence();
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get accessibility attributes based on current state
  const ariaLabel = getAriaLabel(character, animationState);
  const ariaLive = getAriaLive(animationState);

  // Determine if the component should be focusable based on state
  // Deleted letters shouldn't remain in focus order once they're gone
  const effectiveTabIndex = animationState === 'deletion' ? -1 : tabIndex;

  // Clean up any animation timeouts when the component unmounts
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Call safeToRemove when the component is no longer present
      // This helps Framer Motion clean up properly
      if (!isPresent && safeToRemove) {
        safeToRemove();
      }
    };
  }, [isPresent, safeToRemove]);

  // Determine the outline color based on animation state
  const getOutlineColor = () => {
    switch (animationState) {
      case 'deletion': return '#ff5252';
      case 'insertion': return '#4caf50';
      case 'movement': return '#ffeb3b';
      default: return '#fff';
    }
  };

  return (
    <motion.span 
      className={`${styles.letter} ${styles[animationState]} ${className}`}
      data-testid="letter"
      data-state={animationState}
      data-index={initialIndex}
      initial="normal"
      animate={animationState}
      variants={letterVariants}
      onAnimationComplete={(definition) => {
        // Ensure we clean up any previous timeouts
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        
        // Call the callback if provided
        if (onAnimationComplete) {
          // Slightly delay the callback to ensure DOM updates are complete
          animationTimeoutRef.current = setTimeout(() => {
            onAnimationComplete();
          }, 0);
        }
      }}
      layout={!disableLayoutAnimation}
      
      // Accessibility attributes
      role="text"
      aria-label={ariaLabel}
      aria-live={ariaLive}
      aria-atomic="true"
      aria-relevant="text"
      tabIndex={effectiveTabIndex}
      aria-hidden={animationState === 'deletion'}
      style={{
        // Ensure focus outline matches the current state color
        outlineColor: getOutlineColor()
      }}
    >
      {character}
    </motion.span>
  );
};

/**
 * Memoized version of the Letter component to prevent unnecessary re-renders.
 * Only re-renders when props actually change, improving performance in lists.
 */
export default React.memo(Letter, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  // Return true if the component should NOT re-render
  return (
    prevProps.character === nextProps.character &&
    prevProps.animationState === nextProps.animationState &&
    prevProps.initialIndex === nextProps.initialIndex &&
    prevProps.className === nextProps.className &&
    prevProps.tabIndex === nextProps.tabIndex &&
    prevProps.disableLayoutAnimation === nextProps.disableLayoutAnimation &&
    // For callback props, only re-render if one exists and the other doesn't
    // We don't compare function references as they may change on each render
    !!prevProps.onAnimationComplete === !!nextProps.onAnimationComplete
  );
}); 