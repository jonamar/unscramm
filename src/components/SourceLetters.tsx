import React, { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Letter, { LetterAnimationState } from './Letter';
import { EditPlan } from '../utils/editPlan';
import { WordTransformPhase } from './wordTransform.machine';
import styles from './WordTransform.module.css';

export interface SourceLettersProps {
  /** Source letters from the misspelled word */
  letters: string[];
  /** Current animation phase */
  phase: WordTransformPhase;
  /** Edit plan for the transformation */
  editPlan: EditPlan | null;
  /** Callback when a letter animation completes */
  onLetterAnimationComplete?: () => void;
  /** Function to determine letter animation state */
  getLetterAnimationState: (letterIndex: number, phase: WordTransformPhase, editPlan: EditPlan | null) => LetterAnimationState;
  /** Whether to enable color coding */
  colorsEnabled?: boolean;
}

/**
 * Component for rendering source letters during the transformation
 * Used in idle, deleting, and moving phases
 */
const SourceLetters = memo<SourceLettersProps>(({
  letters,
  phase,
  editPlan,
  onLetterAnimationComplete,
  getLetterAnimationState,
  colorsEnabled = true,
}) => {
  if (!editPlan || !letters.length) return null;

  // Only render source letters in the appropriate phases
  if (phase !== 'idle' && phase !== 'deleting' && phase !== 'moving') return null;

  return (
    <AnimatePresence mode="sync">
      {letters.map((letter, index) => {
        // Get the animation state for this letter
        const animationState = getLetterAnimationState(index, phase, editPlan);
        
        // Only set animation callbacks on letters that are actively animating
        const needsCallback = 
          (phase === 'deleting' && animationState === 'deletion') ||
          (phase === 'moving' && (animationState === 'movement' || animationState === 'true-mover'));
        
        // Add a class if colors are enabled
        const letterClass = colorsEnabled ? styles.colorEnabled : '';
        
        return (
          <Letter
            key={`source-${letter}-${index}`}
            character={letter}
            animationState={animationState}
            className={letterClass}
            initialIndex={index}
            onAnimationComplete={needsCallback ? onLetterAnimationComplete : undefined}
          />
        );
      })}
    </AnimatePresence>
  );
});

SourceLetters.displayName = 'SourceLetters';

export default SourceLetters; 