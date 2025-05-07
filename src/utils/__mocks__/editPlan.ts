import { jest } from '@jest/globals';

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

export interface EditPlan {
  deletions: number[];
  insertions: Insertion[];
  moves: Move[];
  highlightIndices: number[];
}

/**
 * Mock implementation of computeEditPlan that can be configured in tests
 */
export const computeEditPlan = jest.fn((sourceWord: string, targetWord: string): EditPlan => ({
  deletions: [0], // Default: delete first character
  insertions: [{letter: 'i', position: 3}], // Default: insert 'i' at position 3
  moves: [{fromIndex: 3, toIndex: 4}], // Default: move character from position 3 to 4
  highlightIndices: [3], // Default: highlight character at position 3
}));

/**
 * Mock implementation of identifyTrueMovers for completeness
 */
export const identifyTrueMovers = jest.fn((pairs: Array<[number, number]>): number[] => {
  return []; // Default implementation returns no true movers
}); 