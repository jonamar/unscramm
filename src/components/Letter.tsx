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
}

/**
 * Animation variants for different letter states
 */
const letterVariants: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  deletion: {
    opacity: 0,
    scale: 0.8,
    y: 10,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  insertion: {
    opacity: [0, 1, 1],
    scale: [1.3, 1.1, 1],
    y: [0, -5, 0],
    transition: {
      duration: 0.5,
      ease: "easeOut",
      times: [0, 0.6, 1]
    }
  },
  movement: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.8,
      ease: [0.1, 2, 0.3, 1], // Matches the exaggerated cubic-bezier in CSS
      times: [0, 0.3, 1]
    }
  }
};

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
    >
      {character}
    </motion.span>
  );
};

export default Letter; 