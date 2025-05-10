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
 * Returns appropriate animation duration based on environment and motion preferences
 * 
 * @param baseValue - The default animation duration in seconds
 * @param shouldReduceMotion - Whether animations should be reduced
 * @returns Adjusted animation duration
 */
const getDuration = (baseValue: number, shouldReduceMotion: boolean): number => 
  shouldReduceMotion || process.env.NODE_ENV === 'test' ? 0.001 : baseValue;

/**
 * Creates variant for the normal (default) letter state
 * 
 * @param shouldReduceMotion - Whether to reduce motion
 * @returns Animation variant for the normal state
 */
const createNormalVariant = (shouldReduceMotion: boolean) => ({
  opacity: 1,
  scale: 1,
  y: 0,
  transition: {
    duration: getDuration(0.3, shouldReduceMotion),
    ease: "easeInOut"
  }
});

/**
 * Creates variant for the deletion animation state
 * 
 * @param shouldReduceMotion - Whether to reduce motion
 * @returns Animation variant for the deletion state
 */
const createDeletionVariant = (shouldReduceMotion: boolean) => ({
  opacity: 0,
  scale: shouldReduceMotion ? 1 : [1, 0.8],
  y: shouldReduceMotion ? 0 : [0, 10],
  transition: {
    duration: getDuration(0.4, shouldReduceMotion),
    ease: "easeOut",
    times: shouldReduceMotion ? [0, 1] : [0, 1]
  }
});

/**
 * Creates variant for the insertion animation state
 * 
 * @param shouldReduceMotion - Whether to reduce motion
 * @returns Animation variant for the insertion state
 */
const createInsertionVariant = (shouldReduceMotion: boolean) => ({
  opacity: shouldReduceMotion ? [0, 1] : [0, 1, 1],
  scale: shouldReduceMotion ? 1 : [1.3, 1.1, 1],
  y: shouldReduceMotion ? 0 : [0, -5, 0],
  transition: {
    duration: getDuration(0.5, shouldReduceMotion),
    ease: "easeOut",
    times: shouldReduceMotion ? [0, 1] : [0, 0.6, 1],
    // Add a slight bounce for insertions
    bounce: 0.2
  }
});

/**
 * Creates variant for the movement animation state
 * 
 * @param shouldReduceMotion - Whether to reduce motion
 * @returns Animation variant for the movement state
 */
const createMovementVariant = (shouldReduceMotion: boolean) => ({
  scale: shouldReduceMotion ? 1 : [1, 1.1, 1],
  // Enhanced animation for movement
  transition: {
    duration: getDuration(0.8, shouldReduceMotion),
    // Use an exaggerated bounce effect
    ease: shouldReduceMotion ? "easeOut" : [0.1, 2.3, 0.36, 1.2], 
    times: shouldReduceMotion ? [0, 1] : [0, 0.4, 1],
    // Add a little more bounce to emphasize the movement
    bounce: 0.5,
    // Make true movers stand out with longer animation
    stiffness: 120
  }
});

/**
 * Creates variant for the exiting animation state
 * 
 * @param shouldReduceMotion - Whether to reduce motion
 * @returns Animation variant for the exiting state
 */
const createExitingVariant = (shouldReduceMotion: boolean) => ({
  opacity: 0,
  scale: shouldReduceMotion ? 0.8 : [1, 0.8, 0.6],
  y: shouldReduceMotion ? 10 : [0, 10, 15],
  transition: {
    duration: getDuration(0.5, shouldReduceMotion),
    ease: "easeOut",
    times: shouldReduceMotion ? [0, 1] : [0, 0.7, 1]
  }
});

/**
 * Creates animation variants with appropriate timings, adjusting for test environment
 * and user's reduced motion preferences
 * 
 * @param shouldReduceMotion - Whether animations should be reduced/disabled
 * @returns Animation variants object for Framer Motion
 */
const createLetterVariants = (shouldReduceMotion: boolean): Variants => {
  return {
    normal: createNormalVariant(shouldReduceMotion),
    deletion: createDeletionVariant(shouldReduceMotion),
    insertion: createInsertionVariant(shouldReduceMotion),
    movement: createMovementVariant(shouldReduceMotion),
    exiting: createExitingVariant(shouldReduceMotion)
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
    case 'exiting':
      return `Letter ${character} exiting from display`;
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
 * Generates data attributes for testing and accessibility
 * 
 * @param animationState - Current animation state of the letter
 * @param initialIndex - Optional index for the letter (if tracking position)
 * @returns Object containing all required data attributes
 */
const createDataAttributes = (animationState: LetterAnimationState, initialIndex?: number) => ({
  "data-testid": "letter", 
  "data-state": animationState,
  ...(initialIndex !== undefined && { "data-index": initialIndex }),
});

/**
 * Creates CSS class list for the letter based on its state and settings
 * 
 * @param animationState - Current animation state
 * @param shouldReduceMotion - Whether reduced motion is active
 * @param customClass - Optional additional class name
 * @returns Space-separated string of class names
 */
const createClassNames = (
  animationState: LetterAnimationState, 
  shouldReduceMotion: boolean, 
  customClass?: string
): string => {
  return [
    styles.letter,
    styles[animationState],
    shouldReduceMotion && styles.reducedMotion,
    customClass
  ].filter(Boolean).join(' ');
};

/**
 * Returns the appropriate outline color based on animation state
 * 
 * @param animationState - Current animation state of the letter
 * @returns CSS color value for the outline
 */
const getOutlineColor = (animationState: LetterAnimationState): string => {
  switch (animationState) {
    case 'deletion': return '#ff5252';
    case 'insertion': return '#4caf50';
    case 'movement': return '#ffeb3b';
    case 'exiting': return '#ff8c00';
    default: return '#fff';
  }
};

/**
 * Creates the animation completion handler function
 * 
 * @param onAnimationComplete - Callback to run when animation completes
 * @param animationTimeoutRef - Ref to store timeout ID
 * @returns Handler function for the onAnimationComplete event
 */
const createAnimationCompleteHandler = (
  onAnimationComplete?: () => void,
  animationTimeoutRef?: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  return (definition: any) => {
    // Skip if no callback provided
    if (!onAnimationComplete) return;
    
    // Clear any existing timeout
    if (animationTimeoutRef?.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Set new timeout with the callback
    if (animationTimeoutRef) {
      animationTimeoutRef.current = setTimeout(() => {
        onAnimationComplete();
      }, 0);
    } else {
      // Fallback if no ref provided
      setTimeout(onAnimationComplete, 0);
    }
  };
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

  // Generate data attributes for testing and accessibility
  const dataProps = createDataAttributes(animationState, initialIndex);

  // Construct dynamic className based on state and settings
  const letterClasses = createClassNames(animationState, !!shouldReduceMotion, className);

  // Create animation completion handler
  const handleAnimationComplete = createAnimationCompleteHandler(
    onAnimationComplete,
    animationTimeoutRef
  );

  return (
    <motion.span 
      className={letterClasses}
      {...dataProps}
      initial="normal"
      animate={animationState}
      variants={letterVariants}
      onAnimationComplete={handleAnimationComplete}
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
        outlineColor: getOutlineColor(animationState)
      }}
    >
      {character}
    </motion.span>
  );
});

/**
 * Add displayName for better debugging in React DevTools
 */
Letter.displayName = 'Letter';

/**
 * Memoized version of the Letter component to prevent unnecessary re-renders.
 * Only re-renders when props actually change, improving performance in lists.
 */
export default Letter; 