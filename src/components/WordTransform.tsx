import React, { useMemo, useCallback, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { LetterAnimationState } from './Letter';
import { computeEditPlan, EditPlan } from '../utils/editPlan';
import { useWordTransformMachine, WordTransformPhase } from './wordTransform.machine';
import SourceLetters from './SourceLetters';
import TargetLetters from './TargetLetters';
import styles from './WordTransform.module.css';

/**
 * WordTransform component props
 */
export interface WordTransformProps {
  /** The misspelled word to transform */
  misspelling: string;
  /** The correctly spelled word to transform to */
  correct: string;
  /** Speed multiplier for animations (default: 1) - higher values make animations faster */
  speedMultiplier?: number;
  /** Whether to enable color coding for different animation states (default: true) */
  colorsEnabled?: boolean;
  /** Optional class name for styling */
  className?: string;
  /** Optional callback when animation starts */
  onAnimationStart?: () => void;
  /** Optional callback when animation completes */
  onAnimationComplete?: () => void;
  /** Optional callback when animation phase changes */
  onPhaseChange?: (phase: WordTransformPhase) => void;
  /** 
   * Flag to control behavior when props change during an animation:
   * - true (default): Cancel any in-flight animation and reset to IDLE state
   * - false: Continue current animation and only update words for the next animation
   */
  cancelOnPropsChange?: boolean;
  /**
   * Enable debug mode to show additional data attributes for testing and development
   * - Adds data-* attributes to each letter showing more detailed state information
   * - Useful for E2E testing and for debugging animation issues
   */
  debugMode?: boolean;
}

/**
 * Testing API interface for WordTransform component
 * Exposes internal state and methods for testing purposes
 */
export interface WordTransformTestingAPI {
  /** Current animation phase */
  phase: WordTransformPhase;
  /** Current edit plan between words */
  editPlan: EditPlan | null;
  /** Whether animation is currently running */
  isAnimating: boolean;
  /** Start the animation sequence */
  startAnimation: () => void;
  /** Number of completed animations in current phase */
  completedAnimations: number;
  /** Total number of animations expected in current phase */
  totalAnimationsInPhase: number;
}

/**
 * Main component that animates the transformation from a misspelled word to its correct spelling
 * This implementation uses XState to manage the animation state machine
 */
const WordTransform = forwardRef<WordTransformTestingAPI, WordTransformProps>(({
  misspelling,
  correct,
  speedMultiplier = 1,
  colorsEnabled = true,
  className = '',
  onAnimationStart,
  onAnimationComplete,
  onPhaseChange,
  cancelOnPropsChange = true,
  debugMode = false
}, ref) => {
  // Compute the edit plan between the misspelled and correct words
  const editPlan = useMemo(() => {
    if (!misspelling || !correct) return null;
    return computeEditPlan(misspelling, correct);
  }, [misspelling, correct]);



  // Use the new React hooks-based state machine
  const [state, send] = useWordTransformMachine(
    editPlan ? {
      deletions: editPlan.deletions.length,
      moves: editPlan.moves.length,
      insertions: editPlan.insertions.length
    } : undefined
  );

  // Track animation completed count for each phase
  const animationCountRef = useRef(0);
  const totalAnimationsRef = useRef(0);
  const isResettingRef = useRef(false);
  
  // Function to start the animation sequence
  const startAnimation = useCallback(() => {
    if (onAnimationStart) {
      onAnimationStart();
    }
    send({ type: 'START' });
  }, [send, onAnimationStart]);
  
  // Reset the animation when words change (if cancelOnPropsChange is true)
  useEffect(() => {
    if (cancelOnPropsChange) {
      isResettingRef.current = true;
      send({ type: 'RESET' });
      animationCountRef.current = 0;
      totalAnimationsRef.current = 0;
      // Clear the reset flag after a brief delay
      setTimeout(() => {
        isResettingRef.current = false;
      }, 10);
    }
  }, [misspelling, correct, cancelOnPropsChange, send]);

  // Call onPhaseChange when the state machine's state changes
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(state.value as WordTransformPhase);
    }
    
    // Reset animation count when phase changes
    animationCountRef.current = 0;
    
    // Set the total animations for the current phase
    if (state.value === 'deleting') {
      totalAnimationsRef.current = editPlan?.deletions.length || 0;
    } else if (state.value === 'moving') {
      totalAnimationsRef.current = editPlan?.moves.length || 0;
    } else if (state.value === 'inserting') {
      totalAnimationsRef.current = editPlan?.insertions.length || 0;
    } else if (state.value === 'complete' && onAnimationComplete) {
      onAnimationComplete();
    }
    
    // Fix: Auto-progress through empty phases, including consecutive empty phases
    // If this phase has no operations, immediately progress to the next phase
    // But don't auto-progress if we're in the middle of a reset operation
    const currentPhaseOperationCount = totalAnimationsRef.current;
    if (currentPhaseOperationCount === 0 && 
        state.value !== 'idle' && 
        state.value !== 'complete' &&
        !isResettingRef.current) {
      
      // Use setTimeout to ensure this happens after the current render cycle
      // This prevents React state update warnings and ensures proper execution order
      const timeoutId = setTimeout(() => {
        if (debugMode) {
          console.log(`[WordTransform] Auto-progressing empty phase: ${state.value} -> DONE_PHASE`);
        }
        send({ type: 'DONE_PHASE' });
      }, 0);
      
      // Cleanup function to prevent memory leaks if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [state.value, onPhaseChange, editPlan, onAnimationComplete, send]);
  
  // Called when a letter animation completes
  const handleLetterAnimationComplete = useCallback(() => {
    animationCountRef.current += 1;
    
    // If all animations in the current phase are complete, move to the next phase
    if (animationCountRef.current >= totalAnimationsRef.current) {
      send({ type: 'DONE_PHASE' });
    }
  }, [send]);



  // Determine the animation state for a letter based on the current phase and edit plan
  const getLetterAnimationState = useCallback((
    letterIndex: number,
    phase: WordTransformPhase,
    editPlan: EditPlan | null
  ): LetterAnimationState => {
    if (!editPlan) return 'normal';

    // Check if this letter is being deleted
    const isDeleted = editPlan.deletions.includes(letterIndex);
    
    // Check if this letter is being moved
    const moveInfo = editPlan.moves.find(move => move.fromIndex === letterIndex);
    const isMoved = Boolean(moveInfo);
    
    // Check if this is a "true mover" (highlighted for special animation)
    const isTrueMover = isMoved && editPlan.highlightIndices?.includes(letterIndex);

    // Determine animation state based on the current phase
    switch (phase) {
      case 'deleting':
        return isDeleted ? 'deletion' : 'normal';
      case 'moving':
        return isTrueMover ? 'true-mover' : (isMoved ? 'movement' : 'normal');
      case 'inserting':
        // For insertion phase, we show the final result
        return 'normal';
      case 'complete':
        return 'normal';
      default:
        return 'normal';
    }
  }, []);

  // Expose internal state and methods for testing
  useImperativeHandle(ref, () => ({
    phase: state.value as WordTransformPhase,
    editPlan,
    isAnimating: state.value !== 'idle' && state.value !== 'complete',
    startAnimation,
    completedAnimations: animationCountRef.current,
    totalAnimationsInPhase: totalAnimationsRef.current
  }), [state.value, editPlan, startAnimation]);
  
  // Track the active letter arrays for the current phase
  const sourceLetters = useMemo(() => misspelling.split('').map((char, i) => ({ char, origIndex: i })), [misspelling]);
  const targetLetters = useMemo(() => correct.split(''), [correct]);
  
  // Set CSS variables for animation timing based on speedMultiplier
  const containerStyle = useMemo(() => {
    return {
      '--speed-multiplier': speedMultiplier,
      '--remove-duration': `${1200 / speedMultiplier}ms`,
      '--add-duration': `${1200 / speedMultiplier}ms`,
      '--move-duration': `${2000 / speedMultiplier}ms`,
    } as React.CSSProperties;
  }, [speedMultiplier]);

  // Determine current phase for data attribute and CSS
  const currentPhase = state.value as WordTransformPhase;
  const isAnimating = currentPhase !== 'idle' && currentPhase !== 'complete';

  return (
    <div 
      className={`${styles.wordTransform} ${className}`}
      style={containerStyle}
      data-testid="word-transform"
      data-phase={currentPhase}
      data-animating={isAnimating ? 'true' : 'false'}
      data-debug-mode={debugMode ? 'true' : 'false'}
    >
      <div className={styles.lettersContainer}>
        <SourceLetters
          letters={sourceLetters}
          phase={currentPhase}
          editPlan={editPlan}
          onLetterAnimationComplete={handleLetterAnimationComplete}
          getLetterAnimationState={getLetterAnimationState}
          colorsEnabled={colorsEnabled}
        />
        <TargetLetters
          letters={targetLetters}
          phase={currentPhase}
          editPlan={editPlan}
          onLetterAnimationComplete={handleLetterAnimationComplete}
          colorsEnabled={colorsEnabled}
        />
      </div>
      
      {debugMode && (
        <div className={styles.debugInfo}>
          <div>Phase: {currentPhase}</div>
          <div>Deletions: {editPlan?.deletions.length || 0}</div>
          <div>Moves: {editPlan?.moves.length || 0}</div>
          <div>Insertions: {editPlan?.insertions.length || 0}</div>
          <div>Animations: {animationCountRef.current}/{totalAnimationsRef.current}</div>
        </div>
      )}
    </div>
  );
});

WordTransform.displayName = 'WordTransform';

export default WordTransform; 