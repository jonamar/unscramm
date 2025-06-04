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
  /** Optional callback when animation is restarted from complete state */
  onRestart?: () => void;
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
  /** Current letters from source word in DOM */
  sourceLetters: string[];
  /** Current letters from target word in DOM */
  targetLetters: string[];
  /** Start the animation sequence */
  startAnimation: () => void;
  /** Restart the animation from the complete state */
  restartAnimation: () => void;
}

/**
 * Main component that animates the transformation from a misspelled word to its correct spelling
 * This implementation uses XState to manage the animation state machine
 */
const WordTransformFSM = forwardRef<WordTransformTestingAPI, WordTransformProps>(({
  misspelling,
  correct,
  speedMultiplier = 1,
  colorsEnabled = true,
  className = '',
  onAnimationStart,
  onAnimationComplete,
  onPhaseChange,
  onRestart,
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
  
  // Refs for the buttons to handle keyboard focus
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);

  // Function to start the animation sequence
  const startAnimation = useCallback(() => {
    if (onAnimationStart) {
      onAnimationStart();
    }
    send({ type: 'START' });
  }, [send, onAnimationStart]);
  
  // Function to restart the animation from the complete phase
  const restartAnimation = useCallback(() => {
    if (onRestart) {
      onRestart();
    }
    send({ type: 'RESTART' });
    // After restarting, immediately start the animation again
    setTimeout(() => {
      send({ type: 'START' });
      if (onAnimationStart) {
        onAnimationStart();
      }
    }, 0);
  }, [send, onRestart, onAnimationStart]);

  // Reset the animation when words change (if cancelOnPropsChange is true)
  useEffect(() => {
    if (cancelOnPropsChange) {
      send({ type: 'RESET' });
      animationCountRef.current = 0;
      totalAnimationsRef.current = 0;
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
  }, [state.value, onPhaseChange, editPlan, onAnimationComplete]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentPhase = state.value as WordTransformPhase;
      
      // Space or Enter key to trigger buttons
      if (e.key === ' ' || e.key === 'Enter') {
        if (currentPhase === 'idle' && document.activeElement === startButtonRef.current) {
          startAnimation();
          e.preventDefault();
        } else if (currentPhase === 'complete' && document.activeElement === restartButtonRef.current) {
          restartAnimation();
          e.preventDefault();
        }
      }
      
      // Shortcut keys when no other element has focus
      if (document.activeElement === document.body) {
        // 'r' key to restart when in complete phase
        if (e.key === 'r' && currentPhase === 'complete') {
          restartAnimation();
          e.preventDefault();
        }
        
        // 's' key to start when in idle phase
        if (e.key === 's' && currentPhase === 'idle') {
          startAnimation();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.value, startAnimation, restartAnimation]);

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
    sourceLetters: misspelling.split(''),
    targetLetters: correct.split(''),
    startAnimation,
    restartAnimation
  }), [state.value, editPlan, misspelling, correct, startAnimation, restartAnimation]);
  
  // Track the active letter arrays for the current phase
  const sourceLetters = useMemo(() => misspelling.split(''), [misspelling]);
  const targetLetters = useMemo(() => correct.split(''), [correct]);
  
  // Set CSS variables for animation timing based on speedMultiplier
  const containerStyle = useMemo(() => {
    return {
      '--speed-multiplier': speedMultiplier,
      '--remove-duration': `${300 / speedMultiplier}ms`,
      '--add-duration': `${300 / speedMultiplier}ms`,
      '--move-duration': `${500 / speedMultiplier}ms`,
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
      
      {currentPhase === 'idle' && (
        <button 
          className={styles.startButton}
          onClick={startAnimation}
          data-testid="start-animation-button"
          ref={startButtonRef}
          aria-label="Start animation"
        >
          Start Animation
        </button>
      )}
      
      {currentPhase === 'complete' && (
        <button 
          className={styles.restartButton}
          onClick={restartAnimation}
          data-testid="restart-animation-button"
          ref={restartButtonRef}
          aria-label="Restart animation"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            width="24" 
            height="24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 2v6h6"></path>
            <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
          </svg>
          Replay
        </button>
      )}
      
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

WordTransformFSM.displayName = 'WordTransformFSM';

export default WordTransformFSM; 