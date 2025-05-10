import React, { useReducer, useEffect, useRef, useMemo, useImperativeHandle } from 'react';
import { AnimatePresence } from 'framer-motion';
import Letter, { LetterAnimationState } from './Letter';
import { computeEditPlan, EditPlan } from '../utils/editPlan';
import styles from './WordTransform.module.css';

/**
 * Animation phases for the word transformation sequence
 * 
 * Phase Transition Diagram:
 * 
 * ┌─────────┐    START     ┌──────────┐   IF NO DELETIONS   ┌─────────┐   IF NO MOVES   ┌───────────┐   ALWAYS   ┌───────────┐
 * │  IDLE   │──────────────▶ DELETING │───────────────────▶│ MOVING  │────────────────▶│ INSERTING │───────────▶│ COMPLETE  │
 * └─────────┘              └──────────┘                    └─────────┘                 └───────────┘            └───────────┘
 *     ▲                                                                                                               │
 *     │                                                                                                               │
 *     └───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 *                                               RESET (on new words)
 * 
 * Events that trigger transitions:
 * - START: User clicks "Start Animation" button
 * - All transitions: When all animations in the current phase are complete
 * - IF NO X: Immediate skip when a phase has no animations to perform
 * - RESET: When words change and cancelOnPropsChange is true
 * 
 * Note: The COMPLETE phase is a terminal state that prevents further animations or re-renders.
 * It will not loop back to itself unnecessarily, improving performance for complex UIs with
 * multiple WordTransform components.
 */
export enum AnimationPhase {
  IDLE = 'idle',
  DELETING = 'deleting',
  MOVING = 'moving',
  INSERTING = 'inserting',
  COMPLETE = 'complete'
}

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
  onPhaseChange?: (phase: AnimationPhase) => void;
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
 * State for the animation reducer
 */
interface AnimationState {
  /** Current animation phase */
  phase: AnimationPhase;
  /** Current edit plan between the words */
  editPlan: EditPlan | null;
  /** Source word characters */
  sourceLetters: string[];
  /** Target word characters */
  targetLetters: string[];
  /** Flag to track if animation is in progress */
  isAnimating: boolean;
  /** Counter to track how many animations have completed in current phase */
  completedAnimations: number;
  /** Total animations expected in current phase */
  totalAnimationsInPhase: number;
}

/**
 * Actions for the animation reducer
 */
type AnimationAction =
  | { type: 'INITIALIZE'; payload: { sourceWord: string; targetWord: string; editPlan: EditPlan } }
  | { type: 'START_ANIMATION' }
  | { type: 'START_PHASE'; payload: { phase: AnimationPhase; total: number } }
  | { type: 'ANIMATION_COMPLETE' }
  | { type: 'COMPLETE_PHASE' }
  | { type: 'RESET' }
  | { type: 'CLEAR' };

/**
 * Initial state for the animation reducer
 */
const initialState: AnimationState = {
  phase: AnimationPhase.IDLE,
  editPlan: null,
  sourceLetters: [],
  targetLetters: [],
  isAnimating: false,
  completedAnimations: 0,
  totalAnimationsInPhase: 0
};

/**
 * Phase transition map - defines the next phase for each current phase
 */
const PHASE_TRANSITIONS: Record<AnimationPhase, AnimationPhase | null> = {
  [AnimationPhase.IDLE]: AnimationPhase.DELETING,
  [AnimationPhase.DELETING]: AnimationPhase.MOVING,
  [AnimationPhase.MOVING]: AnimationPhase.INSERTING,
  [AnimationPhase.INSERTING]: AnimationPhase.COMPLETE,
  [AnimationPhase.COMPLETE]: null // Terminal state
};

/**
 * Interface for phase-specific behavior configuration
 */
interface PhaseConfig {
  getTotal: () => number;
  shouldSkip: (total: number) => boolean;
  onEnter?: () => void;
}

/**
 * Reducer function for animation state management
 */
