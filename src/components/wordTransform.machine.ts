import { useReducer, useCallback, useMemo } from 'react';

/**
 * Animation phases for the word transformation sequence
 * - idle: Waiting to start
 * - deleting: Deleting letters
 * - moving: Moving letters
 * - inserting: Inserting new letters
 * - complete: Animation finished
 */
export type WordTransformPhase = 'idle' | 'deleting' | 'moving' | 'inserting' | 'complete';

/**
 * Events that drive the state machine
 */
export type WordTransformMachineEvent =
  | { type: 'START' }
  | { type: 'DONE_PHASE' }
  | { type: 'RESET' }
  | { type: 'RESTART' };

/**
 * Context for the state machine
 * Holds counts for each operation type
 */
export type WordTransformMachineContext = {
  deletions: number;
  moves: number;
  insertions: number;
};

/**
 * Define the type for setup parameters that will be used to configure the machine
 */
export interface WordTransformSetupParams {
  deletions: number;
  moves: number;
  insertions: number;
}

/**
 * State machine state combining phase and context
 */
export interface WordTransformMachineState {
  phase: WordTransformPhase;
  context: WordTransformMachineContext;
}

/**
 * Reducer function that handles state transitions
 */
function wordTransformMachineReducer(
  state: WordTransformMachineState,
  event: WordTransformMachineEvent
): WordTransformMachineState {
  switch (state.phase) {
    case 'idle':
      if (event.type === 'START') {
        // Start with deleting phase, or skip to moving if no deletions
        if (state.context.deletions > 0) {
          return { ...state, phase: 'deleting' };
        } else if (state.context.moves > 0) {
          return { ...state, phase: 'moving' };
        } else if (state.context.insertions > 0) {
          return { ...state, phase: 'inserting' };
        } else {
          // No operations needed, go straight to complete
          return { ...state, phase: 'complete' };
        }
      }
      break;
      
    case 'deleting':
      if (event.type === 'DONE_PHASE') {
        // Move to moving phase if there are moves, otherwise to inserting
        if (state.context.moves > 0) {
          return { ...state, phase: 'moving' };
        } else if (state.context.insertions > 0) {
          return { ...state, phase: 'inserting' };
        } else {
          return { ...state, phase: 'complete' };
        }
      }
      break;
      
    case 'moving':
      if (event.type === 'DONE_PHASE') {
        // Move to inserting phase if there are insertions, otherwise complete
        if (state.context.insertions > 0) {
          return { ...state, phase: 'inserting' };
        } else {
          return { ...state, phase: 'complete' };
        }
      }
      break;
      
    case 'inserting':
      if (event.type === 'DONE_PHASE') {
        return { ...state, phase: 'complete' };
      }
      break;
      
    case 'complete':
      if (event.type === 'RESTART') {
        return { ...state, phase: 'idle' };
      }
      break;
  }
  
  // Handle RESET event from any state
  if (event.type === 'RESET') {
    return { ...state, phase: 'idle' };
  }
  
  // Return current state if no transition applies
  return state;
}

/**
 * Custom hook that provides the same API as the XState machine
 */
export function useWordTransformMachine(setupParams?: WordTransformSetupParams) {
  // Initialize state with the provided parameters or defaults
  const initialState: WordTransformMachineState = useMemo(() => ({
    phase: 'idle',
    context: {
      deletions: setupParams?.deletions || 0,
      moves: setupParams?.moves || 0,
      insertions: setupParams?.insertions || 0,
    }
  }), [setupParams?.deletions, setupParams?.moves, setupParams?.insertions]);

  const [state, dispatch] = useReducer(wordTransformMachineReducer, initialState);

  // Provide a send function that matches XState's API
  const send = useCallback((event: WordTransformMachineEvent) => {
    dispatch(event);
  }, []);

  // Return an object that matches XState's useMachine hook API
  return [
    {
      value: state.phase,
      context: state.context,
    },
    send
  ] as const;
}

/**
 * Creates a new instance of the machine with the specified initial context
 * This function maintains compatibility with the previous XState API
 */
export const createWordTransformMachine = (input?: WordTransformSetupParams) => {
  // Return a mock machine object that matches the expected interface
  return {
    start: () => {},
    send: () => {},
    getSnapshot: () => ({ 
      value: 'idle' as WordTransformPhase, 
      context: { 
        deletions: input?.deletions || 0, 
        moves: input?.moves || 0, 
        insertions: input?.insertions || 0 
      } 
    }),
  };
}; 