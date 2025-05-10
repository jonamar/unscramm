import React, { useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMachine } from '@xstate/react';
import Letter, { LetterAnimationState } from './Letter';
import { computeEditPlan, EditPlan } from '../utils/editPlan';
import { createWordTransformMachine, WordTransformPhase } from './wordTransform.machine';
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
  /** Current letters from source word in DOM */
  sourceLetters: string[];
  /** Current letters from target word in DOM */
  targetLetters: string[];
  /** Start the animation sequence */
  startAnimation: () => void;
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
  cancelOnPropsChange = true,
  debugMode = false
}, ref) => {
  // Compute the edit plan between the misspelled and correct words
  const editPlan = useMemo(() => {
    if (!misspelling || !correct) return null;
    return computeEditPlan(misspelling, correct);
  }, [misspelling, correct]);

  // Create the state machine with the correct counts from the edit plan
  const machine = useMemo(() => {
    if (!editPlan) return createWordTransformMachine();
    
    return createWordTransformMachine({
      deletions: editPlan.deletions.length,
      moves: editPlan.moves.length,
      insertions: editPlan.insertions.length
    });
  }, [editPlan]);

  // Use the XState useMachine hook to manage state
  const [state, send] = useMachine(machine);

  // Create refs for source and target letters
  const sourceLetters = useMemo(() => misspelling.split(''), [misspelling]);
  const targetLetters = useMemo(() => correct.split(''), [correct]);
  
  // Track animation completed count for each phase
  const animationCountRef = useRef(0);
  const totalAnimationsRef = useRef(0);

  // Function to start the animation sequence
  const startAnimation = useCallback(() => {
    if (onAnimationStart) {
      onAnimationStart();
    }
    send({ type: 'START' });
  }, [send, onAnimationStart]);

  // Reset the animation when words change (if cancelOnPropsChange is true)
  React.useEffect(() => {
    if (cancelOnPropsChange) {
      send({ type: 'RESET' });
      animationCountRef.current = 0;
      totalAnimationsRef.current = 0;
    }
  }, [misspelling, correct, cancelOnPropsChange, send]);

  // Call onPhaseChange when the state machine's state changes
  React.useEffect(() => {
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
    sourceLetters,
    targetLetters,
    startAnimation
  }), [state.value, editPlan, sourceLetters, targetLetters, startAnimation]);
  
  // Track the active letter arrays for the current phase
  const renderableLetters = useMemo(() => {
    const currentPhase = state.value as WordTransformPhase;
    
    // Use source letters for idle, deleting, and moving phases
    if (currentPhase === 'idle' || currentPhase === 'deleting' || currentPhase === 'moving') {
      return sourceLetters;
    }
    
    // Use target letters for inserting and complete phases
    return targetLetters;
  }, [state.value, sourceLetters, targetLetters]);
  
  // Set CSS variables for animation timing based on speedMultiplier
  const containerStyle = useMemo(() => {
    return {
      '--speed-multiplier': speedMultiplier,
      '--remove-duration': `${300 / speedMultiplier}ms`,
      '--add-duration': `${300 / speedMultiplier}ms`,
      '--move-duration': `${500 / speedMultiplier}ms`,
    } as React.CSSProperties;
  }, [speedMultiplier]);

  // Render the letters based on the current phase
  const renderLetters = () => {
    if (!editPlan || !renderableLetters.length) return null;
    
    const currentPhase = state.value as WordTransformPhase;
    
    return (
      <AnimatePresence mode="sync">
        {renderableLetters.map((letter, index) => {
          // For inserting phase, we need to determine if this letter was inserted
          const isInserted = currentPhase === 'inserting' && 
            editPlan.insertions.some(ins => ins.position === index);
          
          // Get the animation state for this letter
          const animationState = currentPhase === 'inserting' && isInserted 
            ? 'insertion' 
            : getLetterAnimationState(index, currentPhase, editPlan);
          
          // Only set animation callbacks on letters that are actively animating
          const needsCallback = 
            (currentPhase === 'deleting' && animationState === 'deletion') ||
            (currentPhase === 'moving' && (animationState === 'movement' || animationState === 'true-mover')) ||
            (currentPhase === 'inserting' && animationState === 'insertion');
          
          // Add a class if colors are enabled
          const letterClass = colorsEnabled ? styles.colorEnabled : '';
          
          return (
            <Letter
              key={`${letter}-${index}`}
              character={letter}
              animationState={animationState}
              className={letterClass}
              initialIndex={index}
              onAnimationComplete={needsCallback ? handleLetterAnimationComplete : undefined}
            />
          );
        })}
      </AnimatePresence>
    );
  };

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
        {renderLetters()}
      </div>
      
      {currentPhase === 'idle' && (
        <button 
          className={styles.startButton}
          onClick={startAnimation}
          data-testid="start-animation-button"
        >
          Start Animation
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