function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case 'INITIALIZE':
      const { sourceWord, targetWord, editPlan } = action.payload;
      const sourceLetters = sourceWord.split('');
      const targetLetters = targetWord.split('');
      
      return {
        ...state,
        phase: AnimationPhase.IDLE,
        editPlan,
        sourceLetters,
        targetLetters,
        isAnimating: false,
        completedAnimations: 0,
        totalAnimationsInPhase: 0
      };
      
    case 'START_ANIMATION':
      return {
        ...state,
        phase: AnimationPhase.DELETING,
        isAnimating: true,
        completedAnimations: 0
      };
      
    case 'START_PHASE':
      return {
        ...state,
        phase: action.payload.phase,
        completedAnimations: 0,
        totalAnimationsInPhase: action.payload.total
      };
      
    case 'ANIMATION_COMPLETE':
      const newCompletedCount = state.completedAnimations + 1;
      return {
        ...state,
        completedAnimations: newCompletedCount
      };
      
    case 'COMPLETE_PHASE': {
      // Determine next phase using the transition map
      const nextPhase = PHASE_TRANSITIONS[state.phase];
      
      // If there's no next phase (we're at the end), stay in current phase
      if (nextPhase === null) {
        return state;
      }
      
      return {
        ...state,
        phase: nextPhase,
        completedAnimations: 0
      };
    }
      
    case 'RESET':
      return initialState;
    
    case 'CLEAR':
      // Clear edit plan and reset but keep basic state structure
      return {
        ...initialState,
        // Maintains the reference to initialState but clears the editPlan
        editPlan: null,
        sourceLetters: [],
        targetLetters: []
      };
      
    default:
      return state;
  }
}

/**
 * Testing API interface for WordTransform component
 * Exposes internal state and methods for testing purposes
 */
export interface WordTransformTestingAPI {
  /** Current animation phase */
  phase: AnimationPhase;
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
  /** Number of completed animations in current phase */
  completedAnimations: number;
  /** Total number of animations expected in current phase */
  totalAnimationsInPhase: number;
}

/**
 * WordTransform component that orchestrates the animation sequence between a misspelled
 * word and its correct spelling using Letter components.
 */
