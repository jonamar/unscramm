import React, { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Letter, { LetterAnimationState } from './Letter';
import { EditPlan } from '../utils/editPlan';
import { WordTransformPhase } from './wordTransform.machine';
import styles from './WordTransform.module.css';

export interface SourceLettersProps {
  /** Source letters from the misspelled word, with stable original indices */
  letters: { char: string; origIndex: number }[];
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
  /** Speed multiplier for animations (default: 1) - higher values make animations faster */
  speedMultiplier?: number;
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
  speedMultiplier = 1,
}) => {
  if (!editPlan || !letters.length) return null;

  // Only render source letters in the appropriate phases
  if (phase !== 'idle' && phase !== 'deleting' && phase !== 'moving') return null;

  // CRITICAL FIX: Filter out deleted letters during moving phase
  // Deleted letters should not be rendered at all during moving phase
  const filteredLetters = phase === 'moving' && editPlan 
    ? letters.map((letter, index) => ({ ...letter, originalIndex: index }))
             .filter(({ originalIndex }) => !editPlan.deletions.includes(originalIndex))
    : letters.map((letter, index) => ({ ...letter, originalIndex: index }));

  return (
    <AnimatePresence mode="sync">
      {filteredLetters.map(({ char, origIndex, originalIndex }) => {
        // Get the animation state for this letter using the original index
        const animationState = getLetterAnimationState(originalIndex, phase, editPlan);
        
        // Only set animation callbacks on letters that are actively animating
        const needsCallback = 
          (phase === 'deleting' && animationState === 'deletion') ||
          (phase === 'moving' && (animationState === 'movement' || animationState === 'true-mover'));
        
        // Add a class if colors are enabled
        const letterClass = colorsEnabled ? styles.colorEnabled : '';
        
        return (
          <Letter
            key={`source-${char}-${origIndex}`}
            character={char}
            animationState={animationState}
            className={letterClass}
            initialIndex={origIndex}
            speedMultiplier={speedMultiplier}
            onAnimationComplete={needsCallback ? onLetterAnimationComplete : undefined}
          />
        );
      })}
    </AnimatePresence>
  );
});

SourceLetters.displayName = 'SourceLetters';

export default SourceLetters; 