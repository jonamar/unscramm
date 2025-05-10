import { jest } from '@jest/globals';

/**
 * These are Jest mocks for the editPlan module.
 * 
 * Since this is just a mock file, we can disable some TypeScript rules
 * as the unused types and parameters are intentional for the mock API.
 */

/**
 * Mock interfaces replicating the actual module
 */
export interface Insertion {
  letter: string;
  position: number;
}

export interface Move {
  fromIndex: number;
  toIndex: number;
}

/**
 * Type for the return value of our mocked functions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MockEditPlan = {
  deletions: number[];
  insertions: { letter: string; position: number }[];
  moves: { fromIndex: number; toIndex: number }[];
  highlightIndices: number[];
};

/**
 * Mock implementation of computeEditPlan for testing
 */
export const computeEditPlan = jest.fn(() => ({
  deletions: [0],
  insertions: [{ letter: 'a', position: 1 }],
  moves: [{ fromIndex: 1, toIndex: 2 }],
  highlightIndices: [1]
}));

/**
 * Mock implementation of computeEditPlanFromPairs for testing
 */
export const computeEditPlanFromPairs = jest.fn(() => ({
  deletions: [0],
  insertions: [{ letter: 'a', position: 1 }],
  moves: [{ fromIndex: 1, toIndex: 2 }],
  highlightIndices: [1]
}));

/**
 * Mock implementation of identifyTrueMovers for completeness
 */
export const identifyTrueMovers = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (pairs: Array<[number, number]>): number[] => {
    return []; // Default implementation returns no true movers
  }
); 