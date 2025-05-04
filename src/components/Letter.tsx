import React from 'react';
import { motion } from 'framer-motion';
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
}

/**
 * Letter component renders a single character with appropriate styling and animation
 * based on its current animation state (normal, deletion, insertion, movement).
 */
const Letter: React.FC<LetterProps> = ({
  character,
  animationState = 'normal',
  onAnimationComplete,
  initialIndex,
  className = '',
}) => {
  // Basic rendering of the character in a span element
  return (
    <span 
      className={`${styles.letter} ${styles[animationState]} ${className}`}
      data-testid="letter"
      data-state={animationState}
      data-index={initialIndex}
    >
      {character}
    </span>
  );
};

export default Letter; 