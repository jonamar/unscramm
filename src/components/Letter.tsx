import React from 'react';
import { motion, Variants } from 'framer-motion';
import styles from './Letter.module.css';

/**
 * Animation state types for the Letter component
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
}

// Animation durations - use 0 in test environment to speed up tests
const getDuration = (baseValue: number) => 
  process.env.NODE_ENV === 'test' ? 0 : baseValue;

/**
 * Animation variants for different letter states
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
 */
const getAriaLive = (state: LetterAnimationState): 'off' | 'polite' => {
  // Use polite for state changes, off for normal state
  return state !== 'normal' ? 'polite' : 'off';
};

/**
 * Letter component renders a single character with appropriate styling and animation
 * based on its current animation state (normal, deletion, insertion, movement).
 * Enhanced with accessibility features for screen readers and keyboard navigation.
 */
const Letter: React.FC<LetterProps> = ({
  character,
  animationState = 'normal',
  onAnimationComplete,
  initialIndex,
  className = '',
  tabIndex = 0,
}) => {
  // Get accessibility attributes based on current state
  const ariaLabel = getAriaLabel(character, animationState);
  const ariaLive = getAriaLive(animationState);

  // Determine if the component should be focusable based on state
  // Deleted letters shouldn't remain in focus order once they're gone
  const effectiveTabIndex = animationState === 'deletion' ? -1 : tabIndex;

  return (
    <motion.span 
      className={`${styles.letter} ${styles[animationState]} ${className}`}
      data-testid="letter"
      data-state={animationState}
      data-index={initialIndex}
      initial="normal"
      animate={animationState}
      variants={letterVariants}
      onAnimationComplete={onAnimationComplete}
      layout
      
      // Accessibility attributes
      role="text"
      aria-label={ariaLabel}
      aria-live={ariaLive}
      aria-atomic="true"
      aria-relevant="text"
      tabIndex={effectiveTabIndex}
      aria-hidden={animationState === 'deletion'}
      // Add focus/blur handlers that match the state color to outline color for keyboard users
      style={{
        // Ensure focus outline matches the current state color
        outlineColor: animationState === 'deletion' ? '#ff5252' : 
                       animationState === 'insertion' ? '#4caf50' : 
                       animationState === 'movement' ? '#ffeb3b' : '#fff'
      }}
    >
      {character}
    </motion.span>
  );
};

export default Letter; 