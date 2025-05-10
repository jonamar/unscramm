import React, { useEffect, useRef, memo } from 'react';
import { motion, Variants, usePresence, useReducedMotion } from 'framer-motion';
import styles from './Letter.module.css';

/**
 * Animation state types for the Letter component
 * - normal: Default state
 * - deletion: Letter is being removed (red)
 * - insertion: Letter is being added (green)
 * - movement: Letter is changing position (yellow)
 * - exiting: Letter is being removed from the DOM with animation
 */
export type LetterAnimationState = 'normal' | 'deletion' | 'insertion' | 'movement' | 'exiting';

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

/**
 * Creates animation variants with appropriate timings, adjusting for test environment
 * and user's reduced motion preferences
 * 
 * @param shouldReduceMotion - Whether animations should be reduced/disabled
 * @returns Animation variants object for Framer Motion
 */
const createLetterVariants = (shouldReduceMotion: boolean): Variants => {
  // Use minimal duration when in test environment or when user prefers reduced motion
  const getDuration = (baseValue: number) => 
    shouldReduceMotion || process.env.NODE_ENV === 'test' ? 0.001 : baseValue;

  return {
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
      scale: shouldReduceMotion ? 1 : [1, 0.8],
      y: shouldReduceMotion ? 0 : [0, 10],
      transition: {
        duration: getDuration(0.4),
        ease: "easeOut",
        times: shouldReduceMotion ? [0, 1] : [0, 1]
      }
    },
    insertion: {
      opacity: shouldReduceMotion ? [0, 1] : [0, 1, 1],
      scale: shouldReduceMotion ? 1 : [1.3, 1.1, 1],
      y: shouldReduceMotion ? 0 : [0, -5, 0],
      transition: {
        duration: getDuration(0.5),
        ease: "easeOut",
        times: shouldReduceMotion ? [0, 1] : [0, 0.6, 1],
        // Add a slight bounce for insertions
        bounce: 0.2
      }
    },
    movement: {
      scale: shouldReduceMotion ? 1 : [1, 1.1, 1],
      // Enhanced animation for movement
      transition: {
        duration: getDuration(0.8),
        // Use an exaggerated bounce effect
        ease: shouldReduceMotion ? "easeOut" : [0.1, 2.3, 0.36, 1.2], 
        times: shouldReduceMotion ? [0, 1] : [0, 0.4, 1],
        // Add a little more bounce to emphasize the movement
        bounce: 0.5,
        // Make true movers stand out with longer animation
        stiffness: 120
      }
    },
    // New exit animation variant for letters being removed from the DOM
    exiting: {
      opacity: 0,
      scale: shouldReduceMotion ? 0.8 : [1, 0.8, 0.6],
      y: shouldReduceMotion ? 10 : [0, 10, 15],
      transition: {
        duration: getDuration(0.5),
        ease: "easeOut",
        times: shouldReduceMotion ? [0, 1] : [0, 0.7, 1]
      }
    }
  };
};

/**
 * Get ARIA label based on animation state
 * 
 * @param character - The letter being displayed
 * @param state - The current animation state
 * @returns Descriptive label for screen readers
 */
const getAriaLabel = (character: string, state: LetterAnimationState): string => {
  switch (state) {
    case 'deletion':
      return `Letter ${character} being removed`;
    case 'insertion':
      return `Letter ${character} being added`;
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
 * - Character exits (when removed from DOM)
 * 
 * Features:
 * - Smooth Framer Motion animations with customizable durations
 * - Full ARIA support for screen readers
 * - Keyboard navigation with appropriate focus states
 * - Color-coding based on animation type (red/green/yellow)
 * - Support for reduced motion preferences (CSS + JS)
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
const Letter: React.FC<LetterProps> = memo(({
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
  
  // Hook to check user's motion preference (accessibility)
  const shouldReduceMotion = useReducedMotion() || process.env.NODE_ENV === 'test';
  
  // Create variants with motion preference applied
  const letterVariants = createLetterVariants(!!shouldReduceMotion);
  
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

  // Generate dataProp based on initialIndex existence
  const dataProps = {
    "data-testid": "letter", 
    "data-state": animationState,
    ...(initialIndex !== undefined && { "data-index": initialIndex }),
  };

  // Construct dynamic className
  const letterClasses = [
    styles.letter,
    styles[animationState],
    shouldReduceMotion && styles.reducedMotion,
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.span 
      className={letterClasses}
      {...dataProps}
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
      aria-hidden={animationState === 'deletion' ? true : undefined}
      style={{
        // Ensure focus outline matches the current state color
        outlineColor: getOutlineColor()
      }}
    >
      {character}
    </motion.span>
  );
});

/**
 * Memoized version of the Letter component to prevent unnecessary re-renders.
 * Only re-renders when props actually change, improving performance in lists.
 */
export default Letter; 