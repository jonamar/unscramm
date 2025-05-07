import React, { useReducer, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Letter, { LetterAnimationState } from './Letter';
import { computeEditPlan, EditPlan } from '../utils/editPlan';
import styles from './WordTransform.module.css';

/**
 * Animation phases for the word transformation sequence
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
  /** Optional speed multiplier for animations (default: 1) */
  speed?: number;
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
  /** Optional flag for canceling mid-animation when props change (default: true) */
  cancelOnPropsChange?: boolean;
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
  | { type: 'INITIALIZE'; payload: { sourceWord: string; targetWord: string } }
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
 * Reducer function for animation state management
 */
function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case 'INITIALIZE':
      const { sourceWord, targetWord } = action.payload;
      const sourceLetters = sourceWord.split('');
      const targetLetters = targetWord.split('');
      const editPlan = computeEditPlan(sourceWord, targetWord);
      
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
      
    case 'COMPLETE_PHASE':
      // Determine next phase based on current phase
      let nextPhase = state.phase;
      
      if (state.phase === AnimationPhase.DELETING) {
        nextPhase = AnimationPhase.MOVING;
      } else if (state.phase === AnimationPhase.MOVING) {
        nextPhase = AnimationPhase.INSERTING;
      } else if (state.phase === AnimationPhase.INSERTING) {
        nextPhase = AnimationPhase.COMPLETE;
      }
      
      return {
        ...state,
        phase: nextPhase,
        completedAnimations: 0
      };
      
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
  speed = 1,
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
  
  // Initialize with words when props change
  useEffect(() => {
    if (misspelling !== '' && correct !== '') {
      // Reset animation if props change during animation
      if (state.isAnimating && cancelOnPropsChange) {
        dispatch({ type: 'RESET' });
      }
      
      // Initialize with new words
      dispatch({
        type: 'INITIALIZE',
        payload: { sourceWord: misspelling, targetWord: correct }
      });
    }
  }, [misspelling, correct, cancelOnPropsChange, state.isAnimating]);
  
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
      container.style.setProperty('--remove-duration', `${removeBase / speed}s`);
      container.style.setProperty('--add-duration', `${addBase / speed}s`);
      container.style.setProperty('--reorder-duration', `${reorderBase / speed}s`);
    }
  }, [speed]);

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

    // Set up total animations expected in each phase
    let totalAnimationsInPhase = 0;

    if (state.phase === AnimationPhase.DELETING) {
      totalAnimationsInPhase = state.editPlan.deletions.length;
      // If no deletions, move to next phase immediately
      if (totalAnimationsInPhase === 0) {
        dispatch({ type: 'COMPLETE_PHASE' });
      } else {
        dispatch({ 
          type: 'START_PHASE', 
          payload: { 
            phase: AnimationPhase.DELETING, 
            total: totalAnimationsInPhase 
          } 
        });
      }
    } else if (state.phase === AnimationPhase.MOVING) {
      totalAnimationsInPhase = state.editPlan.moves.length;
      // If no moves, move to next phase immediately
      if (totalAnimationsInPhase === 0) {
        dispatch({ type: 'COMPLETE_PHASE' });
      } else {
        dispatch({ 
          type: 'START_PHASE', 
          payload: { 
            phase: AnimationPhase.MOVING, 
            total: totalAnimationsInPhase 
          } 
        });
      }
    } else if (state.phase === AnimationPhase.INSERTING) {
      totalAnimationsInPhase = state.editPlan.insertions.length;
      // If no insertions, move to next phase immediately
      if (totalAnimationsInPhase === 0) {
        dispatch({ type: 'COMPLETE_PHASE' });
      } else {
        dispatch({ 
          type: 'START_PHASE', 
          payload: { 
            phase: AnimationPhase.INSERTING, 
            total: totalAnimationsInPhase 
          } 
        });
      }
    } else if (state.phase === AnimationPhase.COMPLETE) {
      // Animation sequence complete
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }

    // Notify of phase change
    handlePhaseChange(state.phase);
  }, [state.phase, state.editPlan, handlePhaseChange, onAnimationComplete]);

  // Effect to check if all animations in the current phase are complete
  useEffect(() => {
    if (state.isAnimating && 
        state.completedAnimations > 0 && 
        state.completedAnimations >= state.totalAnimationsInPhase) {
      // Move to the next phase when all animations in current phase complete
      dispatch({ type: 'COMPLETE_PHASE' });
    }
  }, [state.completedAnimations, state.totalAnimationsInPhase, state.isAnimating]);

  // Function to start animation sequence
  const startAnimation = () => {
    if (!state.isAnimating && state.editPlan) {
      if (onAnimationStart) {
        onAnimationStart();
      }
      dispatch({ type: 'START_ANIMATION' });
    }
  };

  // Handle animation completion for a single letter
  const handleLetterAnimationComplete = () => {
    dispatch({ type: 'ANIMATION_COMPLETE' });
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
        // Mark letters that will move with 'movement' state
        // Highlight true movers with more emphasis
        const isMoving = editPlan.moves.some(move => move.fromIndex === letterIndex);
        const isTrueMover = editPlan.highlightIndices.includes(letterIndex);
        
        if (isMoving || isTrueMover) {
          animationState = 'movement';
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
                
                const animationState = getLetterAnimationState(
                  index, 
                  state.phase,
                  editPlan
                );
                
                // Only animate letters in specific states for the current phase
                const shouldAnimate = 
                  (state.phase === AnimationPhase.DELETING && animationState === 'deletion') ||
                  (state.phase === AnimationPhase.MOVING && animationState === 'movement');
                
                return (
                  <Letter 
                    key={`source-${index}`}
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