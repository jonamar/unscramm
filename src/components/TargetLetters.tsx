import React, { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Letter from './Letter';
import { EditPlan } from '../utils/editPlan';
import { WordTransformPhase } from './wordTransform.machine';
import styles from './WordTransform.module.css';

export interface TargetLettersProps {
  /** Target letters from the correct word */
  letters: string[];
  /** Current animation phase */
  phase: WordTransformPhase;
  /** Edit plan for the transformation */
  editPlan: EditPlan | null;
  /** Callback when a letter animation completes */
  onLetterAnimationComplete?: () => void;
  /** Whether to enable color coding */
  colorsEnabled?: boolean;
  /** Speed multiplier for animations (default: 1) - higher values make animations faster */
  speedMultiplier?: number;
}

/**
 * Component for rendering target letters during the transformation
 * Used in inserting and complete phases
 */
const TargetLetters = memo<TargetLettersProps>(({
  letters,
  phase,
  editPlan,
  onLetterAnimationComplete,
  colorsEnabled = true,
  speedMultiplier = 1,
}) => {
  if (!editPlan || !letters.length) return null;

  // Only render target letters in the appropriate phases
  if (phase !== 'inserting' && phase !== 'complete') return null;

  return (
    <AnimatePresence mode="sync">
      {letters.map((letter, index) => {
        // For inserting phase, we need to determine if this letter was inserted
        const isInserted = phase === 'inserting' && 
          editPlan.insertions.some(ins => ins.position === index);
        
        // Get the animation state for this letter
        const animationState = isInserted ? 'insertion' : 'normal';
        
        // Only set animation callbacks on letters that are actively animating
        const needsCallback = phase === 'inserting' && animationState === 'insertion';
        
        // Add a class if colors are enabled
        const letterClass = colorsEnabled ? styles.colorEnabled : '';
        
        return (
          <Letter
            key={`target-${letter}-${index}`}
            character={letter}
            animationState={animationState}
            className={letterClass}
            initialIndex={index}
            speedMultiplier={speedMultiplier}
            onAnimationComplete={needsCallback ? onLetterAnimationComplete : undefined}
          />
        );
      })}
    </AnimatePresence>
  );
});

TargetLetters.displayName = 'TargetLetters';

export default TargetLetters; 