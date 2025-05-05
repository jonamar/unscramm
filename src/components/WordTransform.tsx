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
  }, [misspelling, correct, cancelOnPropsChange]);
  
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
  
  // Main rendering logic - just a skeleton for now
  return (
    <div 
      ref={containerRef}
      className={`${styles.wordTransform} ${className}`}
      data-phase={state.phase}
      data-testid="word-transform"
      data-colors-enabled={colorsEnabled}
    >
      <div className={styles.wordContainer} id="wordContainer">
        {/* Animation logic and Letter rendering will be implemented in subsequent subtasks */}
        <div>Misspelled: {misspelling}</div>
        <div>Correct: {correct}</div>
        <div>Current phase: {state.phase}</div>
      </div>
    </div>
  );
};

export default WordTransform; 