import { createMachine, assign } from 'xstate';

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
 * Define the type for setup parameters that will be passed when creating the machine instance
 */
export type WordTransformSetupParams = {
  deletions: number;
  moves: number;
  insertions: number;
};

/**
 * Creates a new instance of the machine with the specified initial context
 */
export const createWordTransformMachine = (input?: WordTransformSetupParams) => {
  return createMachine({
    id: 'wordTransform',
    initial: 'idle',
    context: {
      deletions: input?.deletions ?? 0,
      moves: input?.moves ?? 0,
      insertions: input?.insertions ?? 0,
    },
    states: {
      idle: {
        on: {
          START: [
            {
              target: 'deleting',
              guard: ({ context }) => context.deletions > 0,
            },
            {
              target: 'moving',
              guard: ({ context }) => context.moves > 0 && context.deletions === 0,
            },
            {
              target: 'inserting',
              guard: ({ context }) => (
                context.insertions > 0 && 
                context.moves === 0 && 
                context.deletions === 0
              ),
            },
            {
              target: 'complete',
            },
          ],
          RESET: {
            actions: 'resetContext',
          },
        },
      },
      deleting: {
        on: {
          DONE_PHASE: [
            {
              target: 'moving',
              guard: ({ context }) => context.moves > 0,
            },
            {
              target: 'inserting',
              guard: ({ context }) => context.insertions > 0 && context.moves === 0,
            },
            {
              target: 'complete',
            },
          ],
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
        },
      },
      moving: {
        on: {
          DONE_PHASE: [
            {
              target: 'inserting',
              guard: ({ context }) => context.insertions > 0,
            },
            {
              target: 'complete',
            },
          ],
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
        },
      },
      inserting: {
        on: {
          DONE_PHASE: {
            target: 'complete',
          },
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
        },
      },
      complete: {
        on: {
          RESET: {
            target: 'idle',
            actions: 'resetContext',
          },
          RESTART: {
            target: 'idle',
            // No need to reset context for replay - we want to keep the same edit plan
          },
        },
      },
    },
  }, {
    actions: {
      resetContext: assign(() => ({
        deletions: 0,
        moves: 0,
        insertions: 0,
      })),
    },
  });
}; 