const WordTransform = React.forwardRef<WordTransformTestingAPI, WordTransformProps>(({
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
  // Set up reducer for animation state management
  const [state, dispatch] = useReducer(animationReducer, initialState);
  
  // Reference to container element for CSS variables
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Memoize the edit plan calculation to prevent expensive O(n²) recalculations
  const memoizedEditPlan = useMemo(() => {
    if (misspelling !== '' && correct !== '') {
      return computeEditPlan(misspelling, correct);
    }
    return null;
  }, [misspelling, correct]);
  
  // Initialize with words when props change
  useEffect(() => {
    // Case 1: Both inputs are empty or one is empty - clear state
    if (misspelling === '' || correct === '') {
      dispatch({ type: 'CLEAR' });
      return;
    }
    
    // Case 2: Both inputs are valid and we have an edit plan
    if (memoizedEditPlan) {
      // Reset animation if props change during animation and cancelOnPropsChange is true
      if (state.isAnimating && cancelOnPropsChange) {
        dispatch({ type: 'RESET' });
        
        // Then initialize with new words
        dispatch({
          type: 'INITIALIZE',
          payload: { 
            sourceWord: misspelling, 
            targetWord: correct,
            editPlan: memoizedEditPlan
          }
        });
      } else if (!state.isAnimating) {
        // If not animating, always initialize with new words regardless of cancelOnPropsChange
        dispatch({
          type: 'INITIALIZE',
          payload: { 
            sourceWord: misspelling, 
            targetWord: correct,
            editPlan: memoizedEditPlan
          }
        });
      }
      // When cancelOnPropsChange is false and animation is in progress,
      // we don't dispatch INITIALIZE to allow the current animation to complete
    }
  }, [misspelling, correct, cancelOnPropsChange, memoizedEditPlan, state.isAnimating]);
  
  // Update CSS variables for animation timing based on speed multiplier
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      
      // Get base values from CSS custom properties
      const computedStyle = getComputedStyle(document.documentElement);
      const removeBase = parseFloat(computedStyle.getPropertyValue('--remove-duration') || '0.4s');
      const addBase = parseFloat(computedStyle.getPropertyValue('--add-duration') || '0.3s');
      const reorderBase = parseFloat(computedStyle.getPropertyValue('--reorder-duration') || '1.0s');
      
      // Apply speed multiplier (faster = smaller values)
      container.style.setProperty('--remove-duration', `${removeBase / speedMultiplier}s`);
      container.style.setProperty('--add-duration', `${addBase / speedMultiplier}s`);
      container.style.setProperty('--reorder-duration', `${reorderBase / speedMultiplier}s`);
    }
  }, [speedMultiplier]);

  // Memoize animation phase handlers to avoid unnecessary renders
  const handlePhaseChange = useMemo(() => {
    return (phase: AnimationPhase) => {
      if (onPhaseChange) {
        onPhaseChange(phase);
      }
    };
  }, [onPhaseChange]);

  // Effect to handle phase transitions and total animations tracking
  useEffect(() => {
    // Skip for initial render or if no edit plan
    if (!state.editPlan) return;

    // Configure phase-specific behavior
    const phaseConfig: Record<Exclude<AnimationPhase, AnimationPhase.IDLE>, PhaseConfig> = {
      [AnimationPhase.DELETING]: {
        getTotal: () => state.editPlan?.deletions.length || 0,
        shouldSkip: (total: number) => total === 0,
      },
      [AnimationPhase.MOVING]: {
        // Include deleted letters as part of the moving animations so their exit animations are counted
        getTotal: () => (state.editPlan?.moves.length || 0) + (state.editPlan?.deletions.length || 0),
        shouldSkip: (total: number) => total === 0,
      },
      [AnimationPhase.INSERTING]: {
        getTotal: () => state.editPlan?.insertions.length || 0,
        shouldSkip: (total: number) => total === 0,
      },
      [AnimationPhase.COMPLETE]: {
        getTotal: () => 0,
        shouldSkip: () => true, // Always skip for COMPLETE phase to prevent unnecessary START_PHASE
        onEnter: () => {
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      }
    };

    // Skip AnimationPhase.IDLE as it's handled separately
    if (state.phase !== AnimationPhase.IDLE) {
      const config = phaseConfig[state.phase as Exclude<AnimationPhase, AnimationPhase.IDLE>];
      
      if (!config) return;

      // Get total animations for this phase
      const totalAnimationsInPhase = config.getTotal();
      
      // If this phase has an onEnter callback, call it 
      if (config.onEnter) {
        config.onEnter();
      }
      
      // Special handling for COMPLETE phase - don't dispatch anything to prevent unnecessary re-renders
      if (state.phase === AnimationPhase.COMPLETE) {
        // COMPLETE phase is a terminal state, so we don't dispatch any further actions
        // This prevents the unnecessary re-render loop in COMPLETE phase
        return;
      }
      
      // For other phases, check if we should skip or start the phase
      if (config.shouldSkip(totalAnimationsInPhase)) {
        dispatch({ type: 'COMPLETE_PHASE' });
      } else {
        // Otherwise start the phase with the calculated number of animations
        dispatch({ 
          type: 'START_PHASE', 
          payload: { 
            phase: state.phase, 
            total: totalAnimationsInPhase 
          } 
        });
      }
    }

    // Notify of phase change
    handlePhaseChange(state.phase);
    
    // Remove state.isAnimating from the dependency array to prevent unwanted reruns
    // This is safe because we only care about phase changes and editPlan changes
  }, [state.phase, state.editPlan, handlePhaseChange, onAnimationComplete]);

  // Start animation function
  const startAnimation = () => {
    if (onAnimationStart) {
      onAnimationStart();
    }
    
    dispatch({ type: 'START_ANIMATION' });
  };

  // Callback handler for letter animation completions
  const handleLetterAnimationComplete = () => {
    if (state.completedAnimations + 1 >= state.totalAnimationsInPhase) {
      dispatch({ type: 'COMPLETE_PHASE' });
    } else {
      dispatch({ type: 'ANIMATION_COMPLETE' });
    }
  };
  
  // Determine letter animation state based on current phase and letter properties
  const getLetterAnimationState = (
    letterIndex: number, 
    phase: AnimationPhase,
    editPlan: EditPlan
  ): LetterAnimationState => {
    // Default animation state is 'normal'
    let animationState: LetterAnimationState = 'normal';
    
    switch (phase) {
      case AnimationPhase.DELETING:
        // Mark letters that will be deleted with 'deletion' state
        if (editPlan.deletions.includes(letterIndex)) {
          animationState = 'deletion';
        }
        break;
        
      case AnimationPhase.MOVING:
        // Check if letter is moving at all
        const isMoving = editPlan.moves.some(move => move.fromIndex === letterIndex);
        
        if (isMoving) {
          // Check if letter is a true mover (special highlight)
          if (editPlan.highlightIndices.includes(letterIndex)) {
            // True movers get a special animation state for enhanced highlighting
            animationState = 'true-mover';
          } else {
            // Regular moving letters
            animationState = 'movement';
          }
        }
        break;
        
      case AnimationPhase.INSERTING:
        // No special state for existing letters during insertion phase
        break;
        
      default:
        // Keep default 'normal' state
        break;
    }
    
    return animationState;
  };

  // Expose testing API via ref
  useImperativeHandle(ref, (): WordTransformTestingAPI => ({
    phase: state.phase,
    editPlan: state.editPlan,
    isAnimating: state.isAnimating,
    sourceLetters: state.sourceLetters,
    targetLetters: state.targetLetters,
    startAnimation,
    completedAnimations: state.completedAnimations,
    totalAnimationsInPhase: state.totalAnimationsInPhase
  }), [
    state.phase, 
    state.editPlan, 
    state.isAnimating, 
    state.sourceLetters, 
    state.targetLetters,
    state.completedAnimations,
    state.totalAnimationsInPhase
  ]);

  // Render letters based on current animation phase
  const renderLetters = () => {
    // Early return if no edit plan is available or inputs are empty
    if (!state.editPlan || misspelling === '' || correct === '') return null;
    
    // Use a non-null assertion for clarity in this scope 
    // We've already checked that state.editPlan is not null
    const editPlan = state.editPlan;
    
    switch (state.phase) {
      case AnimationPhase.IDLE:
      case AnimationPhase.DELETING:
        return (
          <div className={styles.wordContainer}>
            <AnimatePresence mode="sync">
              {state.sourceLetters.map((letter, index) => {
                // Determine if letter is being deleted in the DELETING phase
                const isDeleted = state.phase === AnimationPhase.DELETING &&
                  editPlan?.deletions.includes(index);
                
                // Set animation state based on phase and deletion status
                const animationState: LetterAnimationState = isDeleted
                  ? 'deletion'
                  : 'normal';
                
                // Should only animate letters that are actually being deleted
                const shouldAnimate = isDeleted && state.isAnimating;
                
                // Determine CSS classes - add special class for deleted letters
                const cssClasses = [
                  styles.letter,
                  isDeleted ? styles.deleted : ''
                ].filter(Boolean).join(' ');
                
                // Determine the detailed state for debugging and testing
                const detailedState = isDeleted ? 'deleted' : 'stable';
                
                return (
                  <Letter 
                    key={`source-${index}`}
                    character={letter}
                    animationState={animationState}
                    initialIndex={index}
                    onAnimationComplete={shouldAnimate ? handleLetterAnimationComplete : undefined}
                    className={cssClasses}
                    data-extended-state={detailedState}
                    data-letter-index={index}
                    data-is-deleted={isDeleted}
                    data-animation-active={shouldAnimate}
                    data-debug={debugMode}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        );
        
      case AnimationPhase.MOVING:
        return (
          <div className={styles.wordContainer}>
            <AnimatePresence mode="sync">
              {state.sourceLetters.map((letter, index) => {
                // Instead of skipping deleted letters in the moving phase,
                // mark them as exiting for proper animations
                
                // Check if this letter was deleted in previous phase
                const isDeletedLetter = editPlan?.deletions.includes(index);
                
                // If it's a deleted letter, mark as exiting
                if (isDeletedLetter) {
                  return (
                    <Letter 
                      key={`source-${index}`}
                      character={letter}
                      animationState="exiting"
                      initialIndex={index}
                      onAnimationComplete={state.isAnimating ? handleLetterAnimationComplete : undefined}
                      className={styles.deleted}
                      data-extended-state="exiting"
                      data-letter-index={index}
                      data-is-deleted={true}
                      data-animation-active={state.isAnimating}
                      data-debug={debugMode}
                    />
                  );
                }
                
                // For non-deleted letters, check if they're moved
                const moveInfo = editPlan?.moves.find(m => m.fromIndex === index);
                const animationState: LetterAnimationState = moveInfo
                  ? 'movement'
                  : 'normal';
                
                // Only animate letters that are actually moving
                const shouldAnimate = !!moveInfo && state.isAnimating;
                
                // Determine CSS classes - add special class for true movers
                // Check if this is a true mover using the original function
                const extendedState = getLetterAnimationState(index, state.phase, editPlan);
                const cssClasses = [
                  styles.letter,
                  extendedState === 'true-mover' ? styles.trueMover : ''
                ].filter(Boolean).join(' ');
                
                return (
                  <Letter 
                    key={`source-${index}`}
                    character={letter}
                    animationState={extendedState}
                    initialIndex={index}
                    onAnimationComplete={shouldAnimate ? handleLetterAnimationComplete : undefined}
                    className={cssClasses}
                    data-extended-state={extendedState}
                    data-letter-index={index}
                    data-is-moved={!!moveInfo}
                    data-move-to-index={moveInfo?.toIndex}
                    data-animation-active={shouldAnimate}
                    data-debug={debugMode}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        );
        
      case AnimationPhase.INSERTING:
        return (
          <div className={styles.wordContainer}>
            <AnimatePresence mode="sync">
              {state.targetLetters.map((letter, index) => {
                // Check if this letter is being inserted in the current phase
                const isInserted = state.phase === AnimationPhase.INSERTING &&
                  editPlan?.insertions.find(ins => ins.position === index);
                
                // Set animation state based on insertion status
                const animationState: LetterAnimationState = isInserted
                  ? 'insertion'
                  : 'normal';
                
                // Only animate letters that are actually being inserted
                const shouldAnimate = isInserted && state.isAnimating;
                
                // Determine CSS classes - add special class for inserted letters
                const cssClasses = [
                  styles.letter,
                  isInserted ? styles.inserted : ''
                ].filter(Boolean).join(' ');
                
                // Determine the detailed state for debugging and testing
                const detailedState = isInserted ? 'inserted' : 'stable';
                
                return (
                  <Letter 
                    key={`target-${index}`}
                    character={letter}
                    animationState={animationState}
                    initialIndex={index}
                    onAnimationComplete={shouldAnimate ? handleLetterAnimationComplete : undefined}
                    className={cssClasses}
                    data-extended-state={detailedState}
                    data-letter-index={index}
                    data-is-inserted={isInserted}
                    data-animation-active={shouldAnimate}
                    data-debug={debugMode}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        );
        
      case AnimationPhase.COMPLETE:
        return (
          <div className={styles.wordContainer}>
            <AnimatePresence mode="sync">
              {state.targetLetters.map((letter, index) => (
                <Letter 
                  key={`target-${index}`}
                  character={letter}
                  animationState="normal"
                  initialIndex={index}
                  className={styles.letter}
                  data-extended-state="complete"
                  data-letter-index={index}
                  data-animation-active={false}
                  data-debug={debugMode}
                />
              ))}
            </AnimatePresence>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Main rendering logic with animation state machine
  return (
    <div 
      ref={containerRef}
      className={`${styles.wordTransform} ${className}`}
      data-phase={state.phase}
      data-testid="word-transform"
      data-colors-enabled={colorsEnabled}
      data-debug-mode={debugMode}
      data-animation-active={state.isAnimating}
      data-edit-plan-loaded={!!state.editPlan}
      data-animations-progress={`${state.completedAnimations}/${state.totalAnimationsInPhase}`}
    >
      <div 
        className={styles.wordContainer} 
        id="wordContainer"
        data-testid="word-container"
      >
        {renderLetters()}
        
        {/* Debug information */}
        <div 
          className={styles.controlsContainer}
          data-testid="controls-container"
        >
          {state.editPlan && !state.isAnimating && state.phase === AnimationPhase.IDLE && (
            <button 
              onClick={startAnimation}
              className={styles.actionButton}
              data-testid="start-animation-button"
            >
              Start Animation
            </button>
          )}
          
          {state.editPlan && (
            <div 
              className={styles.debugInfo}
              data-testid="debug-info"
            >
              <div>Phase: {state.phase}</div>
              <div>Animations: {state.completedAnimations} / {state.totalAnimationsInPhase}</div>
              <div>Edit Plan: {state.editPlan.deletions.length} deletions, {state.editPlan.moves.length} moves, {state.editPlan.insertions.length} insertions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Add display name for better debugging
WordTransform.displayName = 'WordTransform';

export default WordTransform; 