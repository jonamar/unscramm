import React, { useReducer, useEffect, useRef, useMemo } from 'react';
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
}

/**
 * Extends the standard animation states to include a special true-mover state
 */
type ExtendedLetterAnimationState = LetterAnimationState | 'true-mover';

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
  | { type: 'RESET' };

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
      
    default:
      return state;
  }
}

/**
 * WordTransform component that orchestrates the animation sequence between a misspelled
 * word and its correct spelling using Letter components.
 */
const WordTransform: React.FC<WordTransformProps> = ({
  misspelling,
  correct,
  speedMultiplier = 1,
  colorsEnabled = true,
  className = '',
  onAnimationStart,
  onAnimationComplete,
  onPhaseChange,
  cancelOnPropsChange = true
}) => {
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
    if (misspelling !== '' && correct !== '' && memoizedEditPlan) {
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
        getTotal: () => state.editPlan?.moves.length || 0,
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
  ): ExtendedLetterAnimationState => {
    // Default animation state is 'normal'
    let animationState: ExtendedLetterAnimationState = 'normal';
    
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

  // Map extended animation state to standard Letter component animation state
  const mapToLetterAnimationState = (
    extendedState: ExtendedLetterAnimationState
  ): LetterAnimationState => {
    // Map our extended state to the states supported by the Letter component
    switch(extendedState) {
      case 'true-mover':
        // 'true-mover' is not directly supported by Letter component,
        // so we map it to the standard 'movement' state
        return 'movement';
      default:
        // Other states can be passed through directly
        return extendedState as LetterAnimationState;
    }
  };

  // Render letters based on current animation phase
  const renderLetters = () => {
    // Early return if no edit plan is available
    if (!state.editPlan) return null;
    
    // Use a non-null assertion for clarity in this scope 
    // We've already checked that state.editPlan is not null
    const editPlan = state.editPlan;
    
    switch (state.phase) {
      case AnimationPhase.IDLE:
      case AnimationPhase.DELETING:
      case AnimationPhase.MOVING:
        // Show source letters (from misspelled word)
        return (
          <div className={styles.lettersContainer}>
            <AnimatePresence>
              {state.sourceLetters.map((letter, index) => {
                // Skip deleted letters in moving phase
                if (state.phase === AnimationPhase.MOVING && 
                    editPlan.deletions.includes(index)) {
                  return null;
                }
                
                const extendedAnimationState = getLetterAnimationState(
                  index, 
                  state.phase,
                  editPlan
                );
                
                const animationState = mapToLetterAnimationState(extendedAnimationState);
                
                // Only animate letters in specific states for the current phase
                const shouldAnimate = 
                  (state.phase === AnimationPhase.DELETING && animationState === 'deletion') ||
                  (state.phase === AnimationPhase.MOVING && 
                   (extendedAnimationState === 'movement' || extendedAnimationState === 'true-mover'));
                
                // Determine CSS classes - add special class for true movers
                const cssClasses = [
                  styles.letter,
                  extendedAnimationState === 'true-mover' ? styles.trueMover : ''
                ].filter(Boolean).join(' ');
                
                return (
                  <Letter 
                    key={`source-${index}`}
                    character={letter}
                    animationState={animationState}
                    initialIndex={index}
                    onAnimationComplete={shouldAnimate ? handleLetterAnimationComplete : undefined}
                    className={cssClasses}
                    // Add a data attribute to help with testing and debugging
                    data-extended-state={extendedAnimationState}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        );
        
      case AnimationPhase.INSERTING:
      case AnimationPhase.COMPLETE:
        // Show target letters (from correct word)
        return (
          <div className={styles.lettersContainer}>
            <AnimatePresence>
              {state.targetLetters.map((letter, index) => {
                // Check if this letter is being inserted
                const isInserted = editPlan.insertions.some(
                  insertion => insertion.position === index
                );
                
                // Determine animation state based on current phase and insertion status
                const animationState: LetterAnimationState = 
                  (state.phase === AnimationPhase.INSERTING && isInserted) 
                    ? 'insertion' 
                    : 'normal';
                
                // Only trigger animation completion callback for inserted letters
                const shouldAnimate = 
                  state.phase === AnimationPhase.INSERTING && animationState === 'insertion';
                
                return (
                  <Letter 
                    key={`target-${index}`}
                    character={letter}
                    animationState={animationState}
                    initialIndex={index}
                    onAnimationComplete={shouldAnimate ? handleLetterAnimationComplete : undefined}
                    className={styles.letter}
                  />
                );
              })}
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
    >
      <div className={styles.wordContainer} id="wordContainer">
        {renderLetters()}
        
        {/* Debug information */}
        <div className={styles.controlsContainer}>
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
            <div className={styles.debugInfo}>
              <div>Phase: {state.phase}</div>
              <div>Animations: {state.completedAnimations} / {state.totalAnimationsInPhase}</div>
              <div>Edit Plan: {state.editPlan.deletions.length} deletions, {state.editPlan.moves.length} moves, {state.editPlan.insertions.length} insertions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordTransform; 